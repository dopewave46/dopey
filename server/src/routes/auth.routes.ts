import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { ok, noContent } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, SESSION_COOKIE } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rate-limit.js";
import { authSchemas } from "../schemas/index.js";
import { changePassword, destroySession, login, makeCookieValue, toPublicUser } from "../services/auth.service.js";
import { getAdminUser } from "../services/auth.service.js";
import { env, isProd } from "../config/env.js";

export const authRoutes = Router();

authRoutes.post(
  "/login",
  authLimiter,
  validate(authSchemas.login),
  wrap(async (req, res) => {
    const { session, token, user } = await login(req.body.email, req.body.password, {
      userAgent: req.get("user-agent") ?? undefined,
      ip: req.ip,
    });
    res.cookie(SESSION_COOKIE, makeCookieValue(session, token), {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: env.SESSION_TTL_HOURS * 3_600_000,
    });
    ok(res, { user: toPublicUser(user) });
  }),
);

authRoutes.post(
  "/logout",
  requireAuth,
  wrap(async (req, res) => {
    if (req.sessionId) await destroySession(req.sessionId);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    noContent(res);
  }),
);

/** Who am I — the frontend calls this on load to hydrate the session. */
authRoutes.get(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    ok(res, { user: req.user });
  }),
);

authRoutes.post(
  "/change-password",
  requireAuth,
  validate(authSchemas.changePassword),
  wrap(async (req, res) => {
    await changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    noContent(res);
  }),
);

/** Whether setup has run (an admin exists). Unauthenticated. */
authRoutes.get(
  "/status",
  wrap(async (_req, res) => {
    const admin = await getAdminUser().catch(() => null);
    ok(res, { setUp: Boolean(admin) });
  }),
);
