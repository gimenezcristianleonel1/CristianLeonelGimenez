// SQLite no soporta enums nativos en Prisma, así que los campos "enum" del
// esquema se guardan como String. Estos tipos y constantes son la fuente de
// verdad en la capa de aplicación (usados por Zod y por el resto del código).

export const MOVEMENT_TYPES = ["ENTRADA", "SALIDA"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_REASONS = [
  "PRODUCCION",
  "COMPRA",
  "DEVOLUCION",
  "VENTA",
  "MERMA",
  "MUESTRA",
  "AJUSTE",
] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

export const COST_FREQUENCIES = ["UNICO", "SEMANAL", "MENSUAL", "ANUAL"] as const;
export type CostFrequency = (typeof COST_FREQUENCIES)[number];

export const PAYMENT_METHODS = ["EFECTIVO", "TRANSFERENCIA", "TARJETA"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SALE_STATUSES = ["COMPLETADA", "ANULADA"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const CASH_SESSION_STATUSES = ["ABIERTA", "CERRADA"] as const;
export type CashSessionStatus = (typeof CASH_SESSION_STATUSES)[number];

export const CASH_MOVEMENT_TYPES = ["INGRESO", "EGRESO"] as const;
export type CashMovementType = (typeof CASH_MOVEMENT_TYPES)[number];
