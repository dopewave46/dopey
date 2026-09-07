import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/utils/cn";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Project } from "@/services/types";
import { ProjectStatusBadge, PaymentStatusBadge } from "./badges";
import styles from "./ProjectCard.module.css";

export function ProjectCard({
  project,
  clientName,
  onClick,
}: {
  project: Project;
  clientName: string;
  onClick: () => void;
}) {
  const overdue =
    project.deadline &&
    project.status !== "completed" &&
    project.status !== "live" &&
    new Date(project.deadline) < new Date();

  return (
    <Card interactive className={styles.card} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
      <div className={styles.top}>
        <div className={styles.headings}>
          <span className={styles.client}>{clientName}</span>
          <span className={styles.name}>{project.name.replace(`${clientName} — `, "")}</span>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <div className={styles.progress}>
        <div className={styles.progressMeta}>
          <span>Progress</span>
          <span className={styles.pct}>{project.progressPercent}%</span>
        </div>
        <ProgressBar
          value={project.progressPercent}
          size="sm"
          label={`${project.name} progress`}
        />
      </div>

      <div className={styles.foot}>
        <span className={cn(styles.deadline, overdue && styles.overdue)}>
          <Icon name="calendar" size={13} weight={2} />
          {project.deadline ? (overdue ? `Overdue · ${formatDate(project.deadline)}` : `Due ${formatDate(project.deadline)}`) : "No deadline"}
        </span>
        <span className={styles.value}>{formatCurrency(project.value)}</span>
      </div>

      <div className={styles.payRow}>
        <PaymentStatusBadge project={project} />
      </div>
    </Card>
  );
}
