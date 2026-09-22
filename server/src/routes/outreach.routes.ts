import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { outreachSchemas } from "../schemas/index.js";
import { computeStreak, getLogHistory, getOrCreateTodayLog, updateTodayLog } from "../services/outreach.service.js";

export const outreachRoutes = Router();

outreachRoutes.get("/today", wrap(async (_req, res) => ok(res, await getOrCreateTodayLog())));
outreachRoutes.patch(
  "/today",
  validate(outreachSchemas.updateToday),
  wrap(async (req, res) => ok(res, await updateTodayLog(req.body))),
);
outreachRoutes.get(
  "/history",
  validate(outreachSchemas.history),
  wrap(async (req, res) => ok(res, await getLogHistory(req.query.limit ? Number(req.query.limit) : undefined))),
);
outreachRoutes.get("/streak", wrap(async (_req, res) => ok(res, { streak: await computeStreak() })));
