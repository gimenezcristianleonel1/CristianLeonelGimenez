// Implementado con Web Crypto (crypto.subtle) y btoa/atob para que funcione
// tanto en rutas API (Node) como en middleware (Edge runtime), sin depender de Buffer.

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-insecure-secret-change-me";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function textToBase64Url(text: string): string {
  return toBase64Url(new TextEncoder().encode(text));
}

function base64UrlToText(value: string): string {
  return new TextDecoder().decode(fromBase64Url(value));
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(signatureBuffer));
}

/** Genera un token de sesión firmado (payload + expiración + firma HMAC). */
export async function createSessionToken(): Promise<string> {
  const payload = textToBase64Url(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }));
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

/** Verifica la firma y expiración de un token de sesión de administrador. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = await hmac(payload);
  if (signature !== expectedSignature) return false;

  try {
    const { exp } = JSON.parse(base64UrlToText(payload));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export { SESSION_COOKIE, SESSION_TTL_MS };
