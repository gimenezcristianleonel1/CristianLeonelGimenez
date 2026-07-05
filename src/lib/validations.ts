import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional().nullable(),
});

export const attributeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
});

export const attributeValueSchema = z.object({
  attributeId: z.number().int().positive(),
  value: z.string().min(1, "El valor es obligatorio"),
});

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  sku: z.string().min(1, "El SKU es obligatorio"),
  description: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  unit: z.string().min(1).default("unidad"),
  minStock: z.number().min(0).default(0),
  basePrice: z.number().min(0).default(0),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const variantSchema = z.object({
  productId: z.number().int().positive(),
  sku: z.string().min(1, "El SKU es obligatorio"),
  name: z.string().min(1, "El nombre es obligatorio"),
  priceOverride: z.number().min(0).optional().nullable(),
  minStockOverride: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  attributeValueIds: z.array(z.number().int().positive()).optional().default([]),
});

export const variantUpdateSchema = variantSchema.partial().omit({ productId: true }).extend({
  attributeValueIds: z.array(z.number().int().positive()).optional(),
});

export const movementTypeEnum = z.enum(["ENTRADA", "SALIDA"]);
export const movementReasonEnum = z.enum([
  "PRODUCCION",
  "COMPRA",
  "DEVOLUCION",
  "VENTA",
  "MERMA",
  "MUESTRA",
  "AJUSTE",
]);

export const stockMovementSchema = z.object({
  variantId: z.number().int().positive(),
  type: movementTypeEnum,
  reason: movementReasonEnum,
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitCost: z.number().min(0).optional().nullable(),
  extraCost: z.number().min(0).optional().default(0),
  lot: z.string().optional().nullable(),
  supplierId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  date: z.coerce.date().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
});

export const fixedCostSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  frequency: z.enum(["UNICO", "SEMANAL", "MENSUAL", "ANUAL"]).default("MENSUAL"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const batchCostSchema = z.object({
  variantId: z.number().int().positive(),
  lot: z.string().optional().nullable(),
  concept: z.string().min(1, "El concepto es obligatorio"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  date: z.coerce.date().optional(),
});

export const paymentMethodEnum = z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]);

export const saleItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un ítem"),
  discount: z.number().min(0).default(0),
  paymentMethod: paymentMethodEnum,
  cashSessionId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const cashSessionOpenSchema = z.object({
  openingAmount: z.number().min(0),
  notes: z.string().optional().nullable(),
});

export const cashSessionCloseSchema = z.object({
  closingAmount: z.number().min(0),
  notes: z.string().optional().nullable(),
});

export const cashMovementSchema = z.object({
  cashSessionId: z.number().int().positive(),
  type: z.enum(["INGRESO", "EGRESO"]),
  concept: z.string().min(1, "El concepto es obligatorio"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  date: z.coerce.date().optional(),
});

export const fieldLabelSchema = z.object({
  fieldKey: z.string().min(1),
  label: z.string().min(1),
});

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export const benefitTypeEnum = z.enum(["PERCENTAGE", "FIXED_PRICE"]);

export const benefitSchema = z
  .object({
    variantId: z.number().int().positive(),
    type: benefitTypeEnum,
    value: z.number().positive("El valor debe ser mayor a 0"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin debe ser posterior (o igual) a la fecha de inicio",
    path: ["endDate"],
  })
  .refine((data) => data.type !== "PERCENTAGE" || data.value <= 100, {
    message: "Un descuento porcentual no puede superar el 100%",
    path: ["value"],
  });

export const publicOrderItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
});

export const publicOrderSchema = z.object({
  items: z.array(publicOrderItemSchema).min(1, "El pedido debe tener al menos un ítem"),
  customerName: z.string().min(1, "El nombre es obligatorio"),
  customerWhatsapp: z
    .string()
    .min(6, "Ingresá un número de WhatsApp válido")
    .transform((v) => v.replace(/[^0-9]/g, "")),
  customerAddress: z.string().min(1, "La dirección de envío es obligatoria"),
  notes: z.string().optional().nullable(),
});

export const paymentStatusEnum = z.enum(["PENDIENTE", "PAGADO", "REEMBOLSADO"]);
export const shippingStatusEnum = z.enum(["PREPARANDO", "DESPACHADO", "ENTREGADO", "CANCELADO"]);

export const orderStatusUpdateSchema = z.object({
  paymentStatus: paymentStatusEnum.optional(),
  shippingStatus: shippingStatusEnum.optional(),
});
