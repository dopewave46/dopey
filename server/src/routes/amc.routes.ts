import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { created, noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { amcSchemas } from "../schemas/index.js";
import {
  addAmcTask,
  createAmc,
  decorate,
  deleteAmc,
  deleteAmcTask,
  getAmc,
  listAmcTasks,
  listAmcs,
  toggleAmcTask,
  updateAmc,
} from "../services/amc.service.js";

export const amcRoutes = Router();

amcRoutes.get("/", validate(amcSchemas.list), wrap(async (req, res) => ok(res, await listAmcs(req.query))));
amcRoutes.post("/", validate(amcSchemas.create), wrap(async (req, res) => created(res, await createAmc(req.body))));
amcRoutes.get("/:id", wrap(async (req, res) => ok(res, await decorate(await getAmc(req.params.id)))));
amcRoutes.patch("/:id", validate(amcSchemas.update), wrap(async (req, res) => ok(res, await updateAmc(req.params.id, req.body))));
amcRoutes.delete("/:id", wrap(async (req, res) => {
  await deleteAmc(req.params.id);
  noContent(res);
}));

/* Checklist (AMCTask) */
amcRoutes.get("/:id/tasks", wrap(async (req, res) => ok(res, await listAmcTasks(req.params.id))));
amcRoutes.post("/:id/tasks", validate(amcSchemas.addTask), wrap(async (req, res) =>
  created(res, await addAmcTask(req.params.id, req.body.title, req.body.dueDate)),
));
amcRoutes.post("/:id/tasks/:taskId/toggle", wrap(async (req, res) => ok(res, await toggleAmcTask(req.params.taskId))));
amcRoutes.delete("/:id/tasks/:taskId", wrap(async (req, res) => {
  await deleteAmcTask(req.params.taskId);
  noContent(res);
}));
