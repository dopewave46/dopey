import { useClock } from "@/hooks/useClock";
import { AGENCY } from "@/services/session";
import { cn } from "@/utils/cn";
import styles from "./Clock.module.css";

export interface ClockProps {
  /**
   * header  — two lines: time over "weekday, D Month YYYY" (default, for the app header)
   * compact — single line "03:23 PM · Mon 7 Sep" for tight spaces
   * full    — larger, with location line
   */
  variant?: "header" | "compact" | "full";
  showLocation?: boolean;
  className?: string;
}

export function Clock({ variant = "header", showLocation = variant === "full", className }: ClockProps) {
  const { time, date } = useClock();

  if (variant === "compact") {
    const shortDate = date.replace(
      /^(\w{3})\w*, (\d+) (\w{3})\w*.*/,
      (_m, wd: string, d: string, mo: string) => `${wd} ${d} ${mo}`,
    );
    return (
      <time className={cn(styles.compact, className)} dateTime={new Date().toISOString()}>
        {time} · {shortDate}
      </time>
    );
  }

  return (
    <time
      className={cn(styles.clock, variant === "full" && styles.full, className)}
      dateTime={new Date().toISOString()}
      aria-label={`Current time in Mumbai: ${time}, ${date}`}
    >
      <span className={styles.time}>{time}</span>
      <span className={styles.date}>{date}</span>
      {showLocation && <span className={styles.location}>{AGENCY.location} · IST</span>}
    </time>
  );
}
