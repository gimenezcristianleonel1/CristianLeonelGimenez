"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useCurrency } from "@/components/providers/AppConfigProvider";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

type Variant = {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  priceOverride: number | null;
  isOnOffer: boolean;
  offerPrice: number | null;
  isActive: boolean;
  product: { name: string; basePrice: number };
};

type CartLine = { variantId: number; name: string; sku: string; quantity: number; unitPrice: number; maxStock: number };

type Sale = {
  id: number;
  date: string;
  total: number;
  paymentMethod: string;
  status: string;
  items: { quantity: number; unitPrice: number; variant: { name: string } }[];
};

const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
];

function effectivePrice(v: Variant): number {
  const regular = v.priceOverride ?? v.product.basePrice;
  if (v.isOnOffer && v.offerPrice != null) return Math.min(v.offerPrice, regular);
  return regular;
}

export default function VentasPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashSessionId, setCashSessionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currency = useCurrency();

  const loadVariants = useCallback(async () => {
    const data = await api.get<Variant[]>("/api/variants");
    setVariants(data.filter((v) => v.isActive));
  }, []);

  const loadSales = useCallback(async () => {
    const data = await api.get<{ sales: Sale[] }>("/api/sales?pageSize=10");
    setSales(data.sales);
  }, []);

  useEffect(() => {
    loadVariants();
    loadSales();
    api
      .get<{ id: number } | null>("/api/cash-sessions/current")
      .then((s) => setCashSessionId(s?.id ?? null));
  }, [loadVariants, loadSales]);

  const filtered = variants.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.product.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(v: Variant) {
    setCart((prev) => {
      const existing = prev.find((l) => l.variantId === v.id);
      if (existing) {
        if (existing.quantity + 1 > v.currentStock) return prev;
        return prev.map((l) => (l.variantId === v.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (v.currentStock < 1) return prev;
      return [
        ...prev,
        {
          variantId: v.id,
          name: `${v.product.name} — ${v.name}`,
          sku: v.sku,
          quantity: 1,
          unitPrice: effectivePrice(v),
          maxStock: v.currentStock,
        },
      ];
    });
  }

  function changeQty(variantId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.variantId === variantId
            ? { ...l, quantity: Math.min(Math.max(l.quantity + delta, 0), l.maxStock) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(variantId: number) {
    setCart((prev) => prev.filter((l) => l.variantId !== variantId));
  }

  const subtotal = useMemo(() => cart.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0), [cart]);
  const total = Math.max(subtotal - Number(discount || 0), 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post("/api/sales", {
        items: cart.map((l) => ({ variantId: l.variantId, quantity: l.quantity, unitPrice: l.unitPrice })),
        discount: Number(discount || 0),
        paymentMethod,
        cashSessionId,
      });
      setSuccess("Venta registrada correctamente.");
      setCart([]);
      setDiscount("0");
      loadVariants();
      loadSales();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al registrar la venta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Ventas (Punto de venta)</h1>

      {!cashSessionId && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/10 dark:text-amber-300">
          No hay una caja abierta. Podés registrar la venta igual, pero se recomienda abrir caja primero en la
          sección Caja.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <input
            className="input mb-3"
            placeholder="Buscar producto por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((v) => {
              const price = effectivePrice(v);
              const outOfStock = v.currentStock <= 0;
              return (
                <button
                  key={v.id}
                  disabled={outOfStock}
                  onClick={() => addToCart(v)}
                  className="card flex flex-col items-start p-3 text-left transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="text-sm font-medium">{v.product.name}</p>
                  <p className="text-xs text-gray-400">{v.name}</p>
                  <div className="mt-2 flex w-full items-center justify-between">
                    <span className="font-semibold text-brand-700 dark:text-brand-400">
                      {formatCurrency(price, currency)}
                    </span>
                    {v.isOnOffer && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        OFERTA
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Stock: {formatNumber(v.currentStock)} {outOfStock && "(sin stock)"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card flex flex-col p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <ShoppingCart size={16} /> Carrito
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {cart.length === 0 && <p className="text-sm text-gray-400">Agregá productos para iniciar una venta.</p>}
            {cart.map((line) => (
              <div key={line.variantId} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(line.unitPrice, currency)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => changeQty(line.variantId, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center">{line.quantity}</span>
                  <button
                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => changeQty(line.variantId, 1)}
                    disabled={line.quantity >= line.maxStock}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => removeLine(line.variantId)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="text-gray-500">Descuento</label>
              <input
                type="number"
                min="0"
                step="any"
                className="input w-28 text-right"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>

            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}

            <button
              className="btn-primary w-full"
              onClick={handleCheckout}
              disabled={cart.length === 0 || saving}
            >
              {saving ? "Registrando..." : "Registrar venta"}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Últimas ventas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Ítems</th>
                <th className="pb-2">Pago</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-gray-500">{formatDateTime(s.date)}</td>
                  <td className="py-2">{s.items.map((i) => `${i.quantity}x ${i.variant.name}`).join(", ")}</td>
                  <td className="py-2 text-gray-500">{s.paymentMethod}</td>
                  <td className="py-2">
                    <span
                      className={
                        s.status === "ANULADA" ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium">{formatCurrency(s.total, currency)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    Todavía no hay ventas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
