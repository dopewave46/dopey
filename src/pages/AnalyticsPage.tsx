import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { ChartCard } from "@/components/charts/ChartCard";
import { useFinance } from "@/hooks/useFinance";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { moneyByMonth } from "@/services/financeSelectors";
import { isActiveStatus } from "@/services/projectSelectors";
import { periodMonths, periodRange, inRange, PERIOD_OPTIONS, type PeriodKey } from "@/utils/period";
import { formatCurrency, formatCurrencyShort, formatNumber } from "@/utils/format";
import styles from "./AnalyticsPage.module.css";

function countByMonth<T>(items: T[], getDate: (x: T) => string | undefined, buckets: ReturnType<typeof periodMonths>) {
  return buckets.map((b) => ({
    label: b.label,
    values: { count: items.filter((x) => inRange(getDate(x), b.start, b.end)).length },
  }));
}

export function AnalyticsPage() {
  const loading = useSimulatedLoad();
  const { invoices, payments, expenses } = useFinance();
  const { leads, clients } = useCrm();
  const { projects } = useProjects();
  const [period, setPeriod] = useState<PeriodKey>("6m");

  const buckets = useMemo(() => periodMonths(period), [period]);
  const { start, end } = useMemo(() => periodRange(period), [period]);

  const money = useMemo(
    () => moneyByMonth(invoices, payments, expenses, period),
    [invoices, payments, expenses, period],
  );

  const leadsCreated = leads.filter((l) => inRange(l.createdAt, start, end)).length;
  const won = leads.filter((l) => l.stage === "won").length;
  const lost = leads.filter((l) => l.stage === "lost").length;
  const conversionRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  const completedInPeriod = projects.filter(
    (p) => p.status === "completed" && inRange(p.updatedAt, start, end),
  ).length;
  const activeProjects = projects.filter((p) => isActiveStatus(p.status)).length;
  const avgProjectValue =
    projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.value, 0) / projects.length) : 0;

  const receivedTotal = money.reduce((s, m) => s + m.received, 0);
  const expensesTotal = money.reduce((s, m) => s + m.expenses, 0);
  const profitTotal = receivedTotal - expensesTotal;

  const leadsByMonth = useMemo(() => countByMonth(leads, (l) => l.createdAt, buckets), [leads, buckets]);
  const clientsByMonth = useMemo(() => countByMonth(clients, (c) => c.createdAt, buckets), [clients, buckets]);
  const completedByMonth = useMemo(
    () =>
      buckets.map((b) => ({
        label: b.label,
        values: {
          count: projects.filter((p) => p.status === "completed" && inRange(p.updatedAt, b.start, b.end)).length,
        },
      })),
    [projects, buckets],
  );

  const hasMoneyData = money.some((m) => m.received + m.pending + m.overdue > 0);
  const hasLeadData = leadsByMonth.some((m) => m.values.count > 0);

  if (loading) {
    return (
      <>
        <PageHeader title="Analytics" description="How DopeOrca is actually performing." />
        <div className={styles.statRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How DopeOrca is actually performing — every chart answers a real question."
        actions={
          <InlineSelect
            label="Period"
            value={period}
            onChange={(v) => setPeriod(v as PeriodKey)}
            options={PERIOD_OPTIONS}
          />
        }
      />

      <section className={styles.statRow} aria-label="Performance summary">
        <StatCard label="Revenue received" value={formatCurrency(receivedTotal)} icon="rupee" support={`Over ${buckets.length} months`} />
        <StatCard label="Leads created" value={formatNumber(leadsCreated)} icon="leads" support="This period" />
        <StatCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          icon="trending-up"
          support={`${won} won · ${lost} lost`}
        />
        <StatCard label="Projects completed" value={formatNumber(completedInPeriod)} icon="check" support="This period" />
        <StatCard label="Active projects" value={formatNumber(activeProjects)} icon="projects" support="Right now" />
        <StatCard label="Avg project value" value={formatCurrency(avgProjectValue)} icon="finance" support="All projects" />
      </section>

      <div className={styles.chartGrid}>
        <ChartCard
          title="Revenue over time"
          subtitle="Received, still pending, and overdue — by month"
          headline={formatCurrency(receivedTotal)}
          headlineNote="received this period"
          hasData={hasMoneyData}
        >
          <BarChart
            stacked
            data={money.map((m) => ({
              label: m.label,
              values: { received: m.received, pending: m.pending, overdue: m.overdue },
            }))}
            series={[
              { key: "received", label: "Received", color: "var(--success)" },
              { key: "pending", label: "Pending", color: "var(--warning)" },
              { key: "overdue", label: "Overdue", color: "var(--error)" },
            ]}
            formatValue={formatCurrencyShort}
          />
        </ChartCard>

        <ChartCard
          title="Lead conversion"
          subtitle="Leads created per month · win rate on closed leads"
          headline={`${conversionRate}%`}
          headlineNote={`${won} won of ${won + lost} closed`}
          hasData={hasLeadData}
        >
          <BarChart
            data={leadsByMonth.map((m) => ({ label: m.label, values: m.values }))}
            series={[{ key: "count", label: "Leads created", color: "var(--crimson)" }]}
            formatValue={(n) => String(Math.round(n))}
            hideLegend
          />
        </ChartCard>

        <ChartCard
          title="Project throughput"
          subtitle="Projects completed per month"
          headline={formatNumber(activeProjects)}
          headlineNote="active now"
          hasData={completedByMonth.some((m) => m.values.count > 0) || activeProjects > 0}
        >
          <BarChart
            data={completedByMonth.map((m) => ({ label: m.label, values: m.values }))}
            series={[{ key: "count", label: "Completed", color: "var(--crimson)" }]}
            formatValue={(n) => String(Math.round(n))}
            hideLegend
          />
        </ChartCard>

        <ChartCard
          title="Revenue vs expenses"
          subtitle="With estimated profit trend"
          headline={formatCurrency(profitTotal)}
          headlineNote="estimated profit this period"
          hasData={receivedTotal > 0 || expensesTotal > 0}
        >
          <BarChart
            data={money.map((m) => ({ label: m.label, values: { received: m.received, expenses: m.expenses } }))}
            series={[
              { key: "received", label: "Revenue", color: "var(--crimson)" },
              { key: "expenses", label: "Expenses", color: "var(--border-strong)" },
            ]}
            formatValue={formatCurrencyShort}
          />
          <div className={styles.subChart}>
            <LineChart
              data={money.map((m) => ({ label: m.label, values: { profit: m.profit } }))}
              series={[{ key: "profit", label: "Profit", color: "var(--success)", area: true }]}
              formatValue={formatCurrencyShort}
              zeroBased={false}
              height={140}
              hideLegend
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Client acquisition"
          subtitle="New clients per month"
          headline={formatNumber(clients.length)}
          headlineNote="clients total"
          hasData={clientsByMonth.some((m) => m.values.count > 0)}
        >
          <BarChart
            data={clientsByMonth.map((m) => ({ label: m.label, values: m.values }))}
            series={[{ key: "count", label: "New clients", color: "var(--crimson)" }]}
            formatValue={(n) => String(Math.round(n))}
            hideLegend
          />
        </ChartCard>
      </div>
    </>
  );
}
