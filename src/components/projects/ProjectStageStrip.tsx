import { cn } from "@/utils/cn";
import { PROJECT_STAGE_FLOW, PROJECT_STATUS_LABELS } from "@/services/projectStore";
import type { ProjectStatus } from "@/services/types";
import styles from "./ProjectStageStrip.module.css";

/**
 * Read-only segmented stage strip (Prompt 02 design system) — shows the whole
 * linear pipeline with the current stage highlighted. Used on the Overview tab.
 * "On Hold" is a state, not a stage, so it dims the whole strip.
 */
export function ProjectStageStrip({ status }: { status: ProjectStatus }) {
  const currentIndex = PROJECT_STAGE_FLOW.indexOf(status);
  const onHold = status === "on_hold";

  return (
    <div className={cn(styles.strip, onHold && styles.held)} aria-label="Project stage">
      {PROJECT_STAGE_FLOW.map((stage, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const current = currentIndex >= 0 && i === currentIndex;
        return (
          <div
            key={stage}
            className={cn(styles.seg, done && styles.done, current && styles.current)}
            title={PROJECT_STATUS_LABELS[stage]}
          >
            <span className={styles.bar} />
            <span className={styles.label}>{PROJECT_STATUS_LABELS[stage]}</span>
          </div>
        );
      })}
      {onHold && <span className={styles.heldTag}>On Hold</span>}
    </div>
  );
}
