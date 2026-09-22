import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useMission } from "@/hooks/useMission";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { formatCurrency, formatDate } from "@/utils/format";
import type { MissionPhaseStatus } from "@/services/missionStore";
import styles from "./MissionPage.module.css";

const PHASE_STATUS_META: Record<MissionPhaseStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not Started", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "warning" },
  hit_target: { label: "Hit Target", tone: "success" },
  missed: { label: "Missed", tone: "error" },
};

/** 45-Day Mission dashboard — phase progress against real Finance revenue. */
export function MissionPage() {
  const loading = useSimulatedLoad();
  const { mission } = useMission();

  return (
    <>
      <PageHeader
        title={mission ? `Day ${mission.currentDay} of ${mission.phases[2]?.endDay ?? 45}` : "45-Day Mission"}
        description={
          mission
            ? `Phase ${mission.currentPhase} · ${mission.daysRemainingInPhase} day${mission.daysRemainingInPhase === 1 ? "" : "s"} left in this phase · started ${formatDate(mission.startDate)}`
            : "Phase progress toward the 45-day revenue goal."
        }
      />

      {loading || !mission ? (
        <Card>
          <SkeletonText lines={6} />
        </Card>
      ) : (
        <>
          <div className={styles.phaseGrid}>
            {mission.phases.map((phase) => {
              const meta = PHASE_STATUS_META[phase.status];
              return (
                <Card key={phase.phase}>
                  <CardHeader
                    title={`Phase ${phase.phase}`}
                    subtitle={`By Day ${phase.endDay}`}
                    action={<StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>}
                  />
                  <div className={styles.phaseBody}>
                    <div className={styles.phaseFigures}>
                      <span className={styles.phaseValue}>{formatCurrency(mission.revenueToDate)}</span>
                      <span className={styles.phaseTarget}>of {formatCurrency(phase.targetRevenue)}</span>
                    </div>
                    <ProgressBar
                      value={phase.progressPercent}
                      label={`Phase ${phase.phase} — ${phase.progressPercent}% of target`}
                      tone={phase.status === "hit_target" ? "success" : phase.status === "missed" ? "error" : "crimson"}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader title="Overall progress" subtitle="Cumulative revenue since Day 1" />
            <p className={styles.overallLine}>
              {formatCurrency(mission.revenueToDate)} of {formatCurrency(mission.totalTargetRevenue)} —{" "}
              {mission.daysRemainingOverall} day{mission.daysRemainingOverall === 1 ? "" : "s"} left.
            </p>
            <ProgressBar
              value={mission.totalTargetRevenue > 0 ? (mission.revenueToDate / mission.totalTargetRevenue) * 100 : 0}
              label="Overall mission progress"
            />
          </Card>
        </>
      )}
    </>
  );
}
