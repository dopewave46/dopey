import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { ok } from "../utils/envelope.js";
import { getMissionStatus } from "../services/mission.service.js";

export const missionRoutes = Router();

missionRoutes.get("/", wrap(async (_req, res) => ok(res, await getMissionStatus())));
