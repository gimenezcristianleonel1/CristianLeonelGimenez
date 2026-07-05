"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Package, Wallet } from "lucide-react";
import { api } from "@/lib/api-client";
import { useCurrency } from "@/components/providers/AppConfigProvider";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";

type PaymentStatus = "PENDIENTE" | "PAGADO" | "REEMBOLSADO";
type ShippingStatus = "PREPARANDO" | "DESPACHADO" | "ENTREGADO" | "CANCELADO";

type OrderItem = { id: number; quantity: number; priceAtPurchase: number; subtotal: number; variant: { name: string; sku: string } };
type Customer = { id: number; name: string; whatsapp: string; address: string | null };
type Order = {
  id: number;
  total: number;
  shippingAddress: string | null;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
};

type CustomerRow = {
  id: number;
  name: string;
  whatsapp: string;
  address: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PAGADO", label: "Pagado" },
  { value: "REEMBOLSADO", label: "Reembolsado" },
];

const SHIPPING_STATUSES: { value: ShippingStatus; label: string }[] = [
  { value: "PREPARANDO", label: "Preparando" },
  { value: "DESPACHADO", label: "Despachado" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "CANCELADO", label: "Cancelado" },
];

function paymentBadgeClass(status: PaymentStatus) {
  if (status === "PAGADO") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (status === "REEMBOLSADO") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400";
}

function shippingBadgeClass(status: ShippingStatus) {
  if (status === "ENTREGADO") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (status === "CANCELADO") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (status === "DESPACHADO") return "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

function whatsappLink(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;
}

export default function ClientesPage() {
  const [tab, setTab] = useState<"pedidos" | "clientes">("pedidos");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Clientes e historial de pedidos</h1>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-800">
          <button
            onClick={() => setTab("pedidos")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "pedidos" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setTab("clientes")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "clientes" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Clientes
          </button>
        </div>
      </div>

      {tab === "pedidos" ? <OrdersView /> : <CustomersView />}
    </div>
  );
}

function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState("");
  const [shippingFilter, setShippingFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerModal, setCustomerModal] = useState<number | null>(null);
  const currency = useCurrency();
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    if (shippingFilter) params.set("shippingStatus", shippingFilter);
    const data = await api.get<{ orders: Order[]; total: number }>(`/api/orders?${params}`);
    setOrders(data.orders);
    setTotal(data.total);
    setLoading(false);
  }, [page, paymentFilter, shippingFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(orderId: number, patch: Partial<Pick<Order, "paymentStatus" | "shippingStatus">>) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    await api.patch(`/api/orders/${orderId}`, patch);
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="input max-w-xs"
          value={paymentFilter}
          onChange={(e) => {
            setPage(1);
            setPaymentFilter(e.target.value);
          }}
        >
          <option value="">Todos los estados de pago</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="input max-w-xs"
          value={shippingFilter}
          onChange={(e) => {
            setPage(1);
            setShippingFilter(e.target.value);
          }}
        >
          <option value="">Todos los estados de envío</option>
          {SHIPPING_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="py-3 pl-4">Fecha</th>
                <th className="py-3">Cliente</th>
                <th className="py-3">Ítems</th>
                <th className="py-3 text-right">Total</th>
                <th className="py-3">Pago</th>
                <th className="py-3 pr-4">Envío</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pl-4 text-gray-500">{formatDateTime(o.createdAt)}</td>
                    <td className="py-2">
                      <button
                        onClick={() => setCustomerModal(o.customer.id)}
                        className="font-medium text-brand-700 hover:underline dark:text-brand-400"
                      >
                        {o.customer.name}
                      </button>
                      <p className="text-xs text-gray-400">{o.customer.whatsapp}</p>
                    </td>
                    <td className="py-2 max-w-xs">
                      <p className="truncate text-xs text-gray-500">
                        {o.items.map((i) => `${formatNumber(i.quantity)}x ${i.variant.name}`).join(", ")}
                      </p>
                    </td>
                    <td className="py-2 text-right font-medium">{formatCurrency(o.total, currency)}</td>
                    <td className="py-2">
                      <select
                        value={o.paymentStatus}
                        onChange={(e) => updateStatus(o.id, { paymentStatus: e.target.value as PaymentStatus })}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${paymentBadgeClass(o.paymentStatus)}`}
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={o.shippingStatus}
                        onChange={(e) => updateStatus(o.id, { shippingStatus: e.target.value as ShippingStatus })}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${shippingBadgeClass(o.shippingStatus)}`}
                      >
                        {SHIPPING_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No hay pedidos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm dark:border-gray-800">
          <span className="text-gray-500">
            Página {page} de {totalPages} ({total} pedidos)
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
              Anterior
            </button>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <CustomerDetailModal customerId={customerModal} onClose={() => setCustomerModal(null)} />
    </div>
  );
}

