import type { IconName } from "@/components/icons/Icon";
import type { BadgeTone } from "@/components/ui/StatusBadge";
import type { TrendDirection } from "@/components/ui/StatCard";

/**
 * ---------------------------------------------------------------------------
 * Dashboard view-models + sample content.
 *
 * Every export here is PLACEHOLDER data, surfaced with a visible notice on the
 * page. The types are the contract each section binds to; a later prompt swaps
 * `getDashboardData()` for real aggregates from Leads / Finance / Tasks /
 * Projects / Activity without any section component changing.
 * ---------------------------------------------------------------------------
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
  at: string; // ISO
}

export interface ProjectSnapshot {
  id: string;
  client: string;
  name: string;
  stageLabel: string;
  progress: number;
  dueDate: string; // ISO
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

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

const SAMPLE: DashboardData = {
  metrics: [
    {
      key: "active-projects",
      label: "Active Projects",
      value: "9",
      support: "3 in progress",
      icon: "projects",
      trend: { direction: "up", text: "+2 this month" },
    },
    {
      key: "revenue",
      label: "Revenue (This Month)",
      value: "₹4,25,000",
      support: "vs ₹3,80,000 last month",
      icon: "rupee",
      trend: { direction: "up", text: "+12%" },
    },
    {
      key: "pending",
      label: "Pending Payments",
      value: "₹1,86,000",
      support: "across 4 clients",
      icon: "finance",
      trend: { direction: "flat", text: "2 due this week" },
    },
    {
      key: "clients",
      label: "Total Clients",
      value: "18",
      support: "92% retention",
      icon: "crm",
      trend: { direction: "up", text: "+1" },
    },
  ],
  today: {
    calls: 25,
    completed: 14,
    followUps: 6,
    meetings: 2,
    tasksRemaining: 5,
  },
  money: {
    revenue: 425000,
    collected: 339000,
    pending: 186000,
    target: 600000,
  },
  pipeline: [
    { key: "new", label: "New Leads", count: 12, tone: "info" },
    { key: "contacted", label: "Contacted", count: 9, tone: "progress" },
    { key: "interested", label: "Interested", count: 7, tone: "progress" },
    { key: "demo", label: "Demo / Meeting", count: 4, tone: "progress" },
    { key: "proposal", label: "Proposal", count: 3, tone: "warning" },
    { key: "won", label: "Won", count: 5, tone: "success" },
    { key: "lost", label: "Lost", count: 6, tone: "neutral" },
  ],
  tasks: [
    { id: "t1", label: "Call 25 prospects", done: false },
    { id: "t2", label: "Follow up with Blue Fig Studio", done: false },
    { id: "t3", label: "Finish remaining website fixes — Sea Salt Cafe", done: false },
    { id: "t4", label: "Send demo to Highfield Realty", done: true },
    { id: "t5", label: "Update project status — Kadam & Co.", done: false },
  ],
  activity: [
    { id: "a1", icon: "leads", tone: "crimson", text: "New lead added — Highfield Realty", at: hoursAgo(0.17) },
    { id: "a2", icon: "calendar", tone: "neutral", text: "Demo scheduled — Sea Salt Cafe", at: hoursAgo(0.53) },
    { id: "a3", icon: "check", tone: "success", text: "₹8,000 payment received — Kadam & Co.", at: hoursAgo(1) },
    { id: "a4", icon: "projects", tone: "crimson", text: "Project moved to Development — Blue Fig Studio", at: hoursAgo(2) },
    { id: "a5", icon: "finance", tone: "neutral", text: "Invoice INR-0142 sent — Sea Salt Cafe", at: hoursAgo(5) },
  ],
  projects: [
    {
      id: "p1",
      client: "Blue Fig Studio",
      name: "Brand website",
      stageLabel: "Development",
      progress: 72,
      dueDate: daysFromNow(9),
    },
    {
      id: "p2",
      client: "Sea Salt Cafe",
      name: "Website + booking",
      stageLabel: "Client Review",
      progress: 88,
      dueDate: daysFromNow(3),
    },
    {
      id: "p3",
      client: "Kadam & Co.",
      name: "Landing page refresh",
      stageLabel: "Final Fixes",
      progress: 95,
      dueDate: daysFromNow(1),
    },
    {
      id: "p4",
      client: "Highfield Realty",
      name: "Portal redesign",
      stageLabel: "Planning",
      progress: 12,
      dueDate: daysFromNow(-2),
      overdue: true,
    },
  ],
};

/** Async-shaped accessor so a later prompt can drop in a real fetch. */
export async function getDashboardData(): Promise<DashboardData> {
  return SAMPLE;
}
