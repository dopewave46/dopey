import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { useDisclosure } from "@/hooks/useDisclosure";

export interface GlobalActionsProps {
  /** Compact = icon-only button for tight header space. */
  compact?: boolean;
}

/**
 * The primary action system (Prompt 03 §9). "Start New Project" is the global
 * default; other modules mount their own contextual actions in the page header.
 * The form here demonstrates the modal + field components — persistence is
 * wired to the backend in a later prompt.
 */
export function GlobalActions({ compact = false }: GlobalActionsProps) {
  const modal = useDisclosure();
  const toast = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the project a name.");
      return;
    }
    toast.success("Project started", `"${name.trim()}" is ready — add the client and scope next.`);
    setName("");
    setError(undefined);
    modal.close();
  };

  return (
    <>
      <Button
        iconLeft="plus"
        size={compact ? "sm" : "md"}
        onClick={modal.open}
        aria-label="Start new project"
      >
        {compact ? "New Project" : "Start New Project"}
      </Button>

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title="Start a new project"
        description="Create the project now; client, value, and scope can be filled in on the project page."
        footer={
          <>
            <Button variant="secondary" onClick={modal.close}>
              Cancel
            </Button>
            <Button type="submit" form="new-project-form">
              Create project
            </Button>
          </>
        }
      >
        <form id="new-project-form" onSubmit={submit}>
          <Input
            label="Project name"
            required
            autoFocus
            placeholder="e.g. Blue Fig Studio — Website"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(undefined);
            }}
            error={error}
            hint="Shown on the project list and on invoices."
          />
        </form>
      </Modal>
    </>
  );
}
