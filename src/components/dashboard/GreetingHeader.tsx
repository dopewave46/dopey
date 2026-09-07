import { useClock } from "@/hooks/useClock";
import s from "./sections.module.css";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Personal greeting + date. The live clock stays in the global header. */
export function GreetingHeader({ name, action }: { name: string; action?: React.ReactNode }) {
  const { hour, date } = useClock();
  const firstName = name.split(/\s+/)[0];

  return (
    <div className={s.greeting}>
      <div className={s.greetingText}>
        <h1>
          {greetingFor(hour)}, {firstName}
        </h1>
        <p>{date}</p>
      </div>
      {action}
    </div>
  );
}
