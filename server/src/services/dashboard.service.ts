import { db } from "../repositories/index.js";
import { LEAD_STAGES } from "../types/entities.js";
import { revenueSummary } from "./finance.service.js";
import { bucketOf as taskBucket } from "./task.service.js";
import { bucketOf as followUpBucket } from "./followup.service.js";
import { listActivities } from "./activity.service.js";
import { renewalLeadDays } from "./settings.service.js";
import { amcStatus } from "./amc.service.js";
import { daysUntil } from "../utils/dates.js";

/**
 * Dashboard aggregation (spec Section J, Prompt 04) — one payload pulling
 * summary figures from every module.
 */
export async function dashboard() {
  const [leads, clients, projects, tasks, followUps, amcs] = await Promise.all([
    db.leads.all(),
    db.clients.all(),
    db.projects.all(),
    db.tasks.all(),
    db.followUps.all(),
    db.amcs.all(),
  ]);
  const activeLeads = leads.filter((l) => !l.archivedAt);
  const money = await revenueSummary("12m");
  const leadDays = await renewalLeadDays();

  const activeProjects = projects.filter((p) => p.status !== "completed" && p.status !== "on_hold");

  return {
    metrics: {
      activeProjects: activeProjects.length,
      totalLeads: activeLeads.length,
      activeClients: clients.filter((c) => c.status === "active").length,
      revenueReceived: money.received,
      pendingPayments: money.pending,
      overduePayments: money.overdue,
      tasksDueToday: tasks.filter((t) => taskBucket(t) === "today").length,
      activeAmcs: amcs.filter((a) => amcStatus(a, leadDays) !== "expired").length,
    },
    pipeline: LEAD_STAGES.map((stage) => ({
      stage,
      count: activeLeads.filter((l) => l.stage === stage).length,
    })),
    projectFlow: activeProjects
      .sort((a, b) => (a.deadline ?? "9999") < (b.deadline ?? "9999") ? -1 : 1)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        clientId: p.clientId,
        name: p.name,
        status: p.status,
        progressPercent: p.progressPercent,
        deadline: p.deadline,
      })),
    tasks: {
      today: tasks.filter((t) => taskBucket(t) === "today").length,
      upcoming: tasks.filter((t) => taskBucket(t) === "upcoming").length,
      overdue: tasks.filter((t) => taskBucket(t) === "overdue").length,
      completedThisWeek: tasks.filter(
        (t) => t.status === "completed" && t.completedAt && Date.now() - new Date(t.completedAt).getTime() < 7 * 86_400_000,
      ).length,
      todayItems: tasks
        .filter((t) => taskBucket(t) === "today")
        .map((t) => ({ id: t.id, title: t.title, status: t.status, projectId: t.projectId })),
    },
    money: {
      earned: money.earned,
      received: money.received,
      pending: money.pending,
      expenses: money.expenses,
      profit: money.profit,
    },
    followUps: {
      overdue: followUps.filter((f) => f.status === "pending" && followUpBucket(f.dueDate) === "overdue").length,
      today: followUps.filter((f) => f.status === "pending" && followUpBucket(f.dueDate) === "today").length,
    },
    renewals: amcs
      .map((a) => ({ ...a, daysToRenewal: daysUntil(a.renewalDate) }))
      .filter((a) => a.daysToRenewal <= leadDays)
      .sort((a, b) => a.daysToRenewal - b.daysToRenewal)
      .slice(0, 5)
      .map((a) => ({ id: a.id, clientId: a.clientId, service: a.service, renewalDate: a.renewalDate, daysToRenewal: a.daysToRenewal })),
    recentActivity: await listActivities({ limit: 8 }),
  };
}
