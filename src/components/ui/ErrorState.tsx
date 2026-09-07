import { Icon } from "@/components/icons/Icon";
import { Button } from "./Button";
import styles from "./ErrorState.module.css";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Your data is safe.",
  onRetry,
  retryLabel = "Try again",
  compact = false,
}: ErrorStateProps) {
  return (
    <div className={compact ? `${styles.root} ${styles.compact}` : styles.root} role="alert">
      <span className={styles.icon}>
        <Icon name="alert-triangle" size={compact ? 18 : 22} weight={1.8} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" iconLeft="refresh" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
