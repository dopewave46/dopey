import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { apiErrorMessage } from "@/utils/apiError";
import { crmStore } from "@/services/crmStore";
import type { FollowUp } from "@/services/types";

export function RescheduleModal({
  followUp,
  onClose,
}: {
  followUp: FollowUp | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState("");

  useEffect(() => {
    if (followUp) setDate(followUp.dueDate.slice(0, 10));
  }, [followUp]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!followUp || !date) return;
    try {
      await crmStore.rescheduleFollowUp(followUp.id, new Date(date).toISOString());
      toast.success("Follow-up rescheduled", new Date(date).toLocaleDateString("en-IN"));
      onClose();
    } catch (err) {
      toast.error("Couldn't reschedule", apiErrorMessage(err));
    }
  };

  return (
    <Modal
      open={followUp !== null}
      onClose={onClose}
      title="Reschedule follow-up"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reschedule-form">
            Save
          </Button>
        </>
      }
    >
      <form id="reschedule-form" onSubmit={submit}>
        <Input label="New date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </form>
    </Modal>
  );
}
