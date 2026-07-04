"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ApiClientError } from "@/lib/api-client";

const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
];

export function CheckoutModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { customerName: string; customerPhone: string; paymentMethod: string; notes: string }) => Promise<void>;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onConfirm({ customerName, customerPhone, paymentMethod, notes });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo confirmar el pedido");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirmar pedido">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Tu nombre</label>
          <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Tu teléfono (opcional)</label>
          <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Método de pago preferido</label>
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Notas para el pedido (opcional)</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <p className="text-xs text-gray-400">
          Al confirmar, se reserva el stock de tu pedido y se abre WhatsApp con el detalle para coordinar el pago y
          el envío.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Confirmando..." : "Confirmar y abrir WhatsApp"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
