import type { Project } from "./types";

/** Projects belonging to a client, most recently updated first. */
export function projectsForClient(projects: Project[], clientId: string): Project[] {
  return projects
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function isActiveStatus(status: Project["status"]): boolean {
  return status !== "completed" && status !== "on_hold";
}

/**
 * Per-project money lives in `financeSelectors.projectFinance` — the single
 * source of truth (Prompt 07 §9). Keep money logic out of here.
 */
