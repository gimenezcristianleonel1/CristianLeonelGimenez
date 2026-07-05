import { BenefitType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { AppError } from "./api-utils";
import { MovementReason, MovementType, PaymentMethod } from "./enums";

type TxClient = Prisma.TransactionClient;

type StockMovementInput = {
  variantId: number;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  unitCost?: number | null;
  extraCost?: number | null;
  lot?: string | null;
  supplierId?: number | null;
  notes?: string | null;
  date?: Date;
};

/**
 * Registra un movimiento de stock (entrada o salida) y actualiza el
 * stock cacheado de la variante dentro de una única transacción, evitando
 * que el stock quede negativo de forma inconsistente.
 */
export async function registerStockMovement(input: StockMovementInput) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
    });
    if (!variant) {
      throw new AppError("La variante indicada no existe", 404);
    }

    if (input.type === "SALIDA" && variant.currentStock - input.quantity < 0) {
      throw new AppError(
        `Stock insuficiente para "${variant.name}". Disponible: ${variant.currentStock}, solicitado: ${input.quantity}`,
        409
      );
    }

    const movement = await tx.stockMovement.create({
      data: {
        variantId: input.variantId,
        type: input.type,
        reason: input.reason,
        quantity: input.quantity,
        unitCost: input.unitCost ?? null,
        extraCost: input.extraCost ?? 0,
        lot: input.lot ?? null,
        supplierId: input.supplierId ?? null,
        notes: input.notes ?? null,
        date: input.date ?? new Date(),
      },
    });

    await tx.productVariant.update({
      where: { id: input.variantId },
      data: {
        currentStock:
          input.type === "ENTRADA"
            ? { increment: input.quantity }
            : { decrement: input.quantity },
      },
    });

    return movement;
  });
}

type SaleItemInput = {
  variantId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

type SaleInput = {
  items: SaleItemInput[];
  discount?: number;
  paymentMethod: PaymentMethod;
  cashSessionId?: number | null;
  notes?: string | null;
};

/**
 * Registra una venta completa: valida stock de cada ítem, crea la venta,
 * sus ítems y los movimientos de salida (VENTA) correspondientes, todo de
 * forma atómica para que nunca quede stock negativo por una venta parcial.
 */
export async function registerSale(input: SaleInput) {
  return prisma.$transaction(async (tx) => {
    if (input.cashSessionId) {
      const session = await tx.cashSession.findUnique({ where: { id: input.cashSessionId } });
      if (!session || session.status !== "ABIERTA") {
        throw new AppError("No hay una caja abierta válida para registrar la venta", 409);
      }
    }

    const variants = await tx.productVariant.findMany({
      where: { id: { in: input.items.map((i) => i.variantId) } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    for (const item of input.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new AppError(`La variante ${item.variantId} no existe`, 404);
      }
      if (variant.currentStock - item.quantity < 0) {
        throw new AppError(
          `Stock insuficiente para "${variant.name}". Disponible: ${variant.currentStock}, solicitado: ${item.quantity}`,
          409
        );
      }
      subtotal += item.quantity * item.unitPrice - (item.discount ?? 0);
    }

    const discount = input.discount ?? 0;
    const total = Math.max(subtotal - discount, 0);

    // Se captura el costo promedio ponderado vigente en cada ítem para que
    // los reportes históricos de rentabilidad no cambien retroactivamente
    // cuando ingresen nuevas compras/producción a un costo distinto.
    const costByVariant = new Map<number, number>();
    for (const variantId of new Set(input.items.map((i) => i.variantId))) {
      costByVariant.set(variantId, await weightedAverageCostTx(tx, variantId));
    }

    const sale = await tx.sale.create({
      data: {
        subtotal,
        discount,
        total,
        paymentMethod: input.paymentMethod,
        cashSessionId: input.cashSessionId ?? null,
        notes: input.notes ?? null,
        items: {
          create: input.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: costByVariant.get(item.variantId) ?? 0,
            discount: item.discount ?? 0,
            subtotal: item.quantity * item.unitPrice - (item.discount ?? 0),
          })),
        },
      },
      include: { items: true },
    });

    for (const item of input.items) {
      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "SALIDA",
          reason: "VENTA",
          quantity: item.quantity,
          saleId: sale.id,
        },
      });
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { currentStock: { decrement: item.quantity } },
      });
    }

    return sale;
  });
}

