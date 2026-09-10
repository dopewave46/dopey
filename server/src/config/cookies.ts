import type { CookieOptions } from "express";
import { isProd } from "./env.js";

/**
 * SameSite / Secure attributes shared by the `orca_session` and `orca_csrf`
 * cookies.
 *
 * In production the frontend (e.g. Vercel) and backend (e.g. Render) sit on
 * different registrable domains, so the cookies are **cross-site** — the browser
 * only sends them on cross-origin requests when they are `SameSite=None; Secure`
 * (and Secure requires HTTPS, which every supported host terminates).
 *
 * Locally, the frontend and backend are both on `localhost` (same-site), so
 * `SameSite=Lax` over plain HTTP is used — `Secure` cookies would be dropped on
 * `http://localhost`.
 *
 * CORS already sends `Access-Control-Allow-Credentials: true` (see `app.ts`),
 * and the frontend fetch client uses `credentials: "include"`, which together
 * with these attributes is what makes the cross-domain session work.
 */
export const SESSION_COOKIE_SAMESITE = (
  isProd
    ? { sameSite: "none", secure: true }
    : { sameSite: "lax", secure: false }
) satisfies Pick<CookieOptions, "sameSite" | "secure">;
