"use client";

import { useState } from "react";
import { MessageCircle, PartyPopper } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiClientError } from "@/lib/api-client";

export type CheckoutResult = { whatsappLink: string | null };

export function CheckoutModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    customerName: string;
    customerWhatsapp: string;
    customerAddress: string;
    notes: string;
  }) => Promise<CheckoutResult>;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  function reset() {
    setCustomerName("");
    setCustomerWhatsapp("");
    setCustomerAddress("");
    setNotes("");
    setError(null);
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await onConfirm({ customerName, customerWhatsapp, customerAddress, notes });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo confirmar el pedido");
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <Modal open={open} onClose={handleClose} title="¡Pedido confirmado!">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <PartyPopper size={28} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Reservamos el stock de tu pedido.
            {result.whatsappLink
              ? " Tocá el botón para enviarlo por WhatsApp y coordinar el pago y el envío."
              : " El negocio todavía no configuró un número de WhatsApp de contacto; te contactaremos por otro medio."}
          </p>

          {result.whatsappLink && (
            <a
              href={result.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="btn w-full bg-[#25D366] text-white shadow-md hover:bg-[#1ebe57]"
            >
              <MessageCircle size={18} /> Enviar pedido por WhatsApp
            </a>
          )}

          <button type="button" className="btn-secondary w-full" onClick={handleClose}>
            Cerrar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Confirmar pedido">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Tu nombre</label>
          <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Tu WhatsApp</label>
          <input
            className="input"
            value={customerWhatsapp}
            onChange={(e) => setCustomerWhatsapp(e.target.value)}
            placeholder="Ej: 5493751123456"
            required
          />
        </div>
        <div>
          <label className="label">Dirección de envío</label>
          <input
            className="input"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Calle, número, localidad"
            required
          />
        </div>
        <div>
          <label className="label">Notas para el pedido (opcional)</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <p className="text-xs text-gray-400">
          Al confirmar, se reserva el stock de tu pedido y te mostramos un botón para enviarlo por WhatsApp y
          coordinar el pago y el envío.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Confirmando..." : "Confirmar pedido"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
