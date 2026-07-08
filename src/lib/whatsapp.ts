import { formatCurrency } from "./format";
import { applyVolumeDiscount } from "./volumePricing";

export type WhatsAppCartLine = { name: string; quantity: number; unitPrice: number };

export function buildWhatsAppOrderMessage(
  lines: WhatsAppCartLine[],
  total: number,
  currencySymbol: string,
  customerName?: string,
  customerAddress?: string
): string {
  const header = customerName
    ? `¡Hola! Soy ${customerName} y quiero hacer un pedido:`
    : "¡Hola! Quiero hacer un pedido:";
  const body = lines
    .map((l) => {
      const effectiveUnitPrice = applyVolumeDiscount(l.unitPrice, l.quantity);
      return `- ${l.quantity}x ${l.name} (${formatCurrency(l.quantity * effectiveUnitPrice, currencySymbol)})`;
    })
    .join("\n");
  const addressLine = customerAddress ? `\nDirección de envío: ${customerAddress}` : "";
  const footer = `Total: ${formatCurrency(total, currencySymbol)}.${addressLine}\n¿Cómo coordinamos el pago y el envío?`;
  return `${header}\n${body}\n\n${footer}`;
}

export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
