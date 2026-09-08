import { Link } from "react-router-dom";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TaskFormModal } from "./TaskFormModal";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/components/feedback/ToastProvider";
import { taskStore, TASK_PRIORITY_COLOR, TASK_PRIORITY_LABELS } from "@/services/taskStore";
import { formatDate } from "@/utils/format";
import type { Task } from "@/services/types";
import s from "@/components/crm/detail.module.css";

export interface TaskDrawerProps {
  task: Task | null;
  onClose: () => void;
  projectName?: string;
  clientName?: string;
}

/** Lightweight task detail — tasks are simple items, not full records. */
export function TaskDrawer({ task, onClose, projectName, clientName }: TaskDrawerProps) {
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteConfirm = useDisclosure();

  return (
    <>
      <Drawer
        open={task !== null}
        onClose={onClose}
        eyebrow={task ? TASK_PRIORITY_LABELS[task.priority] + " priority" : undefined}
        title={task?.title ?? ""}
        footer={
          task ? (
            <>
              <Button variant="danger" iconLeft="close" onClick={deleteConfirm.open}>
                Delete
              </Button>
              <Button variant="secondary" iconLeft="user" onClick={editModal.open}>
                Edit
              </Button>
            </>
          ) : undefined
        }
      >
        {task && (
          <>
            {task.description && <p className={s.prose}>{task.description}</p>}
            <dl className={s.fields}>
              <dt>Status</dt>
              <dd>{task.status === "completed" ? "Completed" : "To do"}</dd>
              <dt>Priority</dt>
              <dd>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: TASK_PRIORITY_COLOR[task.priority],
                    marginRight: 6,
                  }}
                />
                {TASK_PRIORITY_LABELS[task.priority]}
              </dd>
              <dt>Due</dt>
              <dd>{task.dueDate ? formatDate(task.dueDate) : "No date"}</dd>
              {task.projectId && (
                <>
                  <dt>Project</dt>
                  <dd>
                    <Link to={`/projects/${task.projectId}`} onClick={onClose}>
                      {projectName ?? "Project"}
                    </Link>
                  </dd>
                </>
              )}
              {task.clientId && (
                <>
                  <dt>Client</dt>
                  <dd>
                    <Link to={`/clients/${task.clientId}`} onClick={onClose}>
                      {clientName ?? "Client"}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
            {task.notes && (
              <div>
                <p style={{ font: "var(--t-meta)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>
                  Notes
                </p>
                <p className={s.prose}>{task.notes}</p>
              </div>
            )}
          </>
        )}
      </Drawer>

      <TaskFormModal open={editModal.isOpen} onClose={editModal.close} task={task ?? undefined} />
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onClose={deleteConfirm.close}
        onConfirm={() => {
          if (task) taskStore.deleteTask(task.id);
          deleteConfirm.close();
          onClose();
          toast.success("Task deleted");
        }}
        title="Delete this task?"
        message="This can't be undone."
        confirmLabel="Delete task"
        destructive
      />
    </>
  );
}
