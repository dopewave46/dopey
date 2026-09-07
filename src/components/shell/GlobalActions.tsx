import { Button } from "@/components/ui/Button";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { useDisclosure } from "@/hooks/useDisclosure";

export interface GlobalActionsProps {
  /** Compact = shorter label for tight header space. */
  compact?: boolean;
}

/**
 * The primary action system (Prompt 03 §9). "Start New Project" is the global
 * default and opens the SAME modal used on the Projects page (Prompt 06 §5) —
 * one component, no duplicate form.
 */
export function GlobalActions({ compact = false }: GlobalActionsProps) {
  const modal = useDisclosure();

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
      <NewProjectModal open={modal.isOpen} onClose={modal.close} navigateOnCreate />
    </>
  );
}
