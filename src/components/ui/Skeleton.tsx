import { cn } from "@/utils/cn";
import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

/** Subtle shimmer placeholder. Prefer this over spinners for page/section loads. */
export function Skeleton({ width = "100%", height = 12, radius = "var(--r-tag)", className }: SkeletonProps) {
  return (
    <span
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** A few stacked lines — for text blocks. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.textBlock}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

/** Card-shaped skeleton for grids of cards. */
export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton height={13} width="40%" />
      <Skeleton height={30} width="55%" radius="var(--r-tag)" />
      <Skeleton height={11} width="70%" />
    </div>
  );
}
