import { db } from "../repositories/index.js";
import { NotFoundError } from "../utils/errors.js";
import { PROJECT_STATUS_LABEL } from "./project.service.js";
import type { ProjectStatus } from "../types/entities.js";

/**
 * Client-facing read model (spec §3, §6, §8). Every function here takes the
 * `clientId` resolved from the portal session — never anything supplied by
 * the request — and returns ONLY display fields: no value/price, no invoice
 * or payment data, no internal notes. This is the one place that shape is
 * enforced, so it's also the audit surface for "no Finance data leaks" (§10).
 */

export interface PortalClientView {
  id: string;
  name: string;
  company?: string;
}

export interface PortalProjectView {
  id: string;
  name: string;
  status: ProjectStatus;
  statusLabel: string;
  progressPercent: number;
  deadline?: string;
  stages: Array<{ stageName: string; state: string; order: number }>;
}

export interface PortalUpdateView {
  id: string;
  projectId: string;
  title: string;
  note?: string;
  percentAtUpdate?: number;
  createdAt: string;
}

export async function getPortalMe(clientId: string): Promise<PortalClientView> {
  const client = await db.clients.getById(clientId);
  if (!client) throw new NotFoundError("Client");
  return { id: client.id, name: client.name, company: client.company };
}

export async function getPortalProjects(clientId: string): Promise<PortalProjectView[]> {
  const projects = (await db.projects.filter((p) => p.clientId === clientId)).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
  const out: PortalProjectView[] = [];
  for (const project of projects) {
    const stages = (await db.projectStages.filter((s) => s.projectId === project.id)).sort(
      (a, b) => a.order - b.order,
    );
    out.push({
      id: project.id,
      name: project.name,
      status: project.status,
      statusLabel: PROJECT_STATUS_LABEL[project.status],
      progressPercent: project.progressPercent,
      deadline: project.deadline,
      stages: stages.map((s) => ({ stageName: s.stageName, state: s.state, order: s.order })),
    });
  }
  return out;
}

export async function getPortalUpdates(clientId: string): Promise<PortalUpdateView[]> {
  const projectIds = new Set((await db.projects.filter((p) => p.clientId === clientId)).map((p) => p.id));
  const updates = await db.projectUpdates.filter((u) => projectIds.has(u.projectId));
  return updates
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((u) => ({
      id: u.id,
      projectId: u.projectId,
      title: u.title,
      note: u.note,
      percentAtUpdate: u.percentAtUpdate,
      createdAt: u.createdAt,
    }));
}
