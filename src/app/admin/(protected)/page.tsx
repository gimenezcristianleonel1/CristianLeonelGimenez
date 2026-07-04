"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
} from "recharts";
import { TrendingUp, DollarSign, AlertTriangle, Wallet } from "lucide-react";
import { api } from "@/lib/api-client";
import { useCurrency } from "@/components/providers/AppConfigProvider";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";

type Summary = {
  salesSeries: { date: string; total: number; profit: number; count: number }[];
  topProducts: { variantId: number; name: string; sku: string; quantitySold: number; revenue: number }[];
  lowStock: {
    variantId: number;
    variantName: string;
    sku: string;
    productName: string;
    currentStock: number;
    minStock: number;
  }[];
  balance: { totalIncome: number; totalCogs: number; totalFixedCosts: number; netProfit: number };
};

const RANGE_OPTIONS = [
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const currency = useCurrency();

  useEffect(() => {
    setLoading(true);
    api
      .get<Summary>(`/api/dashboard/summary?days=${days}`)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [days]);

  const periodTotal = summary?.salesSeries.reduce((acc, d) => acc + d.total, 0) ?? 0;
  const periodProfit = summary?.salesSeries.reduce((acc, d) => acc + d.profit, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-800">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                days === opt.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !summary ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={`Ventas (${days}d)`}
              value={formatCurrency(periodTotal, currency)}
              icon={DollarSign}
            />
            <StatCard
              label={`Ganancia neta (${days}d)`}
              value={formatCurrency(periodProfit, currency)}
              icon={TrendingUp}
              tone={periodProfit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Utilidad neta histórica"
              value={formatCurrency(summary.balance.netProfit, currency)}
              icon={Wallet}
              tone={summary.balance.netProfit >= 0 ? "positive" : "negative"}
              hint="Ingresos - costo de mercadería - costos fijos"
            />
            <StatCard
              label="Alertas de stock bajo"
              value={String(summary.lowStock.length)}
              icon={AlertTriangle}
              tone={summary.lowStock.length > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card p-4 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Ventas y ganancia neta
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={summary.salesSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Legend />
                  <Bar dataKey="total" name="Ventas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Line dataKey="profit" name="Ganancia neta" stroke="#0ea5e9" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Top 5 productos vendidos
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={summary.topProducts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={110} fontSize={11} />
                  <Tooltip formatter={(v: number) => formatNumber(v)} />
                  <Bar dataKey="quantitySold" name="Cantidad" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Alertas de stock bajo
              </h2>
              {summary.lowStock.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay productos por debajo del stock mínimo.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400">
                        <th className="pb-2">Variante</th>
                        <th className="pb-2 text-right">Stock</th>
                        <th className="pb-2 text-right">Mínimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.lowStock.map((item) => (
                        <tr key={item.variantId} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="py-2">
                            <p className="font-medium">{item.variantName}</p>
                            <p className="text-xs text-gray-400">{item.sku}</p>
                          </td>
                          <td className="py-2 text-right font-medium text-red-600 dark:text-red-400">
                            {formatNumber(item.currentStock)}
                          </td>
                          <td className="py-2 text-right text-gray-500">{formatNumber(item.minStock)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Balance general (histórico)
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Ingresos totales</dt>
                  <dd className="font-medium">{formatCurrency(summary.balance.totalIncome, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Costo de mercadería vendida</dt>
                  <dd className="font-medium">- {formatCurrency(summary.balance.totalCogs, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Costos fijos (equiv. mensual)</dt>
                  <dd className="font-medium">
                    - {formatCurrency(summary.balance.totalFixedCosts, currency)}
                  </dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
                  <dt className="font-semibold">Utilidad neta</dt>
                  <dd
                    className={`font-semibold ${
                      summary.balance.netProfit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(summary.balance.netProfit, currency)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
