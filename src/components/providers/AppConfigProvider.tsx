"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

type AppConfigContextValue = {
  labels: Record<string, string>;
  settings: Record<string, string>;
  loading: boolean;
  refresh: () => Promise<void>;
};

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
  business_name: "Mi Negocio",
  currency_symbol: "$",
  low_stock_alert_enabled: "true",
  whatsapp_number: "",
  store_tagline: "Producción y venta directa",
};

const AppConfigContext = createContext<AppConfigContextValue>({
  labels: DEFAULT_LABELS,
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: async () => {},
});

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>(DEFAULT_LABELS);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [labelsRes, settingsRes] = await Promise.all([
        api.get<Record<string, string>>("/api/config/labels"),
        api.get<Record<string, string>>("/api/config/settings"),
      ]);
      setLabels({ ...DEFAULT_LABELS, ...labelsRes });
      setSettings({ ...DEFAULT_SETTINGS, ...settingsRes });
    } catch {
      // Si falla la carga, se mantienen los valores por defecto.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppConfigContext.Provider value={{ labels, settings, loading, refresh }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}

export function useLabel(key: string, fallback?: string) {
  const { labels } = useAppConfig();
  return labels[key] ?? fallback ?? key;
}

export function useCurrency() {
  const { settings } = useAppConfig();
  return settings.currency_symbol ?? "$";
}
