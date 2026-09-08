import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { created, noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { taskSchemas } from "../schemas/index.js";
import { bucketOf, createTask, deleteTask, getTask, listTasks, toggleTask, updateTask } from "../services/task.service.js";

export const taskRoutes = Router();

taskRoutes.get("/", validate(taskSchemas.list), wrap(async (req, res) => {
  const tasks = await listTasks(req.query);
  const counts = { today: 0, upcoming: 0, overdue: 0, completed: 0 };
  for (const t of await listTasks()) counts[bucketOf(t)] += 1;
  ok(res, tasks, 200, { counts });
}));

taskRoutes.post("/", validate(taskSchemas.create), wrap(async (req, res) => created(res, await createTask(req.body))));
taskRoutes.get("/:id", wrap(async (req, res) => ok(res, await getTask(req.params.id))));
taskRoutes.patch("/:id", validate(taskSchemas.update), wrap(async (req, res) => ok(res, await updateTask(req.params.id, req.body))));
taskRoutes.post("/:id/toggle", wrap(async (req, res) => ok(res, await toggleTask(req.params.id))));
taskRoutes.delete("/:id", wrap(async (req, res) => {
  await deleteTask(req.params.id);
  noContent(res);
}));
