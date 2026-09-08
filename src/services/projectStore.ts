import type { Project, ProjectStage, ProjectStatus, Task } from "./types";
import {
  SAMPLE_PROJECTS,
  SAMPLE_PROJECT_STAGES,
  SAMPLE_PROJECT_TASKS,
  SAMPLE_PROJECT_ACTIVITIES,
} from "@/data/sampleProjects";
import type { Activity } from "./types";

/**
 * In-memory Projects store — mirrors the shape of `crmStore` (Prompt 05).
 * Stands in for the backend until Prompt 09–11. Async-shaped reads/writes,
 * immutable slices, subscriber notifications so the list, board, detail tabs
 * and the client profile all stay in sync.
 */

interface ProjectState {
  projects: Project[];
  stages: ProjectStage[];
  tasks: Task[];
  activities: Activity[];
}

let state: ProjectState = {
  projects: SAMPLE_PROJECTS,
  stages: SAMPLE_PROJECT_STAGES,
  tasks: SAMPLE_PROJECT_TASKS,
  activities: SAMPLE_PROJECT_ACTIVITIES,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const nowISO = () => new Date().toISOString();
const id = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function set(next: Partial<ProjectState>) {
  state = { ...state, ...next };
  emit();
}

function pushActivity(entry: Omit<Activity, "id" | "createdAt">) {
  set({ activities: [{ ...entry, id: id("pact"), createdAt: nowISO() }, ...state.activities] });
}

/* ------------------------------------------------------------------ */
/* Status + stage config (locked spec Section G)                      */
/* ------------------------------------------------------------------ */

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
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

/** Linear pipeline (excludes On Hold, which is a state, not a stage). */
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

/** Board column order — the full status list including On Hold. */
export const PROJECT_BOARD_ORDER: ProjectStatus[] = [...PROJECT_STAGE_FLOW, "on_hold"];

/** Build a fresh stage checklist for a new project at a given status. */
export function buildStages(projectId: string, status: ProjectStatus): ProjectStage[] {
  const currentIndex = PROJECT_STAGE_FLOW.indexOf(status);
  return PROJECT_STAGE_FLOW.map((stage, order) => {
    let stageState: ProjectStage["state"] = "not_started";
    if (status === "completed") stageState = "done";
    else if (currentIndex >= 0 && order < currentIndex) stageState = "done";
    else if (currentIndex >= 0 && order === currentIndex) stageState = "in_progress";
    return {
      id: `${projectId}-stg-${order}`,
      projectId,
      stageName: PROJECT_STATUS_LABELS[stage],
      state: stageState,
      completionPercent: stageState === "done" ? 100 : stageState === "in_progress" ? 40 : 0,
      order,
    };
  });
}

function progressFromStages(stages: ProjectStage[]): number {
  if (stages.length === 0) return 0;
  const score = stages.reduce(
    (sum, s) => sum + (s.state === "done" ? 1 : s.state === "in_progress" ? 0.5 : 0),
    0,
  );
  return Math.round((score / stages.length) * 100);
}

/* ------------------------------------------------------------------ */

export const projectStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  addProject(input: {
    clientId: string;
    name: string;
    value: number;
    startDate?: string;
    deadline?: string;
    status: ProjectStatus;
    requirements?: string;
    notes?: string;
  }): Project {
    const project: Project = {
      id: id("proj"),
      clientId: input.clientId,
      name: input.name,
      value: input.value,
      startDate: input.startDate,
      deadline: input.deadline,
      status: input.status,
      progressPercent: 0,
      requirements: input.requirements,
      notes: input.notes,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    const stages = buildStages(project.id, project.status);
    project.progressPercent = progressFromStages(stages);
    set({
      projects: [project, ...state.projects],
      stages: [...state.stages, ...stages],
    });
    pushActivity({
      type: "project_created",
      entityType: "project",
      entityId: project.id,
      summary: `Project created — ${project.name}`,
    });
    return project;
  },

  updateProject(projectId: string, patch: Partial<Project>) {
    set({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...patch, updatedAt: nowISO() } : p,
      ),
    });
  },

  setStatus(projectId: string, status: ProjectStatus) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project || project.status === status) return;

    // Re-align the linear stage checklist unless moving to On Hold.
    let stages = state.stages;
    if (status !== "on_hold") {
      const rebuilt = buildStages(projectId, status);
      stages = [...state.stages.filter((s) => s.projectId !== projectId), ...rebuilt];
    }
    const projStages = stages.filter((s) => s.projectId === projectId);
    set({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, status, progressPercent: progressFromStages(projStages), updatedAt: nowISO() }
          : p,
      ),
      stages,
    });
    pushActivity({
      type: "status_changed",
      entityType: "project",
      entityId: projectId,
      summary: `${project.name} moved to ${PROJECT_STATUS_LABELS[status]}`,
    });
  },

  cycleStage(stageId: string) {
    const stage = state.stages.find((s) => s.id === stageId);
    if (!stage) return;
    const nextState: ProjectStage["state"] =
      stage.state === "not_started" ? "in_progress" : stage.state === "in_progress" ? "done" : "not_started";
    const stages = state.stages.map((s) =>
      s.id === stageId
        ? {
            ...s,
            state: nextState,
            completionPercent: nextState === "done" ? 100 : nextState === "in_progress" ? 40 : 0,
          }
        : s,
    );
    const projStages = stages.filter((s) => s.projectId === stage.projectId);
    set({
      stages,
      projects: state.projects.map((p) =>
        p.id === stage.projectId
          ? { ...p, progressPercent: progressFromStages(projStages), updatedAt: nowISO() }
          : p,
      ),
    });
  },

  deleteProject(projectId: string) {
    const project = state.projects.find((p) => p.id === projectId);
    set({
      projects: state.projects.filter((p) => p.id !== projectId),
      stages: state.stages.filter((s) => s.projectId !== projectId),
      tasks: state.tasks.filter((t) => t.projectId !== projectId),
    });
    if (project) {
      pushActivity({
        type: "project_deleted",
        entityType: "project",
        entityId: projectId,
        summary: `Project deleted — ${project.name}`,
      });
    }
  },

  addTask(projectId: string, title: string, dueDate?: string): Task {
    const task: Task = {
      id: id("task"),
      title,
      projectId,
      priority: "medium",
      status: "todo",
      dueDate,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    set({ tasks: [...state.tasks, task] });
    return task;
  },

  toggleTask(taskId: string) {
    set({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === "completed" ? "todo" : "completed",
              completedAt: t.status === "completed" ? undefined : nowISO(),
              updatedAt: nowISO(),
            }
          : t,
      ),
    });
  },

  addNote(projectId: string, notes: string) {
    projectStore.updateProject(projectId, { notes });
    pushActivity({
      type: "note_logged",
      entityType: "project",
      entityId: projectId,
      summary: "Notes updated",
    });
  },

  /** Append a project activity from another module (e.g. Finance payments). */
  noteActivity(projectId: string, type: string, summary: string) {
    if (!state.projects.some((p) => p.id === projectId)) return;
    pushActivity({ type, entityType: "project", entityId: projectId, summary });
  },
};
