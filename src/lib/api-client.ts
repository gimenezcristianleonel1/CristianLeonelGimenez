export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function handle<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type");
  const body = contentType?.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    throw new ApiClientError(body?.error ?? "Error en la solicitud", res.status, body?.details);
  }
  return body as T;
}

export const api = {
  get: <T>(url: string) => fetch(url, { cache: "no-store" }).then((r) => handle<T>(r)),
  post: <T>(url: string, data?: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    }).then((r) => handle<T>(r)),
  patch: <T>(url: string, data?: unknown) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    }).then((r) => handle<T>(r)),
  put: <T>(url: string, data?: unknown) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    }).then((r) => handle<T>(r)),
  delete: <T>(url: string) => fetch(url, { method: "DELETE" }).then((r) => handle<T>(r)),
};
