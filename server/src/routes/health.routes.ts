import { Router } from "express";
import { ok } from "../utils/envelope.js";
import { env } from "../config/env.js";

export const healthRoutes = Router();

/** Unauthenticated liveness check (spec Section L exempts this). */
healthRoutes.get("/", (_req, res) => {
  ok(res, { status: "ok", env: env.NODE_ENV, time: new Date().toISOString() });
});
