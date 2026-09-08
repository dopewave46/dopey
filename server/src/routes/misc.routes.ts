import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { searchLimiter } from "../middleware/rate-limit.js";
import { searchSchemas, settingsSchemas } from "../schemas/index.js";
import { dashboard } from "../services/dashboard.service.js";
import { search } from "../services/search.service.js";
import { getAgencySettings, updateSettings } from "../services/settings.service.js";
import { listNotifications, markAllRead, markRead } from "../services/notification.service.js";

/* ---------------- dashboard ---------------- */
export const dashboardRoutes = Router();
dashboardRoutes.get("/", wrap(async (_req, res) => ok(res, await dashboard())));

/* ---------------- search ---------------- */
export const searchRoutes = Router();
searchRoutes.get("/", searchLimiter, validate(searchSchemas), wrap(async (req, res) =>
  ok(res, await search(String(req.query.q), req.query.limit ? Number(req.query.limit) : undefined)),
));

/* ---------------- settings ---------------- */
export const settingsRoutes = Router();
settingsRoutes.get("/", wrap(async (_req, res) => ok(res, await getAgencySettings())));
settingsRoutes.patch("/", validate(settingsSchemas.update), wrap(async (req, res) => ok(res, await updateSettings(req.body))));

/* ---------------- notifications ---------------- */
export const notificationRoutes = Router();
notificationRoutes.get("/", wrap(async (req, res) =>
  ok(res, await listNotifications({ unreadOnly: req.query.unread === "true" })),
));
notificationRoutes.post("/:id/read", wrap(async (req, res) => ok(res, await markRead(req.params.id))));
notificationRoutes.post("/read-all", wrap(async (_req, res) => ok(res, { updated: await markAllRead() })));
