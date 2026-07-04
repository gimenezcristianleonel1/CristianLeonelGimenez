export function formatCurrency(value: number, symbol = "$"): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${symbol} ${formatted}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
}
