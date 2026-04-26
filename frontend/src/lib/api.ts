import type { ApiError } from "@/types";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const TOKEN_KEY = "sqb_token";

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();
export function onUnauthorized(fn: UnauthorizedListener): () => void {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = opts;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...((headers as Record<string, string>) ?? {}),
  };

  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body
        ? isFormData
          ? (body as FormData)
          : JSON.stringify(body)
        : undefined,
    });
  } catch {
    throw { message: "Network error — check your connection." } satisfies ApiError;
  }

  if (response.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      tokenStorage.clear();
      unauthorizedListeners.forEach((fn) => fn());
    }

    const err = (data ?? {}) as Record<string, unknown>;
    let msg = String(err.detail ?? err.message ?? err.error ?? "Request failed");
    if (msg === "[object Object]") msg = defaultMessage(response.status);

    throw { message: msg, status: response.status } satisfies ApiError;
  }

  return data as T;
}

function defaultMessage(status: number): string {
  const msgs: Record<number, string> = {
    400: "Invalid request.",
    401: "Invalid credentials.",
    403: "Access denied.",
    404: "Not found.",
    413: "File too large.",
    415: "Unsupported file type.",
    422: "Invalid fields.",
    500: "Server error.",
  };
  return msgs[status] ?? "Something went wrong.";
}
