"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/admin/login", { password });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-lg font-semibold">Acceso de administración</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ingresá la contraseña para gestionar inventario, finanzas y ventas.
          </p>
        </div>

        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <div className="relative mb-4">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="password"
            type="password"
            className="input pl-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
