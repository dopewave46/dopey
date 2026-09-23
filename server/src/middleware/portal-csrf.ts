import type { NextFunction, Request, Response } from "express";
import { newCsrfToken } from "../utils/ids.js";
import { ForbiddenError } from "../utils/errors.js";
import { SESSION_COOKIE_SAMESITE } from "../config/cookies.js";
import { PORTAL_SESSION_COOKIE } from "./portal-auth.js";

export const PORTAL_CSRF_COOKIE = "portal_csrf";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit-cookie CSRF for the client portal — the exact same pattern as
 * `middleware/csrf.ts`, mirrored with its own cookie name so the two systems
 * stay fully isolated (spec §3).
 */
export function portalCsrf(req: Request, res: Response, next: NextFunction): void {
  let token = req.cookies?.[PORTAL_CSRF_COOKIE] as string | undefined;
  if (!token) {
    token = newCsrfToken();
    res.cookie(PORTAL_CSRF_COOKIE, token, { httpOnly: false, path: "/", ...SESSION_COOKIE_SAMESITE });
  }

  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.cookies?.[PORTAL_SESSION_COOKIE]) return next(); // login bootstrap — nothing to protect yet

  const header = req.get(CSRF_HEADER);
  if (!header || header !== token) {
    return next(new ForbiddenError("Your request could not be verified. Refresh the page and try again."));
  }
  next();
}
