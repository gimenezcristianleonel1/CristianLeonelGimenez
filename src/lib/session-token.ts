// Helpers genéricos de token de sesión firmado (HMAC-SHA256 + Web Crypto),
// usados tanto por la sesión de administrador como por la de clientes.
// Implementado con Web Crypto (globalThis.crypto) para funcionar tanto en
// rutas API (Node) como en middleware (Edge runtime) sin depender de Buffer.
// Edge Runtime prohíbe eval/Function dinámico, así que no puede haber ningún
// fallback a require("crypto") en este archivo: siempre usamos el global.

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

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(signatureBuffer));
}

/** Genera un token firmado con un payload arbitrario + expiración. */
export async function createSignedToken(
  payload: Record<string, unknown>,
  secret: string,
  ttlMs: number
): Promise<string> {
  const encoded = textToBase64Url(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }));
  const signature = await hmac(encoded, secret);
  return `${encoded}.${signature}`;
}

/** Verifica firma y expiración; devuelve el payload si es válido, o null. */
export async function verifySignedToken<T extends Record<string, unknown>>(
  token: string | undefined | null,
  secret: string
): Promise<T | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = await hmac(payload, secret);
  if (signature !== expectedSignature) return null;

  try {
    const parsed = JSON.parse(base64UrlToText(payload)) as T & { exp: number };
    if (typeof parsed.exp !== "number" || parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