/**
 * Anula una venta: revierte el stock de cada ítem y marca la venta como ANULADA.
 */
export async function voidSale(saleId: number) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: saleId }, include: { items: true } });
    if (!sale) throw new AppError("Venta no encontrada", 404);
    if (sale.status === "ANULADA") throw new AppError("La venta ya está anulada", 409);

    for (const item of sale.items) {
      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "ENTRADA",
          reason: "DEVOLUCION",
          quantity: item.quantity,
          saleId: sale.id,
          notes: "Reversión automática por anulación de venta",
        },
      });
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { currentStock: { increment: item.quantity } },
      });
    }

    return tx.sale.update({ where: { id: saleId }, data: { status: "ANULADA" } });
  });
}

/**
 * Costo Promedio Ponderado (PPP): promedia el costo unitario efectivo
 * (costo de ingreso + costos adicionales del lote) de todas las entradas
 * históricas de una variante, ponderado por cantidad.
 */
export async function weightedAverageCostTx(client: TxClient, variantId: number): Promise<number> {
  const entries = await client.stockMovement.findMany({
    where: { variantId, type: "ENTRADA", unitCost: { not: null } },
  });
  if (entries.length === 0) return 0;

  const totalQty = entries.reduce((acc, e) => acc + e.quantity, 0);
  const totalCost = entries.reduce(
    (acc, e) => acc + e.quantity * (e.unitCost ?? 0) + e.extraCost,
    0
  );
  if (totalQty === 0) return 0;
  return totalCost / totalQty;
}

export async function weightedAverageCost(variantId: number): Promise<number> {
  return weightedAverageCostTx(prisma, variantId);
}

export function effectivePrice(variant: { priceOverride: number | null }, product: { basePrice: number }) {
  return variant.priceOverride ?? product.basePrice;
}

export type ActiveBenefit = { id: number; type: BenefitType; value: number; startDate: Date; endDate: Date };

/** Trae, para un conjunto de variantes, el beneficio vigente "ahora" (si existe alguno). */
export async function getActiveBenefitsMap(
  variantIds: number[],
  now: Date = new Date()
): Promise<Map<number, ActiveBenefit>> {
  if (variantIds.length === 0) return new Map();
  const benefits = await prisma.benefit.findMany({
    where: { variantId: { in: variantIds }, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: "desc" },
  });
  const map = new Map<number, ActiveBenefit>();
  for (const b of benefits) {
    if (!map.has(b.variantId)) map.set(b.variantId, b);
  }
  return map;
}

/** Aplica un beneficio (si hay uno vigente) sobre el precio regular. */
export function applyBenefit(regularPrice: number, benefit?: ActiveBenefit | null): number {
  if (!benefit) return regularPrice;
  if (benefit.type === "PERCENTAGE") {
    return Math.max(regularPrice * (1 - benefit.value / 100), 0);
  }
  // FIXED_PRICE: nunca debería quedar por encima del precio regular.
  return Math.min(benefit.value, regularPrice);
}

/** Precio final a cobrar: precio regular con el beneficio vigente (si lo hay) aplicado. */
export function effectiveSalePrice(
  variant: { priceOverride: number | null },
  product: { basePrice: number },
  benefit?: ActiveBenefit | null
) {
  return applyBenefit(effectivePrice(variant, product), benefit);
}

export function effectiveMinStock(
  variant: { minStockOverride: number | null },
  product: { minStock: number }
) {
  return variant.minStockOverride ?? product.minStock;
}

export type MarginInfo = {
  variantId: number;
  variantName: string;
  sku: string;
  currentStock: number;
  averageCost: number;
  salePrice: number;
  marginAbsolute: number;
  marginPercent: number;
};

export async function computeMarginsForAllVariants(): Promise<MarginInfo[]> {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: { product: true },
  });
  const benefitsMap = await getActiveBenefitsMap(variants.map((v) => v.id));

  const results: MarginInfo[] = [];
  for (const variant of variants) {
    const averageCost = await weightedAverageCost(variant.id);
    const salePrice = effectiveSalePrice(variant, variant.product, benefitsMap.get(variant.id));
    const marginAbsolute = salePrice - averageCost;
    const marginPercent = salePrice > 0 ? (marginAbsolute / salePrice) * 100 : 0;
    results.push({
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
      currentStock: variant.currentStock,
      averageCost,
      salePrice,
      marginAbsolute,
      marginPercent,
    });
  }
  return results;
}

