import type { NextFunction, Request, Response } from "express";
import { newCsrfToken } from "../utils/ids.js";
import { ForbiddenError } from "../utils/errors.js";
import { isProd } from "../config/env.js";
import { SESSION_COOKIE } from "./auth.js";

export const CSRF_COOKIE = "orca_csrf";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit-cookie CSRF protection (spec Section O). A readable `orca_csrf`
 * cookie is issued on every safe request; the frontend echoes it back in the
 * `X-CSRF-Token` header on POST/PATCH/DELETE. An attacker's site cannot read
 * our cookie, so it cannot forge the header.
 *
 * The check only applies to authenticated requests (a session cookie is
 * present) — an unauthenticated POST such as `/api/auth/login` is the bootstrap
 * that issues the first CSRF cookie, and can do no damage on its own.
 */
export function csrf(req: Request, res: Response, next: NextFunction): void {
  let token = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!token) {
    token = newCsrfToken();
    res.cookie(CSRF_COOKIE, token, { httpOnly: false, secure: isProd, sameSite: "lax", path: "/" });
  }

  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.cookies?.[SESSION_COOKIE]) return next(); // unauthenticated — nothing to protect

  const header = req.get(CSRF_HEADER);
  if (!header || header !== token) {
    return next(new ForbiddenError("Your request could not be verified. Refresh the page and try again."));
  }
  next();
}
