import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { created, noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { projectSchemas } from "../schemas/index.js";
import {
  createProject,
  deleteProject,
  getProject,
  getProjectStages,
  listProjects,
  setProjectStatus,
  setStageState,
  updateProject,
} from "../services/project.service.js";
import { listTasks } from "../services/task.service.js";
import { listActivities } from "../services/activity.service.js";
import { projectFinance } from "../services/finance.service.js";

export const projectRoutes = Router();

projectRoutes.get("/", validate(projectSchemas.list), wrap(async (req, res) => ok(res, await listProjects(req.query))));
projectRoutes.post("/", validate(projectSchemas.create), wrap(async (req, res) => created(res, await createProject(req.body))));
projectRoutes.get("/:id", wrap(async (req, res) => ok(res, await getProject(req.params.id))));
projectRoutes.patch("/:id", validate(projectSchemas.update), wrap(async (req, res) => ok(res, await updateProject(req.params.id, req.body))));
projectRoutes.post("/:id/status", validate(projectSchemas.setStatus), wrap(async (req, res) =>
  ok(res, await setProjectStatus(req.params.id, req.body.status)),
));
projectRoutes.delete("/:id", wrap(async (req, res) => {
  await deleteProject(req.params.id);
  noContent(res);
}));

/* Stages */
projectRoutes.get("/:id/stages", wrap(async (req, res) => ok(res, await getProjectStages(req.params.id))));
projectRoutes.post("/:id/stages/:stageId", validate(projectSchemas.setStage), wrap(async (req, res) =>
  ok(res, await setStageState(req.params.stageId, req.body.state)),
));

/* Tab data */
projectRoutes.get("/:id/tasks", wrap(async (req, res) => ok(res, await listTasks({ projectId: req.params.id }))));
projectRoutes.get("/:id/finance", wrap(async (req, res) => ok(res, await projectFinance(req.params.id))));
projectRoutes.get("/:id/activity", wrap(async (req, res) => ok(res, await listActivities({ entityType: "project", entityId: req.params.id }))));
