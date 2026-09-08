import type { NextFunction, Request, Response } from "express";
import type { AuthedRequestUser } from "../types/api.js";
import { resolveSession, toPublicUser } from "../services/auth.service.js";
import { UnauthorizedError } from "../utils/errors.js";

export const SESSION_COOKIE = "orca_session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedRequestUser;
      sessionId?: string;
    }
  }
}

/**
 * Every route except /api/auth/login and /api/health requires a valid session
 * (spec Section L, Prompt 09 §6). The middleware is structured so a role check
 * (`requireRole("admin")`) could be layered on later without a rewrite — for
 * now "authenticated" is the only gate.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const cookie = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const { user, session } = await resolveSession(cookie);
    req.user = toPublicUser(user);
    req.sessionId = session.id;
    next();
  } catch (err) {
    next(err instanceof Error ? err : new UnauthorizedError());
  }
}
