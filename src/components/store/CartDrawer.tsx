"use client";

import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { applyVolumeDiscount, volumeDiscountPercent } from "@/lib/volumePricing";

// unitPrice es el precio regular (ya con beneficios vigentes aplicados);
// el descuento por volumen se calcula en el momento según la cantidad.
export type CartLine = { variantId: number; name: string; quantity: number; unitPrice: number; maxStock: number };

export function CartDrawer({
  open,
  lines,
  currency,
  onClose,
  onChangeQty,
  onRemove,
  onCheckout,
}: {
  open: boolean;
  lines: CartLine[];
  currency: string;
  onClose: () => void;
  onChangeQty: (variantId: number, delta: number) => void;
  onRemove: (variantId: number) => void;
  onCheckout: () => void;
}) {
  const total = lines.reduce((acc, l) => acc + l.quantity * applyVolumeDiscount(l.unitPrice, l.quantity), 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white p-5 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingCart size={20} /> Tu carrito
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {lines.length === 0 && <p className="text-sm text-gray-400">Tu carrito está vacío.</p>}
          {lines.map((line) => {
            const discountPercent = volumeDiscountPercent(line.quantity);
            const effectiveUnitPrice = applyVolumeDiscount(line.unitPrice, line.quantity);
            return (
            <div key={line.variantId} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.name}</p>
                <p className="text-xs text-gray-400">
                  {formatCurrency(effectiveUnitPrice, currency)} c/u
                  {discountPercent > 0 && (
                    <span className="ml-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      -{discountPercent}% por volumen
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => onChangeQty(line.variantId, -1)}>
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm">{line.quantity}</span>
                <button
                  className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => onChangeQty(line.variantId, 1)}
                  disabled={line.quantity >= line.maxStock}
                >
                  <Plus size={14} />
                </button>
                <button
                  className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onRemove(line.variantId)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
          <button className="btn-primary w-full" disabled={lines.length === 0} onClick={onCheckout}>
            Confirmar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
