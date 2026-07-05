"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, LogOut, MapPin, Package, Wallet, Pencil } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { useAppConfig, useCurrency } from "@/components/providers/AppConfigProvider";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

type OrderItem = { id: number; quantity: number; subtotal: number; variant: { name: string } };
type Order = {
  id: number;
  total: number;
  paymentStatus: "PENDIENTE" | "PAGADO" | "REEMBOLSADO";
  shippingStatus: "PREPARANDO" | "DESPACHADO" | "ENTREGADO" | "CANCELADO";
  createdAt: string;
  items: OrderItem[];
};

type MeResponse = {
  customer: { id: number; name: string; whatsapp: string; email: string | null; address: string | null; orders: Order[] };
  totalSpent: number;
  volumeByUnit: { unit: string; quantity: number }[];
  orderCount: number;
};

const PAYMENT_LABELS: Record<string, string> = { PENDIENTE: "Pendiente", PAGADO: "Pagado", REEMBOLSADO: "Reembolsado" };
const SHIPPING_LABELS: Record<string, string> = {
  PREPARANDO: "Preparando",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

function paymentBadgeClass(status: string) {
  if (status === "PAGADO") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (status === "REEMBOLSADO") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400";
}

function shippingBadgeClass(status: string) {
  if (status === "ENTREGADO") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (status === "CANCELADO") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (status === "DESPACHADO") return "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

export default function MiCuentaPage() {
  const router = useRouter();
  const { logout } = useCustomerAuth();
  const { settings } = useAppConfig();
  const currency = useCurrency();

  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MeResponse>("/api/me")
      .then((res) => {
        setData(res);
        setAddressDraft(res.customer.address ?? "");
      })
      .catch(() => router.push("/mi-cuenta/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveAddress() {
    setSavingAddress(true);
    setError(null);
    try {
      await api.patch("/api/me", { address: addressDraft || null });
      setData((prev) => (prev ? { ...prev, customer: { ...prev.customer, address: addressDraft || null } } : prev));
      setEditingAddress(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo guardar la dirección");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Leaf size={20} />
            </div>
            <span className="font-semibold">{settings.business_name ?? "Mi Negocio"}</span>
          </Link>
          <button onClick={handleLogout} className="btn-secondary">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Hola, {data.customer.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.customer.email} · {data.customer.whatsapp}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-4">
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Wallet size={13} /> Total gastado
            </p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(data.totalSpent, currency)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Pedidos realizados</p>
            <p className="mt-1 text-xl font-semibold">{data.orderCount}</p>
          </div>
          <div className="card p-4">
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Package size={13} /> Volumen comprado
            </p>
            <p className="mt-1 text-sm font-semibold">
              {data.volumeByUnit.length > 0
                ? data.volumeByUnit.map((v) => `${formatNumber(v.quantity)} ${v.unit}`).join(" · ")
                : "—"}
            </p>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <MapPin size={14} /> Dirección de envío guardada
            </p>
            {!editingAddress && (
              <button
                onClick={() => setEditingAddress(true)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          {editingAddress ? (
            <div className="space-y-2">
              <input
                className="input"
                value={addressDraft}
                onChange={(e) => setAddressDraft(e.target.value)}
                placeholder="Calle, número, localidad"
              />
              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button className="btn-primary" onClick={handleSaveAddress} disabled={savingAddress}>
                  {savingAddress ? "Guardando..." : "Guardar"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setEditingAddress(false);
                    setAddressDraft(data.customer.address ?? "");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {data.customer.address || "Todavía no guardaste una dirección."}
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Historial de pedidos</h2>
          <div className="space-y-2">
            {data.customer.orders.length === 0 && (
              <p className="card p-4 text-sm text-gray-400">Todavía no hiciste ningún pedido.</p>
            )}
            {[...data.customer.orders].reverse().map((o) => (
              <div key={o.id} className="card p-4 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-gray-500">{formatDateTime(o.createdAt)}</span>
                  <span className="font-semibold">{formatCurrency(o.total, currency)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {o.items.map((i) => `${formatNumber(i.quantity)}x ${i.variant.name}`).join(", ")}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${paymentBadgeClass(o.paymentStatus)}`}>
                    {PAYMENT_LABELS[o.paymentStatus]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${shippingBadgeClass(o.shippingStatus)}`}>
                    {SHIPPING_LABELS[o.shippingStatus]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
