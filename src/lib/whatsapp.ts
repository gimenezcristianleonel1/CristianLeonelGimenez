import { formatCurrency } from "./format";

export type WhatsAppCartLine = { name: string; quantity: number; unitPrice: number };

export function buildWhatsAppOrderMessage(
  lines: WhatsAppCartLine[],
  total: number,
  currencySymbol: string,
  customerName?: string
): string {
  const header = customerName
    ? `¡Hola! Soy ${customerName} y quiero hacer un pedido:`
    : "¡Hola! Quiero hacer un pedido:";
  const body = lines
    .map((l) => `- ${l.quantity}x ${l.name} (${formatCurrency(l.quantity * l.unitPrice, currencySymbol)})`)
    .join("\n");
  const footer = `Total: ${formatCurrency(total, currencySymbol)}. ¿Cómo coordinamos el pago y el envío?`;
  return `${header}\n${body}\n\n${footer}`;
}

export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
