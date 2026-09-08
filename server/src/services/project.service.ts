import { db } from "../repositories/index.js";
import type { Project, ProjectStage, ProjectStatus } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";
import { logActivity } from "./activity.service.js";
import { getClient } from "./client.service.js";

export const PROJECT_STAGE_FLOW: ProjectStatus[] = [
  "planning",
  "ui_ux",
  "development",
  "testing",
  "client_review",
  "revision",
  "ready_for_launch",
  "live",
  "completed",
];
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  ui_ux: "UI/UX",
  development: "Development",
  testing: "Testing",
  client_review: "Client Review",
  revision: "Revision",
  ready_for_launch: "Ready for Launch",
  live: "Live",
  completed: "Completed",
  on_hold: "On Hold",
};

/** Progress rollup from ProjectStage records (spec Section J, Prompt 06). */
export function progressFromStages(stages: ProjectStage[]): number {
  if (!stages.length) return 0;
  const score = stages.reduce(
    (s, st) => s + (st.state === "done" ? 1 : st.state === "in_progress" ? 0.5 : 0),
    0,
  );
  return Math.round((score / stages.length) * 100);
}

function buildStages(projectId: string, status: ProjectStatus): ProjectStage[] {
  const idx = PROJECT_STAGE_FLOW.indexOf(status);
  return PROJECT_STAGE_FLOW.map((stage, order) => {
    let state: ProjectStage["state"] = "not_started";
    if (status === "completed" || (idx >= 0 && order < idx)) state = "done";
    else if (idx >= 0 && order === idx) state = "in_progress";
    return {
      id: `${projectId}-stg-${order}`,
      projectId,
      stageName: PROJECT_STATUS_LABEL[stage],
      state,
      completionPercent: state === "done" ? 100 : state === "in_progress" ? 40 : 0,
      order,
    };
  });
}

export async function listProjects(filter: { status?: ProjectStatus; clientId?: string; q?: string } = {}): Promise<Project[]> {
  let rows = await db.projects.all();
  if (filter.status) rows = rows.filter((p) => p.status === filter.status);
  if (filter.clientId) rows = rows.filter((p) => p.clientId === filter.clientId);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((p) => p.name.toLowerCase().includes(q));
  }
  return rows.sort((a, b) => {
    const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    return ad - bd;
  });
}

export async function getProject(id: string): Promise<Project> {
  const project = await db.projects.getById(id);
  if (!project) throw new NotFoundError("Project");
  return project;
}

export async function getProjectStages(projectId: string): Promise<ProjectStage[]> {
  await getProject(projectId);
  return (await db.projectStages.filter((s) => s.projectId === projectId)).sort((a, b) => a.order - b.order);
}

export async function createProject(input: {
  clientId: string;
  name: string;
  value: number;
  startDate?: string;
  deadline?: string;
  status?: ProjectStatus;
  requirements?: string;
  notes?: string;
}): Promise<Project> {
  await getClient(input.clientId); // validates the linkage
  const id = newId("proj");
  const status = input.status ?? "planning";
  const stages = buildStages(id, status);
  const now = nowISO();
  const project: Project = {
    id,
    clientId: input.clientId,
    name: input.name,
    value: input.value,
    startDate: input.startDate,
    deadline: input.deadline,
    status,
    progressPercent: progressFromStages(stages),
    requirements: input.requirements,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.insert(project);
  for (const s of stages) await db.projectStages.insert(s);
  await logActivity("project", id, "project_created", `Project created — ${project.name}`);
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project> {
  await getProject(id);
  const updated = await db.projects.patch(id, patch);
  if (!updated) throw new NotFoundError("Project");
  return updated;
}

export async function setProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
  const project = await getProject(id);
  if (project.status === status) return project;

  if (status !== "on_hold") {
    // Re-align the linear stage checklist.
    const old = await db.projectStages.filter((s) => s.projectId === id);
    for (const s of old) await db.projectStages.remove(s.id);
    for (const s of buildStages(id, status)) await db.projectStages.insert(s);
  }
  const stages = await db.projectStages.filter((s) => s.projectId === id);
  const updated = (await db.projects.patch(id, { status, progressPercent: progressFromStages(stages) }))!;
  await logActivity("project", id, "status_changed", `${project.name} moved to ${PROJECT_STATUS_LABEL[status]}`);
  return updated;
}

export async function setStageState(stageId: string, state: ProjectStage["state"]): Promise<{ stage: ProjectStage; project: Project }> {
  const stage = await db.projectStages.getById(stageId);
  if (!stage) throw new NotFoundError("Project stage");
  const nextStage = (await db.projectStages.patch(stageId, {
    state,
    completionPercent: state === "done" ? 100 : state === "in_progress" ? 40 : 0,
  }))!;
  const stages = await db.projectStages.filter((s) => s.projectId === stage.projectId);
  const project = (await db.projects.patch(stage.projectId, { progressPercent: progressFromStages(stages) }))!;
  return { stage: nextStage, project };
}

export async function deleteProject(id: string): Promise<void> {
  const project = await getProject(id);
  await db.projects.remove(id);
  for (const s of await db.projectStages.filter((s) => s.projectId === id)) await db.projectStages.remove(s.id);
  for (const t of await db.tasks.filter((t) => t.projectId === id)) await db.tasks.remove(t.id);
  await logActivity("project", id, "project_deleted", `Project deleted — ${project.name}`);
}
