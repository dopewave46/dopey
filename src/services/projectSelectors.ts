import type { BadgeTone } from "@/components/ui/StatusBadge";
import type { Project } from "./types";
import { SAMPLE_PROJECT_FINANCE, type ProjectFinance } from "@/data/sampleProjects";

export type PaymentStatus = "paid" | "partial" | "pending";

export function financeFor(projectId: string): ProjectFinance {
  return SAMPLE_PROJECT_FINANCE[projectId] ?? { paid: 0, rows: [] };
}

export function paymentStatusFor(project: Project): {
  status: PaymentStatus;
  label: string;
  tone: BadgeTone;
  paid: number;
  pending: number;
} {
  const { paid } = financeFor(project.id);
  const pending = Math.max(0, project.value - paid);
  let status: PaymentStatus = "pending";
  if (project.value > 0 && paid >= project.value) status = "paid";
  else if (paid > 0) status = "partial";
  const meta: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
    paid: { label: "Paid", tone: "success" },
    partial: { label: "Partial", tone: "warning" },
    pending: { label: "Pending", tone: "neutral" },
  };
  return { status, ...meta[status], paid, pending };
}

/** Projects belonging to a client, most recently updated first. */
export function projectsForClient(projects: Project[], clientId: string): Project[] {
  return projects
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function isActiveStatus(status: Project["status"]): boolean {
  return status !== "completed" && status !== "on_hold";
}
