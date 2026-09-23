import { ApiError, type ApiErrorCode } from "./api";

/**
 * HTTP client for the client portal — deliberately separate from
 * `services/api.ts`. Same base URL and envelope shape as the admin API, but
 * reads the `portal_csrf` cookie (never `orca_csrf`) and has its own 401
 * handler so a portal session expiring never touches admin auth state.
 */

const BASE_URL = import.meta.env.PROD
  ? "/api"
  : import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

let onUnauthorized: (() => void) | null = null;

export function setPortalUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

const UNSAFE = new Set(["POST", "PATCH", "PUT", "DELETE"]);

interface RequestOptions {
  method?: string;
  body?: unknown;
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
    const csrf = readCookie("portal_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/portal${path}`, { method, headers, body, credentials: "include" });
  } catch {
    throw new ApiError("Can't reach the server. Check that the backend is running.", 0, "network_error");
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Your session has ended. Please sign in again.", 401, "unauthorized");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const error = (payload as { error?: { message?: string; code?: string } })?.error;
    throw new ApiError(
      error?.message ?? `Request failed (${res.status}).`,
      res.status,
      (error?.code as ApiErrorCode) ?? "server_error",
    );
  }

  return (payload as { data: T }).data;
}

export const portalApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
};
