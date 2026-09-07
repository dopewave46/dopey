import { cn } from "@/utils/cn";
import styles from "./StatusBadge.module.css";

export type BadgeTone = "neutral" | "info" | "progress" | "warning" | "success" | "error";

export interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  /** Hide the leading dot (dot is on by default so status is not colour-only). */
  hideDot?: boolean;
  className?: string;
}

export function StatusBadge({ children, tone = "neutral", hideDot = false, className }: StatusBadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], hideDot && styles.noDot, className)}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Canonical status -> tone + label maps (locked semantics)           */
/* ------------------------------------------------------------------ */

export const PROJECT_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  planning: { label: "Planning", tone: "neutral" },
  ui_ux: { label: "UI/UX", tone: "progress" },
  development: { label: "Development", tone: "progress" },
  testing: { label: "Testing", tone: "progress" },
  client_review: { label: "Client Review", tone: "warning" },
  revision: { label: "Revision", tone: "warning" },
  ready_for_launch: { label: "Ready for Launch", tone: "info" },
  live: { label: "Live", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  on_hold: { label: "On Hold", tone: "error" },
};

export const LEAD_STAGE_META: Record<string, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "progress" },
  interested: { label: "Interested", tone: "progress" },
  proposal: { label: "Proposal", tone: "warning" },
  negotiation: { label: "Negotiation", tone: "warning" },
  won: { label: "Won", tone: "success" },
  lost: { label: "Lost", tone: "error" },
};

export const INVOICE_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "progress" },
  pending: { label: "Pending", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const TASK_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  todo: { label: "To Do", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "progress" },
  review: { label: "Review", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
};
