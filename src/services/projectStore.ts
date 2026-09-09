import type { Activity, Project, ProjectStage, ProjectStatus } from "./types";
import { api } from "./api";
import { taskStore } from "./taskStore";
import type { StoreStatus } from "./storeStatus";

/**
 * Projects store (Prompt 11) — API-backed. Mirrors `crmStore`.
 *
 * `hydrate()` loads projects and their stage checklists from the backend.
 * Progress roll-up, stage re-alignment on status change, and activity logging
 * are all done server-side (Prompt 09 project.service) — this store just
 * reflects what the API returns, keeping the list, board, detail tabs and the
 * client profile in sync with PostgreSQL.
 */

interface ProjectState {
  projects: Project[];
  stages: ProjectStage[];
  activities: Activity[];
  status: StoreStatus;
  error: string | null;
}

let state: ProjectState = {
  projects: [],
  stages: [],
  activities: [],
  status: "idle",
  error: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: Partial<ProjectState>) {
  state = { ...state, ...next };
  emit();
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

/** Build a fresh stage checklist for a new project at a given status (used by
 *  the New Project modal preview before the server responds). */
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

async function fetchStagesFor(projectId: string): Promise<ProjectStage[]> {
  return api.get<ProjectStage[]>(`/projects/${projectId}/stages`);
}

function replaceStages(projectId: string, next: ProjectStage[]) {
  set({ stages: [...state.stages.filter((s) => s.projectId !== projectId), ...next] });
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

  async hydrate(): Promise<void> {
    if (state.status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const projects = await api.get<Project[]>("/projects");
      const stageLists = await Promise.all(projects.map((p) => fetchStagesFor(p.id)));
      set({ projects, stages: stageLists.flat(), status: "ready", error: null });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load projects",
      });
    }
  },

  async reload(): Promise<void> {
    const projects = await api.get<Project[]>("/projects");
    const stageLists = await Promise.all(projects.map((p) => fetchStagesFor(p.id)));
    set({ projects, stages: stageLists.flat() });
  },

  async reloadOne(projectId: string): Promise<void> {
    const [project, stages] = await Promise.all([
      api.get<Project>(`/projects/${projectId}`),
      fetchStagesFor(projectId),
    ]);
    set({ projects: state.projects.map((p) => (p.id === projectId ? project : p)) });
    replaceStages(projectId, stages);
  },

  async addProject(input: {
    clientId: string;
    name: string;
    value: number;
    startDate?: string;
    deadline?: string;
    status: ProjectStatus;
    requirements?: string;
    notes?: string;
  }): Promise<Project> {
    const project = await api.post<Project>("/projects", input);
    set({ projects: [project, ...state.projects] });
    replaceStages(project.id, await fetchStagesFor(project.id));
    return project;
  },

  async updateProject(projectId: string, patch: Partial<Project>): Promise<Project> {
    const updated = await api.patch<Project>(`/projects/${projectId}`, patch);
    set({ projects: state.projects.map((p) => (p.id === projectId ? updated : p)) });
    return updated;
  },

  async setStatus(projectId: string, status: ProjectStatus): Promise<void> {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project || project.status === status) return;
    const updated = await api.post<Project>(`/projects/${projectId}/status`, { status });
    set({ projects: state.projects.map((p) => (p.id === projectId ? updated : p)) });
    replaceStages(projectId, await fetchStagesFor(projectId));
  },

  async cycleStage(stageId: string): Promise<void> {
    const stage = state.stages.find((s) => s.id === stageId);
    if (!stage) return;
    const nextState: ProjectStage["state"] =
      stage.state === "not_started"
        ? "in_progress"
        : stage.state === "in_progress"
          ? "done"
          : "not_started";
    const { stage: nextStage, project } = await api.post<{ stage: ProjectStage; project: Project }>(
      `/projects/${stage.projectId}/stages/${stageId}`,
      { state: nextState },
    );
    set({
      stages: state.stages.map((s) => (s.id === stageId ? nextStage : s)),
      projects: state.projects.map((p) => (p.id === stage.projectId ? project : p)),
    });
  },

  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
    set({
      projects: state.projects.filter((p) => p.id !== projectId),
      stages: state.stages.filter((s) => s.projectId !== projectId),
    });
    // The backend cascades task deletion — mirror that locally.
    await taskStore.reload();
  },

  async addNote(projectId: string, notes: string): Promise<void> {
    await projectStore.updateProject(projectId, { notes });
  },

  /** Load a project's activity feed on demand (detail page). */
  async loadActivitiesFor(projectId: string): Promise<void> {
    const rows = await api.get<Activity[]>(`/projects/${projectId}/activity`);
    const byId = new Map(state.activities.map((a) => [a.id, a]));
    for (const a of rows) byId.set(a.id, a);
    set({ activities: [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) });
  },
};
