import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import type { ProjectStage } from "@/services/types";
import styles from "./ProjectTimeline.module.css";

const STATE_LABEL: Record<ProjectStage["state"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

/**
 * Timeline tab — the status stages as a clickable checklist. Clicking a stage
 * cycles its state (not_started → in_progress → done), which recomputes the
 * project's overall progress in the store.
 */
export function ProjectTimeline({
  stages,
  onCycle,
}: {
  stages: ProjectStage[];
  onCycle: (stageId: string) => void;
}) {
  const ordered = [...stages].sort((a, b) => a.order - b.order);
  return (
    <ol className={styles.list}>
      {ordered.map((stage) => (
        <li key={stage.id} className={cn(styles.item, styles[stage.state])}>
          <button
            type="button"
            className={styles.marker}
            onClick={() => onCycle(stage.id)}
            aria-label={`${stage.stageName}: ${STATE_LABEL[stage.state]}. Change state.`}
          >
            {stage.state === "done" ? (
              <Icon name="check" size={14} weight={3} />
            ) : stage.state === "in_progress" ? (
              <span className={styles.dot} />
            ) : null}
          </button>
          <div className={styles.body}>
            <span className={styles.name}>{stage.stageName}</span>
            <span className={styles.state}>{STATE_LABEL[stage.state]}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
