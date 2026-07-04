import { prisma } from "./prisma";

export const DEFAULT_LABELS: Record<string, string> = {
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

export const DEFAULT_SETTINGS: Record<string, string> = {
  business_name: "Mi Negocio",
  currency_symbol: "$",
  low_stock_alert_enabled: "true",
  whatsapp_number: "",
  store_tagline: "Producción y venta directa",
};

export async function getFieldLabels(): Promise<Record<string, string>> {
  const rows = await prisma.fieldLabel.findMany();
  const map: Record<string, string> = { ...DEFAULT_LABELS };
  for (const row of rows) {
    map[row.fieldKey] = row.label;
  }
  return map;
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}
