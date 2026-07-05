import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { verifyCustomerSessionToken, CUSTOMER_SESSION_COOKIE } from "@/lib/customerAuth";

// Endpoints públicos: catálogo/checkout de la tienda, autenticación de
// clientes y lectura de config (nombre del negocio, moneda, etiquetas) para
// que el storefront pueda pintarse.
const PUBLIC_API_PREFIXES = [
  "/api/public",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/customer-auth",
];

// Rutas de cuenta de cliente que no requieren tener sesión iniciada.
const CUSTOMER_PUBLIC_PAGES = ["/mi-cuenta/login", "/mi-cuenta/registro"];

function isPublicApi(pathname: string, method: string): boolean {
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/api/config") && method === "GET") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API de cliente (/api/me): requiere la sesión de cliente, no la de admin.
  if (pathname.startsWith("/api/me")) {
    const customerId = await verifyCustomerSessionToken(
      request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value
    );
    if (!customerId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname, request.method)) return NextResponse.next();
    const authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!authenticated) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (pathname === "/admin/login") {
      if (authenticated) return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (!authenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/mi-cuenta")) {
    if (CUSTOMER_PUBLIC_PAGES.includes(pathname)) return NextResponse.next();
    const customerId = await verifyCustomerSessionToken(
      request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value
    );
    if (!customerId) {
      return NextResponse.redirect(new URL("/mi-cuenta/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/mi-cuenta/:path*", "/api/:path*"],
};
