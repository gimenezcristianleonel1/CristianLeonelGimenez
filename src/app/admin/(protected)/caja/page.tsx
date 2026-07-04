"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, Unlock, Plus, Minus } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useCurrency } from "@/components/providers/AppConfigProvider";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";

type CashMovement = { id: number; type: "INGRESO" | "EGRESO"; concept: string; amount: number; date: string };
type Sale = { id: number; total: number; paymentMethod: string; status: string };
type CashSession = {
  id: number;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedClosing: number | null;
  difference: number | null;
  status: "ABIERTA" | "CERRADA";
  cashMovements: CashMovement[];
  sales: Sale[];
};

export default function CajaPage() {
  const [session, setSession] = useState<CashSession | null>(null);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [movementModal, setMovementModal] = useState<"INGRESO" | "EGRESO" | null>(null);
  const [loading, setLoading] = useState(true);
  const currency = useCurrency();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [current, list] = await Promise.all([
      api.get<CashSession | null>("/api/cash-sessions/current"),
      api.get<CashSession[]>("/api/cash-sessions?status=CERRADA"),
    ]);
    setSession(current);
    setHistory(list.slice(0, 10));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const cashSalesTotal =
    session?.sales
      .filter((s) => s.paymentMethod === "EFECTIVO" && s.status === "COMPLETADA")
      .reduce((acc, s) => acc + s.total, 0) ?? 0;
  const ingresos = session?.cashMovements.filter((m) => m.type === "INGRESO").reduce((a, m) => a + m.amount, 0) ?? 0;
  const egresos = session?.cashMovements.filter((m) => m.type === "EGRESO").reduce((a, m) => a + m.amount, 0) ?? 0;
  const expected = (session?.openingAmount ?? 0) + cashSalesTotal + ingresos - egresos;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Caja</h1>
        {!loading &&
          (session ? (
            <button className="btn-danger" onClick={() => setCloseModal(true)}>
              <Lock size={16} /> Cerrar caja
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setOpenModal(true)}>
              <Unlock size={16} /> Abrir caja
            </button>
          ))}
      </div>

      {!loading && session ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Caja abierta desde {formatDateTime(session.openedAt)}
              </h2>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setMovementModal("INGRESO")}>
                  <Plus size={14} /> Ingreso
                </button>
                <button className="btn-secondary" onClick={() => setMovementModal("EGRESO")}>
                  <Minus size={14} /> Egreso
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Concepto</th>
                  <th className="pb-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {session.cashMovements.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-500">{formatDateTime(m.date)}</td>
                    <td className="py-2">
                      <span className={m.type === "INGRESO" ? "text-emerald-600" : "text-red-600"}>{m.type}</span>
                    </td>
                    <td className="py-2">{m.concept}</td>
                    <td className="py-2 text-right">{formatCurrency(m.amount, currency)}</td>
                  </tr>
                ))}
                {session.cashMovements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      Sin movimientos manuales todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Resumen de caja</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Apertura" value={formatCurrency(session.openingAmount, currency)} />
              <Row label="Ventas en efectivo" value={formatCurrency(cashSalesTotal, currency)} />
              <Row label="Ingresos manuales" value={formatCurrency(ingresos, currency)} />
              <Row label="Egresos manuales" value={`- ${formatCurrency(egresos, currency)}`} />
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold dark:border-gray-800">
                <dt>Efectivo esperado</dt>
                <dd>{formatCurrency(expected, currency)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="card p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay una caja abierta. Abrí una para empezar a registrar ventas en efectivo y movimientos manuales.
          </div>
        )
      )}

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Historial de cierres</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2">Apertura</th>
              <th className="pb-2">Cierre</th>
              <th className="pb-2 text-right">Esperado</th>
              <th className="pb-2 text-right">Contado</th>
              <th className="pb-2 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {history.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2 text-gray-500">{formatDateTime(s.openedAt)}</td>
                <td className="py-2 text-gray-500">{s.closedAt ? formatDateTime(s.closedAt) : "—"}</td>
                <td className="py-2 text-right">{formatCurrency(s.expectedClosing ?? 0, currency)}</td>
                <td className="py-2 text-right">{formatCurrency(s.closingAmount ?? 0, currency)}</td>
                <td
                  className={`py-2 text-right font-medium ${
                    (s.difference ?? 0) === 0
                      ? ""
                      : (s.difference ?? 0) > 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(s.difference ?? 0, currency)}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  Todavía no hay cierres de caja.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OpenSessionModal open={openModal} onClose={() => setOpenModal(false)} onSaved={loadAll} />
      <CloseSessionModal
        open={closeModal}
        sessionId={session?.id ?? null}
        expected={expected}
        onClose={() => setCloseModal(false)}
        onSaved={loadAll}
      />
      <CashMovementModal
        open={movementModal !== null}
        type={movementModal}
        sessionId={session?.id ?? null}
        onClose={() => setMovementModal(null)}
        onSaved={loadAll}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function OpenSessionModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [openingAmount, setOpeningAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setOpeningAmount("0");
      setNotes("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/cash-sessions", { openingAmount: Number(openingAmount), notes: notes || null });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al abrir la caja");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Abrir caja">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Monto de apertura</label>
          <input
            type="number"
            step="any"
            min="0"
            className="input"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(e.target.value)}
            required
          />
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
            {saving ? "Abriendo..." : "Abrir caja"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CloseSessionModal({
  open,
  sessionId,
  expected,
  onClose,
  onSaved,
}: {
  open: boolean;
  sessionId: number | null;
  expected: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [closingAmount, setClosingAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currency = useCurrency();

  useEffect(() => {
    if (open) {
      setClosingAmount(String(expected.toFixed(2)));
      setNotes("");
      setError(null);
    }
  }, [open, expected]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/api/cash-sessions/${sessionId}/close`, {
        closingAmount: Number(closingAmount),
        notes: notes || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al cerrar la caja");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cerrar caja">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-gray-500">
          Efectivo esperado en caja: <strong>{formatCurrency(expected, currency)}</strong>
        </p>
        <div>
          <label className="label">Monto contado</label>
          <input
            type="number"
            step="any"
            min="0"
            className="input"
            value={closingAmount}
            onChange={(e) => setClosingAmount(e.target.value)}
            required
          />
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
          <button type="submit" className="btn-danger" disabled={saving}>
            {saving ? "Cerrando..." : "Cerrar caja"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CashMovementModal({
  open,
  type,
  sessionId,
  onClose,
  onSaved,
}: {
  open: boolean;
  type: "INGRESO" | "EGRESO" | null;
  sessionId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setConcept("");
      setAmount("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !type) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/cash-movements", { cashSessionId: sessionId, type, concept, amount: Number(amount) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al registrar el movimiento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={type === "INGRESO" ? "Registrar ingreso" : "Registrar egreso"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Concepto</label>
          <input className="input" value={concept} onChange={(e) => setConcept(e.target.value)} required />
        </div>
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
