import { randomUUID, randomBytes } from "node:crypto";

/** Prefixed id, e.g. "lead_9f3a1c…" — readable in logs, still unique. */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

/** Opaque session token stored in the httpOnly cookie. */
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** CSRF token — safe to expose in a readable cookie for the double-submit check. */
export function newCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}
