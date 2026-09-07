import { Card, CardHeader } from "@/components/ui/Card";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { cn } from "@/utils/cn";
import type { PipelineStage } from "@/data/sampleDashboard";
import s from "./sections.module.css";

const METER_COLOR: Record<PipelineStage["tone"], string> = {
  info: "var(--info)",
  progress: "var(--crimson)",
  warning: "var(--warning)",
  success: "var(--success)",
  error: "var(--error)",
  neutral: "var(--border-strong)",
};

/**
 * Glanceable pipeline — one compact card per stage. The full Kanban board
 * lives on the Leads page (Prompt 05).
 */
export function SalesPipelineCard({ pipeline }: { pipeline: PipelineStage[] }) {
  const max = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <Card>
      <CardHeader
        title="Sales Pipeline"
        subtitle="Leads by stage"
        action={<ViewAllLink to="/leads">Open pipeline</ViewAllLink>}
      />
      <div className={s.pipeline}>
        {pipeline.map((stage) => (
          <div
            key={stage.key}
            className={cn(
              s.stage,
              stage.key === "won" && s.won,
              stage.key === "lost" && s.lost,
            )}
          >
            <span className={s.stageCount}>{stage.count}</span>
            <span className={s.stageLabel}>{stage.label}</span>
            <span className={s.stageMeter}>
              <i
                style={{
                  width: `${(stage.count / max) * 100}%`,
                  background: METER_COLOR[stage.tone],
                }}
              />
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
