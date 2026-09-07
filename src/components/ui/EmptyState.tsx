import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  /** Primary call to action — usually a <Button>. */
  action?: ReactNode;
  /** Compact variant for inside cards / panels. */
  compact?: boolean;
}

export function EmptyState({ icon = "inbox", title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={compact ? `${styles.root} ${styles.compact}` : styles.root}>
      <span className={styles.icon}>
        <Icon name={icon} size={compact ? 18 : 22} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
