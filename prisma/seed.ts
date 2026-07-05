import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Etiquetas de campo por defecto (el usuario puede editarlas desde
// Configuración > Etiquetas sin tocar el código).
const DEFAULT_LABELS: Record<string, string> = {
  product: "Producto",
  product_plural: "Productos",
  variant: "Variante",
  variant_plural: "Variantes",
  category: "Categoría",
  category_plural: "Categorías",
  attribute: "Atributo",
  attribute_plural: "Atributos",
  sku: "SKU / Código",
  minStock: "Stock Mínimo",
  basePrice: "Precio de Venta",
  lot: "Lote",
  supplier: "Proveedor",
};

const DEFAULT_SETTINGS: Record<string, string> = {
  business_name: "Aramí del Monte",
  currency_symbol: "$",
  low_stock_alert_enabled: "true",
  whatsapp_number: "",
  store_tagline: "Yerba mate de producción propia, directo del monte a tu mate",
};

async function main() {
  console.log("Sembrando configuración...");
  for (const [fieldKey, label] of Object.entries(DEFAULT_LABELS)) {
    await prisma.fieldLabel.upsert({
      where: { fieldKey },
      update: {},
      create: { fieldKey, label },
    });
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log("Sembrando categorías y atributos de ejemplo (Yerba Mate)...");
  const category = await prisma.category.upsert({
    where: { name: "Yerba Mate" },
    update: {},
    create: { name: "Yerba Mate", description: "Yerba mate elaborada y sin palo" },
  });

  const moliendaAttr = await prisma.attribute.upsert({
    where: { name: "Molienda" },
    update: {},
    create: { name: "Molienda" },
  });
  const tamanoAttr = await prisma.attribute.upsert({
    where: { name: "Tamaño" },
    update: {},
    create: { name: "Tamaño" },
  });

  const suave = await prisma.attributeValue.upsert({
    where: { attributeId_value: { attributeId: moliendaAttr.id, value: "Suave" } },
    update: {},
    create: { attributeId: moliendaAttr.id, value: "Suave" },
  });
  const fuerte = await prisma.attributeValue.upsert({
    where: { attributeId_value: { attributeId: moliendaAttr.id, value: "Fuerte" } },
    update: {},
    create: { attributeId: moliendaAttr.id, value: "Fuerte" },
  });
  const g500 = await prisma.attributeValue.upsert({
    where: { attributeId_value: { attributeId: tamanoAttr.id, value: "500g" } },
    update: {},
    create: { attributeId: tamanoAttr.id, value: "500g" },
  });
  const kg1 = await prisma.attributeValue.upsert({
    where: { attributeId_value: { attributeId: tamanoAttr.id, value: "1kg" } },
    update: {},
    create: { attributeId: tamanoAttr.id, value: "1kg" },
  });

  const product = await prisma.product.upsert({
    where: { sku: "YM-COMP" },
    update: {},
    create: {
      name: "Yerba Mate Compuesta",
      sku: "YM-COMP",
      description: "Yerba mate compuesta de producción propia",
      categoryId: category.id,
      unit: "paquete",
      minStock: 20,
      basePrice: 3500,
      isActive: true,
    },
  });

  const variantSuave500 = await prisma.productVariant.upsert({
    where: { sku: "YM-COMP-SUAVE-500" },
    update: {},
    create: {
      productId: product.id,
      sku: "YM-COMP-SUAVE-500",
      name: "Suave 500g",
      priceOverride: 3500,
      isActive: true,
    },
  });
  const variantFuerte1kg = await prisma.productVariant.upsert({
    where: { sku: "YM-COMP-FUERTE-1KG" },
    update: {},
    create: {
      productId: product.id,
      sku: "YM-COMP-FUERTE-1KG",
      name: "Fuerte 1kg",
      priceOverride: 6500,
      isActive: true,
    },
  });

  console.log("Sembrando beneficio de ejemplo (oferta temporal vigente)...");
  const existingBenefit = await prisma.benefit.findFirst({ where: { variantId: variantFuerte1kg.id } });
  if (!existingBenefit) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 2);
    const end = new Date(now);
    end.setDate(end.getDate() + 12);
    await prisma.benefit.create({
      data: {
        variantId: variantFuerte1kg.id,
        type: "PERCENTAGE",
        value: 15,
        startDate: start,
        endDate: end,
      },
    });
  }

  for (const [variantId, attributeValueId] of [
    [variantSuave500.id, suave.id],
    [variantSuave500.id, g500.id],
    [variantFuerte1kg.id, fuerte.id],
    [variantFuerte1kg.id, kg1.id],
  ]) {
    await prisma.variantAttributeValue.upsert({
      where: { variantId_attributeValueId: { variantId, attributeValueId } },
      update: {},
      create: { variantId, attributeValueId },
    });
  }

  const supplier = await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Acopiador Local S.R.L.",
      contactName: "Juan Pérez",
      phone: "+54 9 3751 000000",
      email: "contacto@acopiador.example",
    },
  });

  console.log("Sembrando movimientos de stock iniciales...");
  await prisma.$transaction(async (tx) => {
    const entrada1 = await tx.stockMovement.create({
      data: {
        variantId: variantSuave500.id,
        type: "ENTRADA",
        reason: "PRODUCCION",
        quantity: 100,
        unitCost: 1800,
        lot: "L-2026-01",
        notes: "Producción propia inicial",
      },
    });
    await tx.productVariant.update({
      where: { id: variantSuave500.id },
      data: { currentStock: { increment: entrada1.quantity } },
    });

    const entrada2 = await tx.stockMovement.create({
      data: {
        variantId: variantFuerte1kg.id,
        type: "ENTRADA",
        reason: "COMPRA",
        quantity: 50,
        unitCost: 3200,
        lot: "L-2026-02",
        supplierId: supplier.id,
        notes: "Compra a proveedor",
      },
    });
    await tx.productVariant.update({
      where: { id: variantFuerte1kg.id },
      data: { currentStock: { increment: entrada2.quantity } },
    });
  });

  console.log("Sembrando costo fijo de ejemplo...");
  await prisma.fixedCost.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Alquiler del local",
      amount: 150000,
      frequency: "MENSUAL",
      notes: "Alquiler mensual del depósito",
    },
  });

  console.log("Sembrando venta de ejemplo...");
  const openSession = await prisma.cashSession.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, openingAmount: 10000, status: "ABIERTA" },
  });

  const existingSale = await prisma.sale.findFirst({ where: { id: 1 } });
  if (!existingSale) {
    await prisma.$transaction(async (tx) => {
      const qty = 5;
      const unitPrice = variantSuave500.priceOverride ?? 3500;
      const subtotal = qty * unitPrice;
      const sale = await tx.sale.create({
        data: {
          subtotal,
          discount: 0,
          total: subtotal,
          paymentMethod: "EFECTIVO",
          cashSessionId: openSession.id,
          items: {
            create: [
              {
                variantId: variantSuave500.id,
                quantity: qty,
                unitPrice,
                unitCost: 1800,
                subtotal,
              },
            ],
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          variantId: variantSuave500.id,
          type: "SALIDA",
          reason: "VENTA",
          quantity: qty,
          saleId: sale.id,
        },
      });
      await tx.productVariant.update({
        where: { id: variantSuave500.id },
        data: { currentStock: { decrement: qty } },
      });
    });
  }

  console.log("Sembrando cliente y pedido online de ejemplo...");
  const customer = await prisma.customer.upsert({
    where: { whatsapp: "5493751234567" },
    update: {},
    create: {
      name: "María Ferreyra",
      whatsapp: "5493751234567",
      address: "Av. San Martín 450, Posadas, Misiones",
    },
  });

  const existingOrder = await prisma.order.findFirst({ where: { customerId: customer.id } });
  if (!existingOrder) {
    await prisma.$transaction(async (tx) => {
      const qty = 2;
      const unitPrice = variantFuerte1kg.priceOverride ?? 6500;
      const priceAtPurchase = unitPrice * 0.85; // refleja el beneficio del 15% sembrado arriba
      const subtotal = qty * priceAtPurchase;

      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          total: subtotal,
          shippingAddress: customer.address,
          paymentStatus: "PENDIENTE",
          shippingStatus: "PREPARANDO",
          items: {
            create: [
              {
                variantId: variantFuerte1kg.id,
                quantity: qty,
                priceAtPurchase,
                subtotal,
              },
            ],
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          variantId: variantFuerte1kg.id,
          type: "SALIDA",
          reason: "VENTA",
          quantity: qty,
          orderId: order.id,
        },
      });
      await tx.productVariant.update({
        where: { id: variantFuerte1kg.id },
        data: { currentStock: { decrement: qty } },
      });
    });
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
