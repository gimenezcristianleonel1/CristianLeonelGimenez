import { PaymentStatus, ShippingStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { AppError } from "./api-utils";
import { effectiveSalePrice, getActiveBenefitsMap } from "./stock";

type PublicOrderItemInput = { variantId: number; quantity: number };

type PublicOrderInput = {
  items: PublicOrderItemInput[];
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  notes?: string | null;
};

/**
 * Registra un pedido de la tienda pública (canal online / P2P): resuelve el
 * precio de cada ítem en el servidor (nunca confía en lo que envía el
 * navegador, respetando beneficios vigentes por fecha), crea o reutiliza el
 * cliente por su WhatsApp, y descuenta stock real dentro de una única
 * transacción.
 */
export async function registerPublicOrder(input: PublicOrderInput) {
  const variantIds = input.items.map((i) => i.variantId);

  return prisma.$transaction(async (tx) => {
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true, isPublished: true },
      include: { product: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const benefitsMap = await getActiveBenefitsMap(variantIds);

    let total = 0;
    const resolvedItems = input.items.map((item) => {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new AppError("Uno de los productos del pedido ya no está disponible", 404);
      }
      if (variant.currentStock - item.quantity < 0) {
        throw new AppError(
          `Stock insuficiente para "${variant.name}". Disponible: ${variant.currentStock}, solicitado: ${item.quantity}`,
          409
        );
      }
      const priceAtPurchase = effectiveSalePrice(variant, variant.product, benefitsMap.get(item.variantId));
      const subtotal = priceAtPurchase * item.quantity;
      total += subtotal;
      return { variantId: item.variantId, quantity: item.quantity, priceAtPurchase, subtotal };
    });

    const customer = await tx.customer.upsert({
      where: { whatsapp: input.customerWhatsapp },
      update: { name: input.customerName, address: input.customerAddress },
      create: {
        name: input.customerName,
        whatsapp: input.customerWhatsapp,
        address: input.customerAddress,
      },
    });

    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        total,
        shippingAddress: input.customerAddress,
        notes: input.notes ?? null,
        items: { create: resolvedItems },
      },
      include: {
        items: { include: { variant: true } },
        // Nunca incluir passwordHash en una respuesta de un endpoint público.
        customer: { select: { id: true, name: true, whatsapp: true, address: true, email: true, createdAt: true } },
      },
    });

    for (const item of resolvedItems) {
      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "SALIDA",
          reason: "VENTA",
          quantity: item.quantity,
          orderId: order.id,
        },
      });
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { currentStock: { decrement: item.quantity } },
      });
    }

    return order;
  });
}

/** Actualiza el estado de pago y/o de envío de un pedido. */
export async function updateOrderStatus(
  orderId: number,
  data: { paymentStatus?: PaymentStatus; shippingStatus?: ShippingStatus }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Pedido no encontrado", 404);
  return prisma.order.update({ where: { id: orderId }, data });
}

/**
 * Ficha de cliente: perfil + estadísticas de compra (total gastado, volumen
 * total comprado) + historial cronológico completo de pedidos.
 */
export async function getCustomerWithStats(customerId: number) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        orderBy: { createdAt: "asc" },
        include: { items: { include: { variant: { include: { product: true } } } } },
      },
    },
  });
  if (!customer) return null;

  const totalSpent = customer.orders.reduce((acc, o) => acc + o.total, 0);

  // Volumen comprado agrupado por unidad (kg, paquete, etc.), ya que cada
  // producto puede tener su propia unidad de medida.
  const volumeByUnit = new Map<string, number>();
  for (const order of customer.orders) {
    for (const item of order.items) {
      const unit = item.variant.product.unit;
      volumeByUnit.set(unit, (volumeByUnit.get(unit) ?? 0) + item.quantity);
    }
  }

  // Nunca devolver passwordHash, ni siquiera a rutas de administrador.
  const { passwordHash: _passwordHash, ...safeCustomer } = customer;

  return {
    customer: safeCustomer,
    totalSpent,
    volumeByUnit: Array.from(volumeByUnit.entries()).map(([unit, quantity]) => ({ unit, quantity })),
    orderCount: customer.orders.length,
  };
}
