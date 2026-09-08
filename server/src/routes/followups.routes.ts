import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { created, noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { followUpSchemas } from "../schemas/index.js";
import {
  addFollowUp,
  bucketOf,
  completeFollowUp,
  deleteFollowUp,
  listFollowUps,
  rescheduleFollowUp,
} from "../services/followup.service.js";

export const followUpRoutes = Router();

/** Grouped by urgency for the Follow-ups page (Prompt 05 §11). */
followUpRoutes.get("/", validate(followUpSchemas.list), wrap(async (req, res) => {
  const rows = await listFollowUps({ ...req.query, status: (req.query.status as "pending" | "done") ?? "pending" });
  const grouped: Record<string, typeof rows> = { overdue: [], today: [], week: [], later: [] };
  for (const f of rows) grouped[bucketOf(f.dueDate)].push(f);
  ok(res, { grouped, flat: rows });
}));

followUpRoutes.post("/", validate(followUpSchemas.create), wrap(async (req, res) => created(res, await addFollowUp(req.body))));
followUpRoutes.post("/:id/complete", wrap(async (req, res) => ok(res, await completeFollowUp(req.params.id))));
followUpRoutes.post("/:id/reschedule", validate(followUpSchemas.reschedule), wrap(async (req, res) =>
  ok(res, await rescheduleFollowUp(req.params.id, req.body.dueDate)),
));
followUpRoutes.delete("/:id", wrap(async (req, res) => {
  await deleteFollowUp(req.params.id);
  noContent(res);
}));
