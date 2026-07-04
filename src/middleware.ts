import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

// Endpoints públicos: catálogo/checkout de la tienda y lectura de config
// (nombre del negocio, moneda, etiquetas) para que el storefront pueda pintarse.
const PUBLIC_API_PREFIXES = ["/api/public", "/api/admin/login", "/api/admin/logout"];

function isPublicApi(pathname: string, method: string): boolean {
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/api/config") && method === "GET") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await verifySessionToken(token);

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname, request.method)) return NextResponse.next();
    if (!authenticated) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (authenticated) return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (!authenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
