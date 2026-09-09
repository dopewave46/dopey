import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { apiErrorMessage } from "@/utils/apiError";
import { crmStore } from "@/services/crmStore";
import type { FollowUp } from "@/services/types";

export interface ScheduleFollowUpModalProps {
  open: boolean;
  onClose: () => void;
  parentType: FollowUp["parentType"];
  parentId: string;
  parentName: string;
}

export function ScheduleFollowUpModal({
  open,
  onClose,
  parentType,
  parentId,
  parentName,
}: ScheduleFollowUpModalProps) {
  const toast = useToast();
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      const tomorrow = new Date(Date.now() + 86_400_000);
      setDate(tomorrow.toISOString().slice(0, 10));
      setNote(`Follow up with ${parentName}`);
    }
  }, [open, parentName]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) return;
    try {
      await crmStore.addFollowUp({
        parentType,
        parentId,
        dueDate: new Date(date).toISOString(),
        note: note.trim() || `Follow up with ${parentName}`,
      });
      toast.success("Follow-up scheduled", `${parentName} · ${new Date(date).toLocaleDateString("en-IN")}`);
      onClose();
    } catch (err) {
      toast.error("Couldn't schedule the follow-up", apiErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule a follow-up"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="followup-form">
            Schedule
          </Button>
        </>
      }
    >
      <form
        id="followup-form"
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}
      >
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      </form>
    </Modal>
  );
}
