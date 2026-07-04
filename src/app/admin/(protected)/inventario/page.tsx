"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useLabel } from "@/components/providers/AppConfigProvider";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";

type Variant = { id: number; name: string; sku: string; currentStock: number; product: { name: string } };
type Supplier = { id: number; name: string };
type Movement = {
  id: number;
  type: "ENTRADA" | "SALIDA";
  reason: string;
  quantity: number;
  unitCost: number | null;
  extraCost: number;
  lot: string | null;
  date: string;
  notes: string | null;
  variant: { name: string; sku: string; product: { name: string } };
  supplier: { name: string } | null;
};

const ENTRY_REASONS = [
  { value: "PRODUCCION", label: "Producción propia" },
  { value: "COMPRA", label: "Compra a proveedor" },
  { value: "DEVOLUCION", label: "Devolución" },
  { value: "AJUSTE", label: "Ajuste" },
];
const EXIT_REASONS = [
  { value: "VENTA", label: "Venta" },
  { value: "MERMA", label: "Merma / rotura" },
  { value: "MUESTRA", label: "Muestra" },
  { value: "AJUSTE", label: "Ajuste" },
];

export default function InventarioPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterVariant, setFilterVariant] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const lotLabel = useLabel("lot", "Lote");
  const supplierLabel = useLabel("supplier", "Proveedor");
  const pageSize = 20;

  const loadMovements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filterVariant) params.set("variantId", filterVariant);
    if (filterType) params.set("type", filterType);
    const data = await api.get<{ movements: Movement[]; total: number }>(
      `/api/stock-movements?${params.toString()}`
    );
    setMovements(data.movements);
    setTotal(data.total);
    setLoading(false);
  }, [page, filterVariant, filterType]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  useEffect(() => {
    api.get<Variant[]>("/api/variants").then(setVariants);
    api.get<Supplier[]>("/api/suppliers").then(setSuppliers);
  }, []);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Inventario</h1>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Registrar movimiento
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="input max-w-xs"
          value={filterVariant}
          onChange={(e) => {
            setPage(1);
            setFilterVariant(e.target.value);
          }}
        >
          <option value="">Todas las variantes</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.product.name} — {v.name}
            </option>
          ))}
        </select>
        <select
          className="input max-w-xs"
          value={filterType}
          onChange={(e) => {
            setPage(1);
            setFilterType(e.target.value);
          }}
        >
          <option value="">Entradas y salidas</option>
          <option value="ENTRADA">Solo entradas</option>
          <option value="SALIDA">Solo salidas</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="py-3 pl-4">Fecha</th>
                <th className="py-3">Variante</th>
                <th className="py-3">Tipo</th>
                <th className="py-3">Motivo</th>
                <th className="py-3 text-right">Cantidad</th>
                <th className="py-3 text-right">Costo unit.</th>
                <th className="py-3">{lotLabel}</th>
                <th className="py-3 pr-4">{supplierLabel}</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                movements.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pl-4 text-gray-500">{formatDateTime(m.date)}</td>
                    <td className="py-2">
                      <p className="font-medium">{m.variant.name}</p>
                      <p className="text-xs text-gray-400">{m.variant.sku}</p>
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.type === "ENTRADA"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{m.reason}</td>
                    <td className="py-2 text-right font-medium">{formatNumber(m.quantity)}</td>
                    <td className="py-2 text-right text-gray-500">
                      {m.unitCost != null ? formatNumber(m.unitCost) : "—"}
                    </td>
                    <td className="py-2 text-gray-500">{m.lot ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-500">{m.supplier?.name ?? "—"}</td>
                  </tr>
                ))}
              {!loading && movements.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No hay movimientos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm dark:border-gray-800">
          <span className="text-gray-500">
            Página {page} de {totalPages} ({total} movimientos)
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Anterior
            </button>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <MovementModal
        open={modalOpen}
        variants={variants}
        suppliers={suppliers}
        onClose={() => setModalOpen(false)}
        onSaved={loadMovements}
      />
    </div>
  );
}

function MovementModal({
  open,
  variants,
  suppliers,
  onClose,
  onSaved,
}: {
  open: boolean;
  variants: Variant[];
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [variantId, setVariantId] = useState("");
  const [reason, setReason] = useState("PRODUCCION");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [extraCost, setExtraCost] = useState("");
  const [lot, setLot] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const lotLabel = useLabel("lot", "Lote");
  const supplierLabel = useLabel("supplier", "Proveedor");

  useEffect(() => {
    if (open) {
      setType("ENTRADA");
      setVariantId("");
      setReason("PRODUCCION");
      setQuantity("");
      setUnitCost("");
      setExtraCost("");
      setLot("");
      setSupplierId("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    setReason(type === "ENTRADA" ? "PRODUCCION" : "VENTA");
  }, [type]);

  const selectedVariant = variants.find((v) => String(v.id) === variantId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/stock-movements", {
        variantId: Number(variantId),
        type,
        reason,
        quantity: Number(quantity),
        unitCost: type === "ENTRADA" && unitCost ? Number(unitCost) : null,
        extraCost: type === "ENTRADA" && extraCost ? Number(extraCost) : 0,
        lot: lot || null,
        supplierId: reason === "COMPRA" && supplierId ? Number(supplierId) : null,
        notes: notes || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al registrar el movimiento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar movimiento de stock">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 rounded-lg border border-gray-200 p-1 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setType("ENTRADA")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
              type === "ENTRADA" ? "bg-emerald-600 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setType("SALIDA")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
              type === "SALIDA" ? "bg-red-600 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Salida
          </button>
        </div>

        <div>
          <label className="label">Variante</label>
          <select className="input" value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
            <option value="">Seleccioná una variante</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.product.name} — {v.name} (stock: {formatNumber(v.currentStock)})
              </option>
            ))}
          </select>
          {selectedVariant && type === "SALIDA" && (
            <p className="mt-1 text-xs text-gray-400">
              Stock disponible: {formatNumber(selectedVariant.currentStock)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Motivo</label>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {(type === "ENTRADA" ? ENTRY_REASONS : EXIT_REASONS).map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cantidad</label>
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        {type === "ENTRADA" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Costo unitario</label>
              <input
                type="number"
                step="any"
                min="0"
                className="input"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Costo adicional del lote</label>
              <input
                type="number"
                step="any"
                min="0"
                className="input"
                value={extraCost}
                onChange={(e) => setExtraCost(e.target.value)}
                placeholder="Mano de obra, empaque, etc."
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{lotLabel} (opcional)</label>
            <input className="input" value={lot} onChange={(e) => setLot(e.target.value)} />
          </div>
          {reason === "COMPRA" && (
            <div>
              <label className="label">{supplierLabel}</label>
              <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Sin especificar</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            {saving ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
