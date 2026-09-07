import { PlaceholderModule } from "./PlaceholderModule";
import { GlobalActions } from "@/components/shell/GlobalActions";

export function ProjectsPage() {
  return (
    <PlaceholderModule
      title="Projects"
      icon="projects"
      description="Every client engagement — status, progress, deadlines, links and money."
      actions={<GlobalActions />}
      planned={[
        "Project list and board by status",
        "Stage progress: Planning → UI/UX → Development → Testing → Client Review → Live",
        "Tasks, timeline, requirements and notes per project",
        "Repository, staging and live URLs",
        "Linked invoices and payments",
      ]}
    />
  );
}
