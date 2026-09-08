/** Period helpers for Finance + Analytics. All month math is in local time. */

export type PeriodKey = "3m" | "6m" | "12m" | "ytd";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
];

export interface MonthBucket {
  /** "2026-09" */
  key: string;
  /** "Sep" */
  label: string;
  start: number;
  end: number;
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getTime();
}

export function monthKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** The month buckets covered by a period, oldest first. */
export function periodMonths(period: PeriodKey, ref = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const count =
    period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : ref.getMonth() + 1;
  const fmt = new Intl.DateTimeFormat("en-GB", { month: "short" });
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const start = startOfMonth(d.getFullYear(), d.getMonth());
    const end = startOfMonth(d.getFullYear(), d.getMonth() + 1);
    buckets.push({
      key: monthKey(d),
      label: fmt.format(d),
      start,
      end,
    });
  }
  return buckets;
}

/** Overall [start, end) for a period. */
export function periodRange(period: PeriodKey, ref = new Date()): { start: number; end: number } {
  const months = periodMonths(period, ref);
  return { start: months[0]?.start ?? 0, end: Date.now() + 1 };
}

export function inRange(iso: string | undefined, start: number, end: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start && t < end;
}
