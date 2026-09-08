import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { created, noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { clientSchemas } from "../schemas/index.js";
import { createClient, deleteClient, getClient, listClients, updateClient } from "../services/client.service.js";
import { listProjects } from "../services/project.service.js";
import { listTasks } from "../services/task.service.js";
import { listActivities } from "../services/activity.service.js";
import { listFollowUps } from "../services/followup.service.js";
import { clientFinance } from "../services/finance.service.js";

export const clientRoutes = Router();

clientRoutes.get("/", validate(clientSchemas.list), wrap(async (req, res) => ok(res, await listClients(req.query))));
clientRoutes.post("/", validate(clientSchemas.create), wrap(async (req, res) => created(res, await createClient(req.body))));
clientRoutes.get("/:id", wrap(async (req, res) => ok(res, await getClient(req.params.id))));
clientRoutes.patch("/:id", validate(clientSchemas.update), wrap(async (req, res) => ok(res, await updateClient(req.params.id, req.body))));
clientRoutes.delete("/:id", wrap(async (req, res) => {
  await deleteClient(req.params.id);
  noContent(res);
}));

/* Aggregated tabs for the client profile — each reads from its own module. */
clientRoutes.get("/:id/projects", wrap(async (req, res) => ok(res, await listProjects({ clientId: req.params.id }))));
clientRoutes.get("/:id/tasks", wrap(async (req, res) => ok(res, await listTasks({ clientId: req.params.id }))));
clientRoutes.get("/:id/finance", wrap(async (req, res) => ok(res, await clientFinance(req.params.id))));
clientRoutes.get("/:id/activity", wrap(async (req, res) => ok(res, await listActivities({ entityType: "client", entityId: req.params.id }))));
clientRoutes.get("/:id/follow-ups", wrap(async (req, res) => ok(res, await listFollowUps({ parentType: "client", parentId: req.params.id }))));
