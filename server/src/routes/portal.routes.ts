import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { portalCsrf } from "../middleware/portal-csrf.js";
import { PORTAL_SESSION_COOKIE, requirePortalAuth } from "../middleware/portal-auth.js";
import { portalLoginLimiter } from "../middleware/rate-limit.js";
import { portalAuthSchemas } from "../schemas/index.js";
import { destroyPortalSession, makePortalCookieValue, portalLogin } from "../services/portal-auth.service.js";
import { getPortalMe, getPortalProjects, getPortalUpdates } from "../services/portal.service.js";
import { env } from "../config/env.js";
import { SESSION_COOKIE_SAMESITE } from "../config/cookies.js";

/**
 * Client portal API (spec §3). Mounted at /api/portal, NOT behind the admin
 * `requireAuth` gate — it has its own gate (`requirePortalAuth`) applied
 * per-route below. Every data route is filtered by the client id resolved
 * from `req.portalClientId`; nothing here ever accepts a client/project id
 * from the caller.
 */
export const portalRoutes = Router();

portalRoutes.use(portalCsrf);

portalRoutes.post(
  "/login",
  portalLoginLimiter,
  validate(portalAuthSchemas.login),
  wrap(async (req, res) => {
    const { session, token, credential } = await portalLogin(req.body.username, req.body.password, {
      userAgent: req.get("user-agent") ?? undefined,
      ip: req.ip,
    });
    res.cookie(PORTAL_SESSION_COOKIE, makePortalCookieValue(session, token), {
      httpOnly: true,
      path: "/",
      maxAge: env.SESSION_TTL_HOURS * 3_600_000,
      ...SESSION_COOKIE_SAMESITE,
    });
    ok(res, { client: await getPortalMe(credential.clientId) });
  }),
);

portalRoutes.post(
  "/logout",
  requirePortalAuth,
  wrap(async (req, res) => {
    if (req.portalSessionId) await destroyPortalSession(req.portalSessionId);
    res.clearCookie(PORTAL_SESSION_COOKIE, { path: "/", ...SESSION_COOKIE_SAMESITE });
    noContent(res);
  }),
);

portalRoutes.get(
  "/me",
  requirePortalAuth,
  wrap(async (req, res) => ok(res, { client: await getPortalMe(req.portalClientId!) })),
);

portalRoutes.get(
  "/project",
  requirePortalAuth,
  wrap(async (req, res) => ok(res, { projects: await getPortalProjects(req.portalClientId!) })),
);

portalRoutes.get(
  "/updates",
  requirePortalAuth,
  wrap(async (req, res) => ok(res, { updates: await getPortalUpdates(req.portalClientId!) })),
);
