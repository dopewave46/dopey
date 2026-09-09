import { useMemo } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useFinance } from "@/hooks/useFinance";
import { useTasks } from "@/hooks/useTasks";
import { tasksInBucket } from "@/services/taskSelectors";
import { revenueSummary, currentMonthProgress } from "@/services/financeSelectors";
import { formatCurrency } from "@/utils/format";
import { CURRENT_ADMIN } from "@/services/session";
import { getDashboardData } from "@/services/dashboardData";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { TodayOverviewCard } from "@/components/dashboard/TodayOverviewCard";
import { MoneyCard } from "@/components/dashboard/MoneyCard";
import { SalesPipelineCard } from "@/components/dashboard/SalesPipelineCard";
import { TodayTasksCard } from "@/components/dashboard/TodayTasksCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { ProjectFlowCard } from "@/components/dashboard/ProjectFlowCard";
import s from "@/components/dashboard/sections.module.css";

export function DashboardPage() {
  const { data, loading, error, reload } = useAsyncData(getDashboardData);
  const { invoices, payments, expenses } = useFinance();
  const { tasks } = useTasks();

  const todayTasks = useMemo(() => tasksInBucket(tasks, "today"), [tasks]);

  // The Money section + Revenue/Pending metrics read from the Finance store
  // (Prompt 07 §9) — one source of truth, never drifting from /finance.
  const fin = useMemo(() => revenueSummary(invoices, payments, expenses, "12m"), [invoices, payments, expenses]);
  const month = useMemo(() => currentMonthProgress(invoices, payments), [invoices, payments]);

  const money = {
    revenue: month.earned,
    collected: month.received,
    pending: fin.pending,
    target: data?.money.target ?? 600000,
  };
  const metrics = (data?.metrics ?? []).map((m) => {
    if (m.key === "revenue")
      return { ...m, label: "Revenue (received)", value: formatCurrency(fin.received), support: "last 12 months" };
    if (m.key === "pending")
      return { ...m, label: "Pending Payments", value: formatCurrency(fin.pending), support: "invoiced, unpaid" };
    return m;
  });

  return (
    <>
      <GreetingHeader name={CURRENT_ADMIN.name} />
      <QuickActions />

      {error ? (
        <ErrorState
          title="Couldn't load your dashboard"
          message="Something went wrong pulling today's numbers."
          onRetry={reload}
        />
      ) : loading || !data ? (
        <div className={s.metrics}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <MetricCards metrics={metrics} />

          <div className={s.split}>
            <TodayOverviewCard today={data.today} />
            <MoneyCard money={money} />
          </div>

          <div className={s.full}>
            <SalesPipelineCard pipeline={data.pipeline} />
          </div>

          <div className={s.split}>
            <TodayTasksCard tasks={todayTasks} />
            <RecentActivityCard activity={data.activity} />
          </div>

          <div className={s.full}>
            <ProjectFlowCard projects={data.projects} />
          </div>
        </>
      )}
    </>
  );
}
