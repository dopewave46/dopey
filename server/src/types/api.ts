/**
 * The one response envelope used by every endpoint (spec Section J,
 * Prompt 09 §4 & §9). The frontend's existing error states (Prompt 03) expect
 * `error.message` to be a clean, human-readable string.
 */

export interface SuccessEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  error: {
    /** Human-readable — safe to show a user. Never a stack trace. */
    message: string;
    /** Machine-readable code, e.g. "validation_error", "not_found". */
    code: ErrorCode;
    /** Field-level detail for validation errors only. */
    details?: unknown;
  };
}

export type ErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server_error";

export const HTTP_STATUS_FOR_CODE: Record<ErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  server_error: 500,
};

export interface AuthedRequestUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
}
