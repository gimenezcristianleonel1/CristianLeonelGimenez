import { createSignedToken, verifySignedToken } from "./session-token";

const CUSTOMER_SESSION_COOKIE = "customer_session";
const CUSTOMER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

function getSecret(): string {
  return (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev-insecure-secret-change-me"
  );
}

type CustomerTokenPayload = { customerId: number };

/** Genera un token de sesión firmado para un cliente autenticado. */
export async function createCustomerSessionToken(customerId: number): Promise<string> {
  return createSignedToken({ customerId }, getSecret(), CUSTOMER_SESSION_TTL_MS);
}

/** Verifica el token y devuelve el customerId si es válido, o null. */
export async function verifyCustomerSessionToken(
  token: string | undefined | null
): Promise<number | null> {
  const payload = await verifySignedToken<CustomerTokenPayload>(token, getSecret());
  if (!payload || typeof payload.customerId !== "number") return null;
  return payload.customerId;
}

export { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_TTL_MS };
