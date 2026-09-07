import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/icons/Icon";
import type { DashboardTask } from "@/data/sampleDashboard";
import s from "./sections.module.css";

/** Today's checklist. Checking is visual-only until the Tasks module lands. */
export function TodayTasksCard({ tasks }: { tasks: DashboardTask[] }) {
  const [state, setState] = useState<Record<string, boolean>>(
    () => Object.fromEntries(tasks.map((t) => [t.id, t.done])),
  );

  const toggle = (id: string) => setState((prev) => ({ ...prev, [id]: !prev[id] }));
  const remaining = tasks.filter((t) => !state[t.id]).length;

  return (
    <Card>
      <CardHeader
        title="Today's Tasks"
        subtitle={remaining === 0 ? "All done" : `${remaining} remaining`}
        action={<ViewAllLink to="/tasks">View all tasks</ViewAllLink>}
      />

      {tasks.length === 0 ? (
        <EmptyState compact icon="tasks" title="Nothing due today" />
      ) : (
        <div className={s.taskList}>
          {tasks.map((task) => {
            const done = state[task.id];
            return (
              <button
                key={task.id}
                type="button"
                className={s.taskItem}
                data-done={done}
                onClick={() => toggle(task.id)}
                aria-pressed={done}
              >
                <span className={s.checkbox}>
                  {done && <Icon name="check" size={12} weight={3} />}
                </span>
                <span className={s.taskLabel}>{task.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
