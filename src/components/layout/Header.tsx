"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Moon, Store, Sun, LogOut, X } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAppConfig } from "@/components/providers/AppConfigProvider";
import { api } from "@/lib/api-client";
import { Sidebar } from "./Sidebar";

export function Header() {
  const { theme, toggle } = useTheme();
  const { settings } = useAppConfig();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await api.post("/api/admin/logout");
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold">{settings.business_name ?? "Mi Negocio"}</h1>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/"
          target="_blank"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Ver tienda pública"
          title="Ver tienda pública"
        >
          <Store size={18} />
        </Link>
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={toggle}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <div className="relative">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              className="absolute right-[-44px] top-4 rounded-lg bg-white p-2 text-gray-700 shadow dark:bg-gray-900 dark:text-gray-200"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </header>
  );
}
