import { createSignedToken, verifySignedToken } from "./session-token";

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-insecure-secret-change-me";
}

/** Genera un token de sesión firmado (payload + expiración + firma HMAC). */
export async function createSessionToken(): Promise<string> {
  return createSignedToken({}, getSecret(), SESSION_TTL_MS);
}

/** Verifica la firma y expiración de un token de sesión de administrador. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const payload = await verifySignedToken(token, getSecret());
  return payload !== null;
}

export { SESSION_COOKIE, SESSION_TTL_MS };
