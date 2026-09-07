import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import type { ProjectSnapshot } from "@/data/sampleDashboard";
import s from "./sections.module.css";

/** Snapshot of the most time-sensitive active projects. */
export function ProjectFlowCard({ projects }: { projects: ProjectSnapshot[] }) {
  return (
    <Card>
      <CardHeader
        title="Project Flow"
        subtitle="Active work, most urgent first"
        action={<ViewAllLink to="/projects">View all projects</ViewAllLink>}
      />
      <div className={s.projectList}>
        {projects.slice(0, 4).map((p) => (
          <div key={p.id} className={s.projectRow}>
            <div className={s.projectName}>
              <div className={s.projectClient}>{p.client}</div>
              <div className={s.projectSub}>
                <span>{p.name}</span>
                <StatusBadge tone={p.overdue ? "error" : "progress"} hideDot>
                  {p.stageLabel}
                </StatusBadge>
              </div>
            </div>
            <div className={s.projectProgress}>
              <div className={s.pmeta}>
                <span>Progress</span>
                <span className={s.pct}>{p.progress}%</span>
              </div>
              <ProgressBar
                value={p.progress}
                size="sm"
                tone={p.overdue ? "error" : "crimson"}
                label={`${p.client} progress ${p.progress}%`}
              />
            </div>
            <div className={cn(s.projectDue, p.overdue && s.overdue)}>
              {p.overdue ? "Overdue" : `Due ${formatDate(p.dueDate)}`}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
