import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { analyticsSchemas } from "../schemas/index.js";
import { analytics } from "../services/analytics.service.js";
import type { PeriodKey } from "../utils/dates.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/", validate({ query: analyticsSchemas.query }), wrap(async (req, res) =>
  ok(res, await analytics(req.query.period as PeriodKey)),
));
