import { db } from "../repositories/index.js";
import { env } from "../config/env.js";
import type { Session, User } from "../types/entities.js";
import type { AuthedRequestUser } from "../types/api.js";
import { newId, newSessionToken } from "../utils/ids.js";
import { addHours, nowISO } from "../utils/dates.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

/**
 * Single-admin authentication (spec Section L). Opaque session tokens stored
 * server-side in `db.sessions`; the token travels in an httpOnly cookie.
 * Sliding renewal on each authenticated request. Brute-force protection is a
 * simple per-email failure counter with backoff (rate-limit middleware also
 * guards the login route).
 */

const failures = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export function toPublicUser(user: User): AuthedRequestUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function getAdminUser(): Promise<User> {
  const admin = await db.users.find((u) => u.role === "admin");
  if (!admin) throw new UnauthorizedError("No admin account has been set up yet.");
  return admin;
}

export async function login(
  email: string,
  password: string,
  meta: { userAgent?: string; ip?: string },
): Promise<{ session: Session; token: string; user: User }> {
  const key = email.toLowerCase().trim();
  const state = failures.get(key);
  if (state && state.lockedUntil > Date.now()) {
    logger.warn({ email: key }, "login blocked — too many attempts");
    throw new ForbiddenError("Too many failed attempts. Try again in a few minutes.");
  }

  const user = await db.users.find((u) => u.email === key);
  const good = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !good) {
    const next = { count: (state?.count ?? 0) + 1, lockedUntil: 0 };
    if (next.count >= MAX_FAILURES) next.lockedUntil = Date.now() + LOCK_MS;
    failures.set(key, next);
    logger.warn({ email: key, ok: false }, "login failed");
    throw new UnauthorizedError("Email or password is incorrect.");
  }

  failures.delete(key);
  const now = nowISO();
  const token = newSessionToken();
  const session: Session = {
    id: newId("sess"),
    userId: user.id,
    createdAt: now,
    expiresAt: addHours(now, env.SESSION_TTL_HOURS),
    userAgent: meta.userAgent,
    ip: meta.ip,
  };
  // The cookie carries `${session.id}.${token}`; we store a hash-free token by
  // keeping it only in memory keyed on the session id.
  tokenBySession.set(session.id, token);
  await db.sessions.insert(session);
  logger.info({ email: key, ok: true }, "login ok");
  return { session, token, user };
}

const tokenBySession = new Map<string, string>();

/** Resolve a cookie value (`sessionId.token`) to the current user, or throw. */
export async function resolveSession(cookieValue: string | undefined): Promise<{ user: User; session: Session }> {
  if (!cookieValue || !cookieValue.includes(".")) throw new UnauthorizedError();
  const [sessionId, token] = cookieValue.split(".");
  const session = await db.sessions.getById(sessionId);
  if (!session || tokenBySession.get(sessionId) !== token) throw new UnauthorizedError();
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroySession(sessionId);
    throw new UnauthorizedError("Your session has expired. Please sign in again.");
  }
  const user = await db.users.getById(session.userId);
  if (!user) {
    await destroySession(sessionId);
    throw new UnauthorizedError();
  }
  // Sliding renewal.
  await db.sessions.patch(sessionId, { expiresAt: addHours(nowISO(), env.SESSION_TTL_HOURS) });
  return { user, session };
}

export async function destroySession(sessionId: string): Promise<void> {
  tokenBySession.delete(sessionId);
  await db.sessions.remove(sessionId);
}

export function makeCookieValue(session: Session, token: string): string {
  return `${session.id}.${token}`;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await db.users.getById(userId);
  if (!user) throw new UnauthorizedError();
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ValidationError("Your current password is incorrect.");
  }
  if (newPassword.length < 8) {
    throw new ValidationError("The new password must be at least 8 characters.");
  }
  await db.users.patch(userId, { passwordHash: await hashPassword(newPassword) });
  logger.info({ userId }, "password changed");
}

/** Remove expired sessions — called periodically from the job runner. */
export async function pruneSessions(): Promise<number> {
  const expired = await db.sessions.filter((s) => new Date(s.expiresAt).getTime() < Date.now());
  for (const s of expired) await destroySession(s.id);
  return expired.length;
}
