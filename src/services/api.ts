/**
 * API client for DopeOrca OS (Prompt 11).
 *
 * The single seam between the frontend and the Express + PostgreSQL backend.
 * Every module calls through `api.*` — no component ever calls `fetch` directly.
 *
 *  - Base URL from `VITE_API_URL` (default `http://localhost:4000/api`).
 *  - `credentials: "include"` so the httpOnly `orca_session` cookie always rides.
 *  - CSRF: the readable `orca_csrf` cookie is echoed as `X-CSRF-Token` on every
 *    POST/PATCH/PUT/DELETE, automatically, here — nowhere else.
 *  - The backend envelope (`{ data }` / `{ error: { message, code, details? } }`)
 *    is unwrapped: success resolves to `data`, failure throws `ApiError`.
 *  - A 401 from any call triggers the registered unauthorized handler (the auth
 *    layer uses it to drop session state and route to /login).
 */

const BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:4000/api";

export type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server_error"
  | "network_error";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, string[]>;

  constructor(message: string, status: number, code: ApiErrorCode, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** First field-level message, if the backend returned any. */
  get firstFieldError(): string | undefined {
    if (!this.details) return undefined;
    for (const messages of Object.values(this.details)) {
      if (messages?.length) return messages[0];
    }
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* 401 handling — registered by the auth layer                        */
/* ------------------------------------------------------------------ */

let onUnauthorized: (() => void) | null = null;

/** The auth layer registers a handler here; it fires on any 401 response. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/* ------------------------------------------------------------------ */
/* CSRF                                                               */
/* ------------------------------------------------------------------ */

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

const UNSAFE = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/* ------------------------------------------------------------------ */
/* Request                                                            */
/* ------------------------------------------------------------------ */

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  if (UNSAFE.has(method)) {
    const csrf = readCookie("orca_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      credentials: "include",
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      "Can't reach the server. Check that the backend is running.",
      0,
      "network_error",
    );
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Your session has ended. Please sign in again.", 401, "unauthorized");
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const error = (payload as { error?: { message?: string; code?: string; details?: Record<string, string[]> } })?.error;
    throw new ApiError(
      error?.message ?? `Request failed (${res.status}).`,
      res.status,
      (error?.code as ApiErrorCode) ?? "server_error",
      error?.details,
    );
  }

  return (payload as { data: T }).data;
}

/** Raw request that also exposes the envelope's `meta` (some list endpoints use it). */
export async function requestWithMeta<T, M = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: M }> {
  // Re-run through `request` semantics but keep the envelope.
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  if (UNSAFE.has(method)) {
    const csrf = readCookie("orca_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      credentials: "include",
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Can't reach the server. Check that the backend is running.", 0, "network_error");
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Your session has ended. Please sign in again.", 401, "unauthorized");
  }

  const text = await res.text();
  const payload = text ? (JSON.parse(text) as { data: T; meta?: M; error?: { message?: string; code?: string; details?: Record<string, string[]> } }) : null;

  if (!res.ok) {
    throw new ApiError(
      payload?.error?.message ?? `Request failed (${res.status}).`,
      res.status,
      (payload?.error?.code as ApiErrorCode) ?? "server_error",
      payload?.error?.details,
    );
  }
  return { data: payload!.data, meta: payload?.meta };
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) =>
    request<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
  getWithMeta: requestWithMeta,
};
