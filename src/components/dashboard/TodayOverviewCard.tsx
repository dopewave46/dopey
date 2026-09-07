import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/utils/cn";
import type { TodayOverview } from "@/data/sampleDashboard";
import s from "./sections.module.css";

const CONFIG: Array<{ key: keyof TodayOverview; label: string; alert?: boolean }> = [
  { key: "calls", label: "Calls" },
  { key: "completed", label: "Completed" },
  { key: "followUps", label: "Follow-ups" },
  { key: "meetings", label: "Meetings" },
  { key: "tasksRemaining", label: "Tasks left", alert: true },
];

/** Today's outreach at a glance — the volume that drives DopeOrca's growth. */
export function TodayOverviewCard({ today }: { today: TodayOverview }) {
  return (
    <Card>
      <CardHeader title="Today" subtitle="Sales activity so far" />
      <div className={s.todayRow}>
        {CONFIG.map((item) => (
          <div key={item.key} className={cn(s.todayStat, item.alert && s.alert)}>
            <span className={s.num}>{today[item.key]}</span>
            <span className={s.cap}>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
