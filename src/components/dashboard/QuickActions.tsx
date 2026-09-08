import { Button } from "@/components/ui/Button";
import { GlobalActions } from "@/components/shell/GlobalActions";
import { LeadFormModal } from "@/components/crm/LeadFormModal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { RecordPaymentModal } from "@/components/finance/RecordPaymentModal";
import { useDisclosure } from "@/hooks/useDisclosure";
import s from "./sections.module.css";

/**
 * Fast access to the common actions — every one opens the same shared modal
 * used elsewhere in the app (no duplicates).
 */
export function QuickActions() {
  const lead = useDisclosure();
  const task = useDisclosure();
  const payment = useDisclosure();

  return (
    <div className={s.quickActions}>
      <GlobalActions />
      <div className={s.secondaryRow}>
        <Button variant="secondary" size="sm" iconLeft="plus" onClick={lead.open}>
          Add Lead
        </Button>
        <Button variant="secondary" size="sm" iconLeft="plus" onClick={task.open}>
          Add Task
        </Button>
        <Button variant="secondary" size="sm" iconLeft="plus" onClick={payment.open}>
          Record Payment
        </Button>
      </div>

      <LeadFormModal open={lead.isOpen} onClose={lead.close} />
      <TaskFormModal open={task.isOpen} onClose={task.close} />
      <RecordPaymentModal open={payment.isOpen} onClose={payment.close} />
    </div>
  );
}
