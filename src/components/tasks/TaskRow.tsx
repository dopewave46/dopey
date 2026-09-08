import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import { TASK_PRIORITY_COLOR, TASK_PRIORITY_LABELS } from "@/services/taskStore";
import { formatDate } from "@/utils/format";
import type { Task } from "@/services/types";
import styles from "./TaskRow.module.css";

export interface TaskRowProps {
  task: Task;
  projectName?: string;
  clientName?: string;
  onToggle: () => void;
  onOpen: () => void;
}

export function TaskRow({ task, projectName, clientName, onToggle, onOpen }: TaskRowProps) {
  const navigate = useNavigate();
  const done = task.status === "completed";
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const overdue = !done && task.dueDate && new Date(task.dueDate).getTime() < startOfToday;

  return (
    <div className={cn(styles.row, done && styles.done)}>
      <button
        type="button"
        className={styles.check}
        data-done={done}
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? "Mark task incomplete" : "Mark task complete"}
      >
        {done && <Icon name="check" size={12} weight={3} />}
      </button>

      <button type="button" className={styles.body} onClick={onOpen}>
        <span
          className={styles.priority}
          style={{ background: TASK_PRIORITY_COLOR[task.priority] }}
          title={`${TASK_PRIORITY_LABELS[task.priority]} priority`}
        />
        <span className={styles.title}>{task.title}</span>
      </button>

      <div className={styles.meta}>
        {task.projectId && projectName && (
          <button
            type="button"
            className={styles.chip}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${task.projectId}`);
            }}
          >
            <Icon name="projects" size={11} weight={2} />
            {projectName}
          </button>
        )}
        {clientName && !task.projectId && <span className={styles.client}>{clientName}</span>}
        {task.dueDate && (
          <span className={cn(styles.due, overdue && styles.overdue)}>{formatDate(task.dueDate)}</span>
        )}
      </div>
    </div>
  );
}
