import { GlobalActions } from "@/components/shell/GlobalActions";
import { StubActionButton } from "@/components/ui/StubActionButton";
import s from "./sections.module.css";

/**
 * Fast access to the common actions. "Start New Project" reuses the global
 * action (Prompt 03); the rest open the shared modal system in later prompts.
 */
export function QuickActions() {
  return (
    <div className={s.quickActions}>
      <GlobalActions />
      <div className={s.secondaryRow}>
        <StubActionButton variant="secondary" size="sm" iconLeft="plus">
          Add Lead
        </StubActionButton>
        <StubActionButton variant="secondary" size="sm" iconLeft="plus">
          Add Task
        </StubActionButton>
        <StubActionButton variant="secondary" size="sm" iconLeft="plus">
          Record Payment
        </StubActionButton>
      </div>
    </div>
  );
}
