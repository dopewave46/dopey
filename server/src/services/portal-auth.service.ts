import { db } from "../repositories/index.js";
import { env } from "../config/env.js";
import type { PortalCredential, PortalSession } from "../types/entities.js";
import { newId, newSessionToken } from "../utils/ids.js";
import { addHours, nowISO } from "../utils/dates.js";
import { verifyPassword } from "../utils/password.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

/**
 * Client-portal authentication — deliberately a *separate* system from
 * `auth.service.ts` (spec §3): its own failure/lockout tracking, its own
 * in-memory token map, its own `portal_sessions` table. A portal session can
 * never resolve to an admin user, and an admin session is never checked here.
 */

const failures = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const tokenBySession = new Map<string, string>();

export async function portalLogin(
  username: string,
  password: string,
  meta: { userAgent?: string; ip?: string },
): Promise<{ session: PortalSession; token: string; credential: PortalCredential }> {
  const key = username.toLowerCase().trim();
  const state = failures.get(key);
  if (state && state.lockedUntil > Date.now()) {
    logger.warn({ username: key }, "portal login blocked — too many attempts");
    throw new ForbiddenError("Too many failed attempts. Try again in a few minutes.");
  }

  const credential = await db.portalCredentials.find((c) => c.username === key);
  const good = credential ? await verifyPassword(password, credential.passwordHash) : false;

  if (!credential || !good || !credential.enabled) {
    const next = { count: (state?.count ?? 0) + 1, lockedUntil: 0 };
    if (next.count >= MAX_FAILURES) next.lockedUntil = Date.now() + LOCK_MS;
    failures.set(key, next);
    logger.warn({ username: key, ok: false }, "portal login failed");
    throw new UnauthorizedError("Username or password is incorrect.");
  }

  failures.delete(key);
  const now = nowISO();
  const token = newSessionToken();
  const session: PortalSession = {
    id: newId("psess"),
    clientId: credential.clientId,
    createdAt: now,
    expiresAt: addHours(now, env.SESSION_TTL_HOURS),
    userAgent: meta.userAgent,
    ip: meta.ip,
  };
  tokenBySession.set(session.id, token);
  await db.portalSessions.insert(session);
  logger.info({ username: key, ok: true }, "portal login ok");
  return { session, token, credential };
}

/** Resolve a cookie value (`sessionId.token`) to the authenticated client id. */
export async function resolvePortalSession(
  cookieValue: string | undefined,
): Promise<{ clientId: string; session: PortalSession }> {
  if (!cookieValue || !cookieValue.includes(".")) throw new UnauthorizedError();
  const [sessionId, token] = cookieValue.split(".");
  const session = await db.portalSessions.getById(sessionId);
  if (!session || tokenBySession.get(sessionId) !== token) throw new UnauthorizedError();
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroyPortalSession(sessionId);
    throw new UnauthorizedError("Your session has expired. Please sign in again.");
  }
  // The client (or their portal access) may have been removed/disabled since login.
  const credential = await db.portalCredentials.find((c) => c.clientId === session.clientId);
  if (!credential || !credential.enabled) {
    await destroyPortalSession(sessionId);
    throw new UnauthorizedError();
  }
  await db.portalSessions.patch(sessionId, { expiresAt: addHours(nowISO(), env.SESSION_TTL_HOURS) });
  return { clientId: session.clientId, session };
}

export async function destroyPortalSession(sessionId: string): Promise<void> {
  tokenBySession.delete(sessionId);
  await db.portalSessions.remove(sessionId);
}

export function makePortalCookieValue(session: PortalSession, token: string): string {
  return `${session.id}.${token}`;
}
