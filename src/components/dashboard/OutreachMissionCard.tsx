import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { useOutreach } from "@/hooks/useOutreach";
import { useMission } from "@/hooks/useMission";
import s from "./sections.module.css";

/** Today's outreach + mission-day snapshot — links through to /outreach and /mission. */
export function OutreachMissionCard() {
  const { today, streak } = useOutreach();
  const { mission } = useMission();

  const callsMade = today?.callsMade ?? 0;
  const callsTarget = today?.callsTarget ?? 30;
  const pct = callsTarget > 0 ? (callsMade / callsTarget) * 100 : 0;

  return (
    <Card>
      <CardHeader
        title="Outreach & Mission"
        subtitle={mission ? `Day ${mission.currentDay} of ${mission.phases[2]?.endDay ?? 45} · Phase ${mission.currentPhase}` : undefined}
        action={<ViewAllLink to="/mission">Mission</ViewAllLink>}
      />
      <div className={s.moneyGrid}>
        <div className={s.moneyItem}>
          <span className={s.moneyK}>Calls today</span>
          <span className={s.moneyV}>
            {callsMade} <span style={{ color: "var(--muted)", fontWeight: 400 }}>/ {callsTarget}</span>
          </span>
        </div>
        <div className={s.moneyItem}>
          <span className={s.moneyK}>Streak</span>
          <span className={s.moneyV}>{streak}d</span>
        </div>
        <div className={s.moneyItem}>
          <span className={s.moneyK}>Instagram</span>
          <span className={s.moneyV}>{today?.instagramPosted ? "Posted" : "Not yet"}</span>
        </div>
      </div>
      <ProgressBar value={pct} label={`${callsMade} of ${callsTarget} calls made today`} tone={pct >= 100 ? "success" : "crimson"} />
      <div style={{ marginTop: "var(--s-3)" }}>
        <ViewAllLink to="/outreach">Log today's calls</ViewAllLink>
      </div>
    </Card>
  );
}
