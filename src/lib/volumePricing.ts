// Descuento escalonado por volumen para pedidos de la tienda pública: a
// mayor cantidad pedida de una misma variante, mayor el descuento automático.
// Sin dependencias (ni Prisma ni Next) para poder importarse tanto en el
// servidor (registro de pedidos) como en el cliente (vista previa en el carrito).

export type VolumeTier = { minQuantity: number; discountPercent: number };

// Ordenados de mayor a menor umbral: el primero que la cantidad alcance gana.
export const VOLUME_DISCOUNT_TIERS: VolumeTier[] = [
  { minQuantity: 21, discountPercent: 20 },
  { minQuantity: 6, discountPercent: 10 },
];

export function volumeDiscountPercent(quantity: number): number {
  for (const tier of VOLUME_DISCOUNT_TIERS) {
    if (quantity >= tier.minQuantity) return tier.discountPercent;
  }
  return 0;
}

export function applyVolumeDiscount(unitPrice: number, quantity: number): number {
  const percent = volumeDiscountPercent(quantity);
  return percent > 0 ? unitPrice * (1 - percent / 100) : unitPrice;
}
