"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useCurrency } from "@/components/providers/AppConfigProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";

type FixedCost = {
  id: number;
  name: string;
  amount: number;
  frequency: "UNICO" | "SEMANAL" | "MENSUAL" | "ANUAL";
  startDate: string;
  notes: string | null;
  isActive: boolean;
};

type MarginInfo = {
  variantId: number;
  variantName: string;
  sku: string;
  currentStock: number;
  averageCost: number;
  salePrice: number;
  marginAbsolute: number;
  marginPercent: number;
};

const FREQUENCY_LABELS: Record<string, string> = {
  UNICO: "Único",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  ANUAL: "Anual",
};

export default function FinanzasPage() {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [margins, setMargins] = useState<MarginInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const currency = useCurrency();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [c, m] = await Promise.all([
      api.get<FixedCost[]>("/api/fixed-costs"),
      api.get<MarginInfo[]>("/api/margins"),
    ]);
    setCosts(c);
    setMargins(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleDeleteCost(id: number) {
    if (!confirm("¿Eliminar este costo fijo?")) return;
    await api.delete(`/api/fixed-costs/${id}`);
    loadAll();
  }

  const totalMonthlyFixed = costs.reduce((acc, c) => {
    if (!c.isActive) return acc;
    const monthly =
      c.frequency === "SEMANAL" ? c.amount * 4.345 : c.frequency === "ANUAL" ? c.amount / 12 : c.amount;
    return acc + monthly;
  }, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Finanzas</h1>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Costos fijos</h2>
            <p className="text-xs text-gray-400">
              Total equivalente mensual: {formatCurrency(totalMonthlyFixed, currency)}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nuevo costo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2">Nombre</th>
                <th className="pb-2 text-right">Monto</th>
                <th className="pb-2">Frecuencia</th>
                <th className="pb-2">Desde</th>
                <th className="pb-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                costs.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2">
                      <p className="font-medium">{c.name}</p>
                      {c.notes && <p className="text-xs text-gray-400">{c.notes}</p>}
                    </td>
                    <td className="py-2 text-right">{formatCurrency(c.amount, currency)}</td>
                    <td className="py-2 text-gray-500">{FREQUENCY_LABELS[c.frequency]}</td>
                    <td className="py-2 text-gray-500">{formatDate(c.startDate)}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleDeleteCost(c.id)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && costs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No hay costos fijos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Margen de ganancia por variante (costo promedio ponderado)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2">Variante</th>
                <th className="pb-2 text-right">Stock</th>
                <th className="pb-2 text-right">Costo prom. (PPP)</th>
                <th className="pb-2 text-right">Precio venta</th>
                <th className="pb-2 text-right">Margen</th>
                <th className="pb-2 text-right">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                margins.map((m) => (
                  <tr key={m.variantId} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2">
                      <p className="font-medium">{m.variantName}</p>
                      <p className="text-xs text-gray-400">{m.sku}</p>
                    </td>
                    <td className="py-2 text-right">{m.currentStock}</td>
                    <td className="py-2 text-right">{formatCurrency(m.averageCost, currency)}</td>
                    <td className="py-2 text-right">{formatCurrency(m.salePrice, currency)}</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        m.marginAbsolute >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(m.marginAbsolute, currency)}
                    </td>
                    <td
                      className={`py-2 text-right font-medium ${
                        m.marginPercent >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {m.marginPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              {!loading && margins.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    Todavía no hay variantes con costos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FixedCostModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadAll} />
    </div>
  );
}

function FixedCostModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MENSUAL");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setFrequency("MENSUAL");
      setNotes("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/fixed-costs", {
        name,
        amount: Number(amount),
        frequency,
        notes: notes || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo costo fijo">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Monto</label>
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Frecuencia</label>
            <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
