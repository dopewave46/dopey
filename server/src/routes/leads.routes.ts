import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { created, noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { leadSchemas } from "../schemas/index.js";
import {
  archiveLead,
  createLead,
  deleteLead,
  getLead,
  listLeads,
  logLeadCall,
  setLeadStage,
  updateLead,
} from "../services/lead.service.js";
import { convertLeadToClient } from "../services/conversion.service.js";
import { listActivities } from "../services/activity.service.js";
import { listFollowUps } from "../services/followup.service.js";

export const leadRoutes = Router();

leadRoutes.get("/", validate(leadSchemas.list), wrap(async (req, res) => ok(res, await listLeads(req.query))));

leadRoutes.post("/", validate(leadSchemas.create), wrap(async (req, res) => created(res, await createLead(req.body))));

leadRoutes.get("/:id", wrap(async (req, res) => ok(res, await getLead(req.params.id))));

leadRoutes.get("/:id/activity", wrap(async (req, res) =>
  ok(res, await listActivities({ entityType: "lead", entityId: req.params.id })),
));

leadRoutes.get("/:id/follow-ups", wrap(async (req, res) =>
  ok(res, await listFollowUps({ parentType: "lead", parentId: req.params.id })),
));

leadRoutes.patch("/:id", validate(leadSchemas.update), wrap(async (req, res) => ok(res, await updateLead(req.params.id, req.body))));

leadRoutes.post("/:id/stage", validate(leadSchemas.setStage), wrap(async (req, res) =>
  ok(res, await setLeadStage(req.params.id, req.body.stage)),
));

leadRoutes.post("/:id/log-call", validate(leadSchemas.logCall), wrap(async (req, res) =>
  ok(res, await logLeadCall(req.params.id, req.body.note)),
));

leadRoutes.post("/:id/convert", validate(leadSchemas.convert), wrap(async (req, res) =>
  created(res, await convertLeadToClient(req.params.id, req.body.client, req.body.project)),
));

leadRoutes.post("/:id/archive", wrap(async (req, res) => ok(res, await archiveLead(req.params.id))));

leadRoutes.delete("/:id", wrap(async (req, res) => {
  await deleteLead(req.params.id);
  noContent(res);
}));
