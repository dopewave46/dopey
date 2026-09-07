import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { projectStore } from "@/services/projectStore";

/**
 * Minimal task creation for a project. The full Tasks module (priority, status,
 * buckets) is Prompt 08 — this uses the same fast-form pattern as Add Lead.
 */
export function AddProjectTaskModal({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setTitle("");
      setDue("");
      setError(undefined);
    }
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the task a title.");
      return;
    }
    projectStore.addTask(projectId, title.trim(), due ? new Date(due).toISOString() : undefined);
    toast.success("Task added");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add task"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-project-task-form">
            Add task
          </Button>
        </>
      }
    >
      <form
        id="add-project-task-form"
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}
      >
        <Input
          label="Task"
          required
          autoFocus
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(undefined);
          }}
          error={error}
          placeholder="e.g. Cross-browser QA on the work page"
        />
        <Input label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </form>
    </Modal>
  );
}
