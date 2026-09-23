import { db } from "../repositories/index.js";
import type { ProjectUpdate } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";
import { getProject } from "./project.service.js";
import { logActivity } from "./activity.service.js";

/** Admin-authored progress notes a client sees on their portal timeline (spec §4). */

export async function listProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  await getProject(projectId);
  const rows = await db.projectUpdates.filter((u) => u.projectId === projectId);
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addProjectUpdate(
  projectId: string,
  input: { title: string; note?: string; percentAtUpdate?: number },
): Promise<ProjectUpdate> {
  const project = await getProject(projectId);
  const update: ProjectUpdate = {
    id: newId("update"),
    projectId,
    title: input.title,
    note: input.note,
    percentAtUpdate: input.percentAtUpdate,
    createdAt: nowISO(),
  };
  await db.projectUpdates.insert(update);
  await logActivity("project", projectId, "project_update_posted", `Update posted on ${project.name} — ${update.title}`);
  return update;
}

export async function deleteProjectUpdate(projectId: string, updateId: string): Promise<void> {
  const update = await db.projectUpdates.getById(updateId);
  if (!update || update.projectId !== projectId) throw new NotFoundError("Update");
  await db.projectUpdates.remove(updateId);
}
