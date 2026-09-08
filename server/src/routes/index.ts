import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rate-limit.js";
import { authRoutes } from "./auth.routes.js";
import { healthRoutes } from "./health.routes.js";
import { leadRoutes } from "./leads.routes.js";
import { clientRoutes } from "./clients.routes.js";
import { followUpRoutes } from "./followups.routes.js";
import { projectRoutes } from "./projects.routes.js";
import { taskRoutes } from "./tasks.routes.js";
import { financeRoutes } from "./finance.routes.js";
import { analyticsRoutes } from "./analytics.routes.js";
import { amcRoutes } from "./amc.routes.js";
import { dashboardRoutes, notificationRoutes, searchRoutes, settingsRoutes } from "./misc.routes.js";

/**
 * Resource-based API mirroring the locked spec's routes exactly (Prompt 09 §4).
 * Everything except /api/health and /api/auth/(login|status) requires a valid
 * session — the gate is applied once, here.
 */
export const api = Router();

api.use("/health", healthRoutes);
api.use("/auth", authRoutes);

// --- authenticated ---
api.use(requireAuth);
api.use(apiLimiter);

api.use("/dashboard", dashboardRoutes);
api.use("/leads", leadRoutes);
api.use("/clients", clientRoutes);
api.use("/follow-ups", followUpRoutes);
api.use("/projects", projectRoutes);
api.use("/tasks", taskRoutes);
api.use("/finance", financeRoutes);
api.use("/analytics", analyticsRoutes);
api.use("/amc", amcRoutes);
api.use("/settings", settingsRoutes);
api.use("/notifications", notificationRoutes);
api.use("/search", searchRoutes);
