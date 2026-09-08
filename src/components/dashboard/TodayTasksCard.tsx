import { Card, CardHeader } from "@/components/ui/Card";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/icons/Icon";
import { taskStore } from "@/services/taskStore";
import type { Task } from "@/services/types";
import s from "./sections.module.css";

/**
 * Today's checklist — reads the real task store (Prompt 08 §8). Checking a box
 * updates everywhere the task shows.
 */
export function TodayTasksCard({ tasks }: { tasks: Task[] }) {
  const remaining = tasks.filter((t) => t.status !== "completed").length;

  return (
    <Card>
      <CardHeader
        title="Today's Tasks"
        subtitle={tasks.length === 0 ? undefined : remaining === 0 ? "All done" : `${remaining} remaining`}
        action={<ViewAllLink to="/tasks">View all tasks</ViewAllLink>}
      />

      {tasks.length === 0 ? (
        <EmptyState compact icon="tasks" title="Nothing due today" />
      ) : (
        <div className={s.taskList}>
          {tasks.map((task) => {
            const done = task.status === "completed";
            return (
              <button
                key={task.id}
                type="button"
                className={s.taskItem}
                data-done={done}
                onClick={() => taskStore.toggleTask(task.id)}
                aria-pressed={done}
              >
                <span className={s.checkbox}>{done && <Icon name="check" size={12} weight={3} />}</span>
                <span className={s.taskLabel}>{task.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
