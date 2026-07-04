import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { effectiveMinStock } from "@/lib/stock";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function GET(request: NextRequest) {
  try {
    const days = Math.min(Number(request.nextUrl.searchParams.get("days") ?? "30"), 365);
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - (days - 1));

    const sales = await prisma.sale.findMany({
      where: { status: "COMPLETADA", date: { gte: since } },
      include: { items: true },
      orderBy: { date: "asc" },
    });

    // Serie diaria: ventas totales y ganancia neta (ingreso - costo de mercadería vendida)
    const byDay = new Map<string, { total: number; profit: number; count: number }>();
    for (const sale of sales) {
      const key = startOfDay(sale.date).toISOString().slice(0, 10);
      const entry = byDay.get(key) ?? { total: 0, profit: 0, count: 0 };
      entry.total += sale.total;
      const cogs = sale.items.reduce((acc, i) => acc + i.unitCost * i.quantity, 0);
      entry.profit += sale.total - cogs;
      entry.count += 1;
      byDay.set(key, entry);
    }
    const salesSeries = Array.from(byDay.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top 5 productos más vendidos (por cantidad) en el rango
    const qtyByVariant = new Map<number, number>();
    const revenueByVariant = new Map<number, number>();
    for (const sale of sales) {
      for (const item of sale.items) {
        qtyByVariant.set(item.variantId, (qtyByVariant.get(item.variantId) ?? 0) + item.quantity);
        revenueByVariant.set(
          item.variantId,
          (revenueByVariant.get(item.variantId) ?? 0) + item.subtotal
        );
      }
    }
    const topVariantIds = Array.from(qtyByVariant.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    const topVariants = await prisma.productVariant.findMany({
      where: { id: { in: topVariantIds } },
      include: { product: true },
    });
    const topProducts = topVariantIds.map((id) => {
      const variant = topVariants.find((v) => v.id === id);
      return {
        variantId: id,
        name: variant ? variant.name : "N/D",
        sku: variant?.sku ?? "",
        quantitySold: qtyByVariant.get(id) ?? 0,
        revenue: revenueByVariant.get(id) ?? 0,
      };
    });

    // Alertas de stock bajo
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: true },
    });
    const lowStock = variants
      .map((variant) => ({
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku,
        productName: variant.product.name,
        currentStock: variant.currentStock,
        minStock: effectiveMinStock(variant, variant.product),
      }))
      .filter((v) => v.currentStock <= v.minStock)
      .sort((a, b) => a.currentStock - b.currentStock);

    // Balance general: ingresos totales - costos totales (mercadería + fijos) = utilidad neta
    const allCompletedSales = await prisma.sale.findMany({
      where: { status: "COMPLETADA" },
      include: { items: true },
    });
    const totalIncome = allCompletedSales.reduce((acc, s) => acc + s.total, 0);
    const totalCogs = allCompletedSales.reduce(
      (acc, s) => acc + s.items.reduce((a, i) => a + i.unitCost * i.quantity, 0),
      0
    );
    const fixedCosts = await prisma.fixedCost.findMany({ where: { isActive: true } });
    const totalFixedCosts = fixedCosts.reduce((acc, c) => {
      // Normaliza todos los costos fijos a una equivalencia mensual para el balance.
      const monthlyEquivalent =
        c.frequency === "SEMANAL"
          ? c.amount * 4.345
          : c.frequency === "ANUAL"
          ? c.amount / 12
          : c.frequency === "UNICO"
          ? c.amount
          : c.amount;
      return acc + monthlyEquivalent;
    }, 0);
    const netProfit = totalIncome - totalCogs - totalFixedCosts;

    return jsonOk({
      salesSeries,
      topProducts,
      lowStock,
      balance: {
        totalIncome,
        totalCogs,
        totalFixedCosts,
        netProfit,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
