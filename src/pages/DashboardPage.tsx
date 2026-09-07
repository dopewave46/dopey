import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { CURRENT_ADMIN } from "@/services/session";
import { getDashboardData } from "@/data/sampleDashboard";
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
  const [showNotice, setShowNotice] = useState(true);

  return (
    <>
      <GreetingHeader name={CURRENT_ADMIN.name} />
      <QuickActions />

      {showNotice && (
        <div className={s.notice} role="note">
          <Icon name="alert-circle" size={16} weight={1.9} />
          <span>
            Preview data. Each section connects to live data as the CRM, Finance, Tasks, and Projects
            modules are built.
          </span>
          <button
            type="button"
            className={s.noticeClose}
            onClick={() => setShowNotice(false)}
            aria-label="Dismiss notice"
          >
            <Icon name="close" size={14} weight={2} />
          </button>
        </div>
      )}

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
          <MetricCards metrics={data.metrics} />

          <div className={s.split}>
            <TodayOverviewCard today={data.today} />
            <MoneyCard money={data.money} />
          </div>

          <div className={s.full}>
            <SalesPipelineCard pipeline={data.pipeline} />
          </div>

          <div className={s.split}>
            <TodayTasksCard tasks={data.tasks} />
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
