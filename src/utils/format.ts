/**
 * Formatting helpers — locked to DopeOrca defaults:
 * currency INR (₹), locale en-IN, timezone Asia/Kolkata.
 */

export const TIMEZONE = "Asia/Kolkata";
export const LOCALE = "en-IN";

const currencyFmt = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const currencyFmtPaise = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,25,000 — whole rupees by default (Indian digit grouping). */
export function formatCurrency(amount: number, withPaise = false): string {
  return (withPaise ? currencyFmtPaise : currencyFmt).format(amount);
}

/** Compact number, e.g. 1250 -> "1,250". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

/** Short ₹ for chart axes: 250000 -> "₹2.5L", 8000 -> "₹8k", 0 -> "₹0". */
export function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs % 1e7 === 0 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs % 1e5 === 0 ? 0 : 1)}L`;
  if (abs >= 1e3) return `${sign}₹${Math.round(abs / 1e3)}k`;
  return `${sign}₹${Math.round(abs)}`;
}

/** "7 Sep 2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(d);
}

/** Relative time, e.g. "2 hours ago", "just now". */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "just now";
}
