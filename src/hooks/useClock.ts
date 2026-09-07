import { useEffect, useState } from "react";
import { TIMEZONE } from "@/utils/format";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: TIMEZONE,
});

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIMEZONE,
});

const timeWithSecondsFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: TIMEZONE,
});

const hour24Fmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hour12: false,
  timeZone: TIMEZONE,
});

export interface ClockValue {
  /** "03:23 PM" */
  time: string;
  /** "03:23:07 PM" */
  timeWithSeconds: string;
  /** "Monday, 7 September 2026" */
  date: string;
  /** Hour of day in Mumbai (IST), 0–23 — for time-of-day logic. */
  hour: number;
  /** Raw Date object (system clock). */
  now: Date;
}

function read(): ClockValue {
  const now = new Date();
  return {
    time: timeFmt.format(now).toUpperCase(),
    timeWithSeconds: timeWithSecondsFmt.format(now).toUpperCase(),
    date: dateFmt.format(now),
    hour: Number(hour24Fmt.format(now)) % 24,
    now,
  };
}

/**
 * Live clock locked to Mumbai / IST (Asia/Kolkata).
 * Updates every second without re-rendering the whole app.
 */
export function useClock(): ClockValue {
  const [value, setValue] = useState<ClockValue>(read);

  useEffect(() => {
    const id = window.setInterval(() => setValue(read()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return value;
}
