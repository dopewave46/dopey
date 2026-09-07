import { cn } from "@/utils/cn";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Accessible label describing what is progressing. */
  label: string;
  size?: "sm" | "md";
  tone?: "crimson" | "success" | "warning" | "error";
  className?: string;
}

export function ProgressBar({ value, label, size = "md", tone = "crimson", className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn(styles.track, styles[size], className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className={cn(styles.fill, styles[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
