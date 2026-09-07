import { StatCard } from "@/components/ui/StatCard";
import type { Metric } from "@/data/sampleDashboard";
import s from "./sections.module.css";

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <section className={s.metrics} aria-label="Business metrics">
      {metrics.map((m) => (
        <StatCard
          key={m.key}
          label={m.label}
          value={m.value}
          icon={m.icon}
          tone={m.tone}
          trend={m.trend}
          support={m.support}
        />
      ))}
    </section>
  );
}