function CustomersView() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerModal, setCustomerModal] = useState<number | null>(null);
  const currency = useCurrency();

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const data = await api.get<CustomerRow[]>(`/api/customers?${params}`);
    setCustomers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <input
        className="input max-w-sm"
        placeholder="Buscar por nombre o WhatsApp..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="py-3 pl-4">Nombre</th>
                <th className="py-3">WhatsApp</th>
                <th className="py-3">Dirección</th>
                <th className="py-3 text-right">Pedidos</th>
                <th className="py-3 pr-4 text-right">Total gastado</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                customers.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pl-4">
                      <button
                        onClick={() => setCustomerModal(c.id)}
                        className="font-medium text-brand-700 hover:underline dark:text-brand-400"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="py-2">
                      <a
                        href={whatsappLink(c.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        <MessageCircle size={13} /> {c.whatsapp}
                      </a>
                    </td>
                    <td className="py-2 max-w-xs truncate text-gray-500">{c.address ?? "—"}</td>
                    <td className="py-2 text-right">{c.orderCount}</td>
                    <td className="py-2 pr-4 text-right font-medium">{formatCurrency(c.totalSpent, currency)}</td>
                  </tr>
                ))}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Todavía no hay clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerDetailModal customerId={customerModal} onClose={() => setCustomerModal(null)} />
    </div>
  );
}

function CustomerDetailModal({ customerId, onClose }: { customerId: number | null; onClose: () => void }) {
  type Detail = {
    customer: Customer & { createdAt: string; orders: Order[] };
    totalSpent: number;
    volumeByUnit: { unit: string; quantity: number }[];
    orderCount: number;
  };
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const currency = useCurrency();

  useEffect(() => {
    if (customerId == null) {
      setDetail(null);
      return;
    }
    setLoading(true);
    api.get<Detail>(`/api/customers/${customerId}`).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [customerId]);

  return (
    <Modal open={customerId != null} onClose={onClose} title="Ficha de cliente" widthClass="max-w-2xl">
      {loading || !detail ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{detail.customer.name}</p>
              <p className="text-sm text-gray-500">{detail.customer.address ?? "Sin dirección registrada"}</p>
              <p className="text-xs text-gray-400">
                Cliente desde {formatDateTime(detail.customer.createdAt)}
              </p>
            </div>
            <a
              href={whatsappLink(detail.customer.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#25D366] text-white hover:bg-[#1ebe57]"
            >
              <MessageCircle size={16} /> Chatear
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="card p-3">
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Wallet size={13} /> Total gastado
              </p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(detail.totalSpent, currency)}</p>
            </div>
            <div className="card p-3">
              <p className="text-xs text-gray-500">Pedidos realizados</p>
              <p className="mt-1 text-lg font-semibold">{detail.orderCount}</p>
            </div>
            <div className="card p-3 sm:col-span-1 col-span-2">
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Package size={13} /> Volumen comprado
              </p>
              <p className="mt-1 text-sm font-semibold">
                {detail.volumeByUnit.length > 0
                  ? detail.volumeByUnit.map((v) => `${formatNumber(v.quantity)} ${v.unit}`).join(" · ")
                  : "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Historial de pedidos</p>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {detail.customer.orders.length === 0 && (
                <p className="text-sm text-gray-400">Todavía no hizo ningún pedido.</p>
              )}
              {[...detail.customer.orders].reverse().map((o) => (
                <div key={o.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-gray-500">{formatDateTime(o.createdAt)}</span>
                    <span className="font-semibold">{formatCurrency(o.total, currency)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {o.items.map((i) => `${formatNumber(i.quantity)}x ${i.variant.name}`).join(", ")}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${paymentBadgeClass(o.paymentStatus)}`}>
                      {PAYMENT_STATUSES.find((s) => s.value === o.paymentStatus)?.label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${shippingBadgeClass(o.shippingStatus)}`}>
                      {SHIPPING_STATUSES.find((s) => s.value === o.shippingStatus)?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
