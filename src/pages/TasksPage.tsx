import { PlaceholderModule } from "./PlaceholderModule";
import { StubActionButton } from "@/components/ui/StubActionButton";

export function TasksPage() {
  return (
    <PlaceholderModule
      title="Tasks"
      icon="tasks"
      description="What needs doing — grouped by today, upcoming, overdue and completed."
      actions={<StubActionButton iconLeft="plus">Add Task</StubActionButton>}
      planned={[
        "Buckets: Today, Upcoming, Overdue, Completed",
        "Priority: Low, Medium, High, Urgent",
        "Status: To Do, In Progress, Review, Completed",
        "Link tasks to a project or client",
        "Quick add with a due date",
      ]}
    />
  );
}
