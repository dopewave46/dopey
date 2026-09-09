import type { IconName } from "@/components/icons/Icon";
import type { BadgeTone } from "@/components/ui/StatusBadge";
import type { TrendDirection } from "@/components/ui/StatCard";
import type { Activity } from "./types";
import { api } from "./api";
import { crmStore, LEAD_STAGE_LABELS } from "./crmStore";
import { PROJECT_STATUS_LABELS } from "./projectStore";
import { formatCurrency } from "@/utils/format";

/**
 * Dashboard view-models (Prompt 04) + the real data loader (Prompt 11 §4).
 *
 * `getDashboardData()` calls the single aggregate endpoint `GET /api/dashboard`
 * (Prompt 09 dashboard.service) and adapts it to the shape each section
 * component already binds to — no section component changes.
 */

export interface Metric {
  key: string;
  label: string;
  value: string;
  support: string;
  icon: IconName;
  trend?: { direction: TrendDirection; text: string };
  tone?: "default" | "error";
}

export interface TodayOverview {
  calls: number;
  completed: number;
  followUps: number;
  meetings: number;
  tasksRemaining: number;
}

export interface MoneyPosition {
  revenue: number;
  collected: number;
  pending: number;
  target: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  tone: BadgeTone;
}

export interface DashboardTask {
  id: string;
  label: string;
  done: boolean;
}

export interface ActivityItem {
  id: string;
  icon: IconName;
  tone: "crimson" | "success" | "neutral";
  text: string;
  at: string;
}

export interface ProjectSnapshot {
  id: string;
  client: string;
  name: string;
  stageLabel: string;
  progress: number;
  dueDate: string;
  overdue?: boolean;
}

export interface DashboardData {
  metrics: Metric[];
  today: TodayOverview;
  money: MoneyPosition;
  pipeline: PipelineStage[];
  tasks: DashboardTask[];
  activity: ActivityItem[];
  projects: ProjectSnapshot[];
}

/* ------------------------------------------------------------------ */
/* Backend payload shape (Prompt 09 dashboard.service)                */
/* ------------------------------------------------------------------ */

interface DashboardPayload {
  metrics: {
    activeProjects: number;
    totalLeads: number;
    activeClients: number;
    revenueReceived: number;
    pendingPayments: number;
    overduePayments: number;
    tasksDueToday: number;
    activeAmcs: number;
  };
  pipeline: Array<{ stage: string; count: number }>;
  projectFlow: Array<{
    id: string;
    clientId: string;
    name: string;
    status: string;
    progressPercent: number;
    deadline?: string;
  }>;
  tasks: {
    today: number;
    upcoming: number;
    overdue: number;
    completedThisWeek: number;
    todayItems: Array<{ id: string; title: string; status: string; projectId?: string }>;
  };
  money: { earned: number; received: number; pending: number; expenses: number; profit: number };
  followUps: { overdue: number; today: number };
  renewals: Array<{ id: string; clientId: string; service: string; renewalDate: string; daysToRenewal: number }>;
  recentActivity: Activity[];
}

const PIPELINE_TONE: Record<string, BadgeTone> = {
  new: "info",
  contacted: "progress",
  interested: "progress",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "neutral",
};

const ACTIVITY_META: Record<string, { icon: IconName; tone: ActivityItem["tone"] }> = {
  lead: { icon: "leads", tone: "crimson" },
  client: { icon: "crm", tone: "neutral" },
  project: { icon: "projects", tone: "crimson" },
  task: { icon: "check", tone: "success" },
  invoice: { icon: "finance", tone: "neutral" },
  payment: { icon: "check", tone: "success" },
  amc: { icon: "clock", tone: "neutral" },
};

function adapt(p: DashboardPayload): DashboardData {
  const clientName = (id: string) => {
    const c = crmStore.getSnapshot().clients.find((x) => x.id === id);
    return c?.company || c?.name || "Client";
  };
  const now = Date.now();

  return {
    metrics: [
      {
        key: "active-projects",
        label: "Active Projects",
        value: String(p.metrics.activeProjects),
        support: `${p.metrics.activeAmcs} maintenance plans`,
        icon: "projects",
      },
      {
        key: "revenue",
        label: "Revenue (received)",
        value: formatCurrency(p.metrics.revenueReceived),
        support: "last 12 months",
        icon: "rupee",
      },
      {
        key: "pending",
        label: "Pending Payments",
        value: formatCurrency(p.metrics.pendingPayments),
        support: p.metrics.overduePayments > 0 ? `${formatCurrency(p.metrics.overduePayments)} overdue` : "invoiced, unpaid",
        icon: "finance",
        tone: p.metrics.overduePayments > 0 ? "error" : "default",
      },
      {
        key: "clients",
        label: "Active Clients",
        value: String(p.metrics.activeClients),
        support: `${p.metrics.totalLeads} open leads`,
        icon: "crm",
      },
    ],
    today: {
      calls: 0,
      meetings: 0,
      completed: p.tasks.completedThisWeek,
      followUps: p.followUps.today + p.followUps.overdue,
      tasksRemaining: p.tasks.today + p.tasks.overdue,
    },
    money: {
      revenue: p.money.earned,
      collected: p.money.received,
      pending: p.money.pending,
      target: 600000,
    },
    pipeline: p.pipeline.map((row) => ({
      key: row.stage,
      label: LEAD_STAGE_LABELS[row.stage as keyof typeof LEAD_STAGE_LABELS] ?? row.stage,
      count: row.count,
      tone: PIPELINE_TONE[row.stage] ?? "progress",
    })),
    tasks: p.tasks.todayItems.map((t) => ({
      id: t.id,
      label: t.title,
      done: t.status === "completed",
    })),
    activity: p.recentActivity.map((a) => {
      const meta = ACTIVITY_META[a.entityType] ?? { icon: "bell" as IconName, tone: "neutral" as const };
      return { id: a.id, icon: meta.icon, tone: meta.tone, text: a.summary, at: a.createdAt };
    }),
    projects: p.projectFlow.map((pr) => ({
      id: pr.id,
      client: clientName(pr.clientId),
      name: pr.name,
      stageLabel: PROJECT_STATUS_LABELS[pr.status as keyof typeof PROJECT_STATUS_LABELS] ?? pr.status,
      progress: pr.progressPercent,
      dueDate: pr.deadline ?? "",
      overdue: pr.deadline ? new Date(pr.deadline).getTime() < now : false,
    })),
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const payload = await api.get<DashboardPayload>("/dashboard");
  return adapt(payload);
}
