"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Landmark,
  ShoppingCart,
  Wallet,
  Settings,
  Leaf,
  Users,
} from "lucide-react";
import { useLabel } from "@/components/providers/AppConfigProvider";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const productPlural = useLabel("product_plural", "Productos");

  const items = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/productos", label: productPlural, icon: Package },
    { href: "/admin/inventario", label: "Inventario", icon: ArrowLeftRight },
    { href: "/admin/finanzas", label: "Finanzas", icon: Landmark },
    { href: "/admin/ventas", label: "Ventas", icon: ShoppingCart },
    { href: "/admin/caja", label: "Caja", icon: Wallet },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Leaf size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Inventario &amp; Finanzas</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Panel de gestión</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-gray-400 dark:text-gray-600">
        Sistema genérico de inventario y finanzas
      </div>
    </aside>
  );
}
