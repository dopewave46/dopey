/**
 * Date helpers for business logic. The system's canonical timezone is
 * Asia/Kolkata (spec) but all stored timestamps are UTC ISO strings; "day"
 * boundaries for overdue / renewal math use the server's local day, which is
 * acceptable for a single-user tool and is centralised here so Prompt 10 can
 * make it timezone-exact in one place.
 */

export const DAY_MS = 86_400_000;

export function nowISO(): string {
  return new Date().toISOString();
}

export function startOfToday(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS);
}

export function isPast(iso: string | undefined): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

/** "YYYY-MM-DD" in local time — used for notification de-dup keys. */
export function dayKey(iso: string = nowISO()): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type PeriodKey = "3m" | "6m" | "12m" | "ytd";

export interface MonthBucket {
  key: string;
  label: string;
  start: number;
  end: number;
}

const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "short" });

export function periodMonths(period: PeriodKey, ref = new Date()): MonthBucket[] {
  const count =
    period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : ref.getMonth() + 1;
  const buckets: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_FMT.format(d),
      start,
      end,
    });
  }
  return buckets;
}

export function periodRange(period: PeriodKey, ref = new Date()): { start: number; end: number } {
  const months = periodMonths(period, ref);
  return { start: months[0]?.start ?? 0, end: Date.now() + 1 };
}

export function inRange(iso: string | undefined, start: number, end: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start && t < end;
}
