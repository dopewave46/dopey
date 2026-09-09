import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { apiErrorMessage } from "@/utils/apiError";
import { useProjects } from "@/hooks/useProjects";
import { useCrm } from "@/hooks/useCrm";
import { taskStore, TASK_PRIORITY_LABELS } from "@/services/taskStore";
import type { Task, TaskPriority } from "@/services/types";
import styles from "@/components/crm/LeadFormModal.module.css";

export interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Edit an existing task. */
  task?: Task;
  /** Pre-link a project / client. */
  prefill?: { projectId?: string; clientId?: string };
}

/**
 * THE shared task form — used from the /tasks page, the Dashboard quick
 * actions, the Project Detail Tasks tab and the Client Profile Tasks tab
 * (Prompt 08 §3, §8). Same fast single-step pattern as Add Lead.
 */
export function TaskFormModal({ open, onClose, task, prefill }: TaskFormModalProps) {
  const toast = useToast();
  const { projects } = useProjects();
  const { clients } = useCrm();
  const isEdit = Boolean(task);

  const [v, setV] = useState({
    title: "",
    description: "",
    projectId: "",
    clientId: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    notes: "",
  });
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    if (task) {
      setV({
        title: task.title,
        description: task.description ?? "",
        projectId: task.projectId ?? "",
        clientId: task.clientId ?? "",
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        notes: task.notes ?? "",
      });
    } else {
      setV({
        title: "",
        description: "",
        projectId: prefill?.projectId ?? "",
        clientId:
          prefill?.clientId ??
          projects.find((p) => p.id === prefill?.projectId)?.clientId ??
          "",
        priority: "medium",
        dueDate: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
  }, [open, task, prefill, projects]);

  const set = (key: keyof typeof v, value: string) => setV((prev) => ({ ...prev, [key]: value }));

  const onProjectChange = (projectId: string) => {
    setV((prev) => ({
      ...prev,
      projectId,
      clientId: projects.find((p) => p.id === projectId)?.clientId ?? prev.clientId,
    }));
  };

  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.title.trim()) {
      setError("Give the task a title.");
      return;
    }
    const payload = {
      title: v.title.trim(),
      description: v.description.trim() || undefined,
      projectId: v.projectId || undefined,
      clientId: v.clientId || undefined,
      priority: v.priority,
      dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : undefined,
      notes: v.notes.trim() || undefined,
    };
    setSaving(true);
    try {
      if (isEdit && task) {
        await taskStore.updateTask(task.id, payload);
        toast.success("Task updated");
      } else {
        await taskStore.addTask(payload);
        toast.success("Task added");
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit task" : "Add task"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={saving} disabled={saving}>
            {isEdit ? "Save changes" : "Save task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className={styles.form}>
        <Input
          label="Title"
          required
          autoFocus
          value={v.title}
          onChange={(e) => {
            set("title", e.target.value);
            if (error) setError(undefined);
          }}
          error={error}
          placeholder="e.g. Call 25 prospects"
        />
        <Textarea label="Description" value={v.description} onChange={(e) => set("description", e.target.value)} />

        <div className={styles.row}>
          <Select label="Project" value={v.projectId} onChange={(e) => onProjectChange(e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="Client" value={v.clientId} onChange={(e) => set("clientId", e.target.value)}>
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.row}>
          <Select label="Priority" value={v.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}>
            {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((pr) => (
              <option key={pr} value={pr}>
                {TASK_PRIORITY_LABELS[pr]}
              </option>
            ))}
          </Select>
          <Input label="Due date" type="date" value={v.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </div>

        <Textarea label="Notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </form>
    </Modal>
  );
}
