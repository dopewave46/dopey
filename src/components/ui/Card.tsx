import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover elevation + pointer affordance. */
  interactive?: boolean;
  /** Uses the larger panel radius (20px). */
  size?: "default" | "lg";
  padding?: "default" | "none";
}

export function Card({
  interactive = false,
  size = "default",
  padding = "default",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        size === "lg" && styles.lg,
        padding === "none" && styles.flush,
        interactive && styles.interactive,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  subtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headingGroup}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.body, className)} {...rest}>
      {children}
    </div>
  );
}
