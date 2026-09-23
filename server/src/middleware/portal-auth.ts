import type { NextFunction, Request, Response } from "express";
import { resolvePortalSession } from "../services/portal-auth.service.js";
import { UnauthorizedError } from "../utils/errors.js";

export const PORTAL_SESSION_COOKIE = "portal_session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      portalClientId?: string;
      portalSessionId?: string;
    }
  }
}

/**
 * Gate for every /api/portal/* route except login (spec §3, §8). Resolves the
 * `portal_session` cookie to a client id — never trusts a client/project id
 * supplied by the request itself. Entirely separate from `requireAuth`: a
 * `portal_session` cookie has no meaning to admin routes, and an `orca_session`
 * cookie has no meaning here.
 */
export async function requirePortalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const cookie = req.cookies?.[PORTAL_SESSION_COOKIE] as string | undefined;
    const { clientId, session } = await resolvePortalSession(cookie);
    req.portalClientId = clientId;
    req.portalSessionId = session.id;
    next();
  } catch (err) {
    next(err instanceof Error ? err : new UnauthorizedError());
  }
}
