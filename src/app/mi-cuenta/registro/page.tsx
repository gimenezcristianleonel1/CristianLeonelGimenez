"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, User, MapPin, Phone } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { useAppConfig } from "@/components/providers/AppConfigProvider";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { refresh } = useCustomerAuth();
  const { settings } = useAppConfig();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/customer-auth/register", {
        name,
        whatsapp,
        email,
        password,
        address: address || null,
      });
      await refresh();
      router.push("/mi-cuenta");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 py-10 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <Leaf size={32} />
          </div>
          <h1 className="font-heading text-2xl font-bold">{settings.business_name ?? "Mi Negocio"}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Creá tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-8">
          <div>
            <label className="label">Nombre</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 5493751123456"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className="input pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="input pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Dirección de envío (opcional)</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Se completa sola la próxima vez que hagas un pedido.
            </p>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tenés cuenta?{" "}
            <Link href="/mi-cuenta/login" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
              Iniciá sesión
            </Link>
          </p>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link href="/" className="text-gray-500 hover:underline dark:text-gray-400">
            ← Volver a la tienda
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link href="/admin/login" className="text-gray-500 hover:underline dark:text-gray-400">
            Ingreso administrador
          </Link>
        </div>
      </div>
    </div>
  );
}
