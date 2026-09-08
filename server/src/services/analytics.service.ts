import { db } from "../repositories/index.js";
import { inRange, periodMonths, periodRange, type PeriodKey } from "../utils/dates.js";
import { moneyByMonth, revenueSummary } from "./finance.service.js";

/**
 * Analytics aggregations (spec Section J, Prompt 07 §7). Leads/pipeline feed
 * the conversion funnel; payments feed the revenue trend.
 */
export async function analytics(period: PeriodKey) {
  const { start, end } = periodRange(period);
  const buckets = periodMonths(period);
  const [leads, clients, projects] = await Promise.all([db.leads.all(), db.clients.all(), db.projects.all()]);

  const money = await moneyByMonth(period);
  const summary = await revenueSummary(period);

  const leadsCreated = leads.filter((l) => inRange(l.createdAt, start, end)).length;
  const won = leads.filter((l) => l.stage === "won").length;
  const lost = leads.filter((l) => l.stage === "lost").length;
  const conversionRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  const completedInPeriod = projects.filter((p) => p.status === "completed" && inRange(p.updatedAt, start, end)).length;
  const activeProjects = projects.filter((p) => p.status !== "completed" && p.status !== "on_hold").length;
  const avgProjectValue = projects.length ? Math.round(projects.reduce((s, p) => s + p.value, 0) / projects.length) : 0;

  const countByMonth = (rows: { createdAt: string }[]) =>
    buckets.map((b) => ({ label: b.label, count: rows.filter((r) => inRange(r.createdAt, b.start, b.end)).length }));
  const completedByMonth = buckets.map((b) => ({
    label: b.label,
    count: projects.filter((p) => p.status === "completed" && inRange(p.updatedAt, b.start, b.end)).length,
  }));

  return {
    period,
    summary: {
      revenueReceived: summary.received,
      leadsCreated,
      conversionRate,
      won,
      lost,
      projectsCompleted: completedInPeriod,
      activeProjects,
      avgProjectValue,
      estimatedProfit: summary.profit,
    },
    revenueOverTime: money.map((m) => ({ label: m.label, received: m.received, pending: m.pending, overdue: m.overdue })),
    revenueVsExpenses: money.map((m) => ({ label: m.label, revenue: m.received, expenses: m.expenses, profit: m.profit })),
    leadsByMonth: countByMonth(leads),
    clientsByMonth: countByMonth(clients),
    projectsCompletedByMonth: completedByMonth,
  };
}
