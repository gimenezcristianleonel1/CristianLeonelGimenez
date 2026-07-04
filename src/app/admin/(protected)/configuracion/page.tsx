"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useAppConfig } from "@/components/providers/AppConfigProvider";

const LABEL_FIELDS: { key: string; hint: string }[] = [
  { key: "product", hint: 'Ej: "Producto" → "Variante de Yerba"' },
  { key: "product_plural", hint: "Plural de producto" },
  { key: "variant", hint: "Nombre singular de variante" },
  { key: "variant_plural", hint: "Plural de variante" },
  { key: "category", hint: 'Ej: "Categoría" → "Tipo de Molienda"' },
  { key: "category_plural", hint: "Plural de categoría" },
  { key: "attribute", hint: "Nombre singular de atributo" },
  { key: "attribute_plural", hint: "Plural de atributo" },
  { key: "sku", hint: "Etiqueta del campo código/SKU" },
  { key: "minStock", hint: "Etiqueta del stock mínimo" },
  { key: "basePrice", hint: "Etiqueta del precio de venta" },
  { key: "lot", hint: "Etiqueta del lote de producción" },
  { key: "supplier", hint: "Etiqueta de proveedor" },
];

const SETTING_FIELDS: { key: string; label: string; hint: string; type?: string }[] = [
  { key: "business_name", label: "Nombre del negocio", hint: "Se muestra en el panel y en la tienda pública" },
  { key: "currency_symbol", label: "Símbolo de moneda", hint: 'Ej: "$", "US$"' },
  { key: "store_tagline", label: "Bajada / eslogan de la tienda", hint: "Frase corta debajo del nombre" },
  {
    key: "whatsapp_number",
    label: "Número de WhatsApp (con código de país, solo dígitos)",
    hint: "Ej: 5493751123456. A este número llegan los pedidos de la tienda pública.",
  },
];

export default function ConfiguracionPage() {
  const { labels, settings, refresh } = useAppConfig();
  const [labelForm, setLabelForm] = useState<Record<string, string>>({});
  const [settingForm, setSettingForm] = useState<Record<string, string>>({});
  const [savingLabels, setSavingLabels] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLabelForm(labels);
    setSettingForm(settings);
  }, [labels, settings]);

  async function saveLabels() {
    setSavingLabels(true);
    setError(null);
    setMessage(null);
    try {
      const entries = LABEL_FIELDS.map((f) => ({ fieldKey: f.key, label: labelForm[f.key] ?? f.key }));
      await api.put("/api/config/labels", entries);
      await refresh();
      setMessage("Etiquetas actualizadas.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al guardar etiquetas");
    } finally {
      setSavingLabels(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    setError(null);
    setMessage(null);
    try {
      const entries = SETTING_FIELDS.map((f) => ({ key: f.key, value: settingForm[f.key] ?? "" }));
      await api.put("/api/config/settings", entries);
      await refresh();
      setMessage("Configuración actualizada.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al guardar la configuración");
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Configuración del sistema</h1>

      {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Datos del negocio</h2>
        <p className="mb-3 text-xs text-gray-400">
          Estos valores se usan en el panel de administración y en la tienda pública.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SETTING_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                className="input"
                value={settingForm[f.key] ?? ""}
                onChange={(e) => setSettingForm({ ...settingForm, [f.key]: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-400">{f.hint}</p>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-4" onClick={saveSettings} disabled={savingSettings}>
          <Save size={16} /> {savingSettings ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Etiquetas de la interfaz</h2>
        <p className="mb-3 text-xs text-gray-400">
          Renombrá cualquier término de la interfaz sin tocar código. Los cambios se aplican en todo el sistema.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LABEL_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.key}</label>
              <input
                className="input"
                value={labelForm[f.key] ?? ""}
                onChange={(e) => setLabelForm({ ...labelForm, [f.key]: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-400">{f.hint}</p>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-4" onClick={saveLabels} disabled={savingLabels}>
          <Save size={16} /> {savingLabels ? "Guardando..." : "Guardar etiquetas"}
        </button>
      </div>

      <div className="card p-4 text-sm text-gray-500 dark:text-gray-400">
        La contraseña del panel de administración se define en el archivo <code>.env</code> con la variable{" "}
        <code>ADMIN_PASSWORD</code>. Para cambiarla, editá ese valor y reiniciá el servidor.
      </div>
    </div>
  );
}
