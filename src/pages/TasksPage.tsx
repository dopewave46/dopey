import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useCrm } from "@/hooks/useCrm";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import {
  bucketCounts,
  completedThisWeek,
  groupTasks,
  tasksInBucket,
  type TaskBucket,
  type TaskGrouping,
} from "@/services/taskSelectors";
import type { Task } from "@/services/types";
import styles from "./TasksPage.module.css";

const BUCKETS: { value: TaskBucket; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

export function TasksPage() {
  const loading = useSimulatedLoad();
  const { tasks, store } = useTasks();
  const { projects } = useProjects();
  const { clients } = useCrm();

  const [bucket, setBucket] = useState<TaskBucket>("today");
  const [grouping, setGrouping] = useState<TaskGrouping>("none");
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const addModal = useDisclosure();

  const counts = useMemo(() => bucketCounts(tasks), [tasks]);
  const doneThisWeek = useMemo(() => completedThisWeek(tasks), [tasks]);

  const projectName = (pid?: string) => projects.find((p) => p.id === pid)?.name ?? "Project";
  const clientName = (cid?: string) =>
    clients.find((c) => c.id === cid)?.company || clients.find((c) => c.id === cid)?.name;

  const bucketTasks = useMemo(() => tasksInBucket(tasks, bucket), [tasks, bucket]);
  const groups = useMemo(
    () => groupTasks(bucketTasks, grouping, projectName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucketTasks, grouping, projects],
  );

  return (
    <>
      <PageHeader
        title="Tasks"
        description="What needs doing — today, upcoming, overdue and done."
        actions={
          <Button iconLeft="plus" onClick={addModal.open}>
            Add Task
          </Button>
        }
      />

      <section className={styles.statRow} aria-label="Task summary">
        <StatCard label="Today's Tasks" value={counts.today} icon="calendar" loading={loading} />
        <StatCard
          label="Overdue"
          value={counts.overdue}
          icon="alert-triangle"
          tone={counts.overdue > 0 ? "error" : "default"}
          loading={loading}
        />
        <StatCard label="Completed This Week" value={doneThisWeek} icon="check" loading={loading} />
        <StatCard label="Upcoming" value={counts.upcoming} icon="tasks" loading={loading} />
      </section>

      <div className={styles.controls}>
        <Tabs
          tabs={BUCKETS.map((b) => ({ ...b, count: counts[b.value] }))}
          value={bucket}
          onChange={(v) => setBucket(v as TaskBucket)}
          aria-label="Task bucket"
        />
        <InlineSelect
          label="Group by"
          value={grouping === "none" ? "" : grouping}
          onChange={(v) => setGrouping((v || "none") as TaskGrouping)}
          allLabel="Nothing"
          options={[
            { value: "project", label: "Project" },
            { value: "priority", label: "Priority" },
          ]}
        />
      </div>

      {loading ? (
        <Card>
          <SkeletonText lines={6} />
        </Card>
      ) : bucketTasks.length === 0 ? (
        bucket === "today" ? (
          <EmptyState
            icon="calendar"
            title="Nothing scheduled for today"
            description="Plan your day — add the first task."
            action={
              <Button iconLeft="plus" onClick={addModal.open}>
                Add Task
              </Button>
            }
          />
        ) : (
          <EmptyState compact icon="check" title="Nothing here — you're all caught up." />
        )
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <div key={group.key}>
              {group.label && <h2 className={styles.groupTitle}>{group.label}</h2>}
              <Card padding="none">
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectName={task.projectId ? projectName(task.projectId) : undefined}
                    clientName={clientName(task.clientId)}
                    onToggle={() => store.toggleTask(task.id)}
                    onOpen={() => setOpenTask(task)}
                  />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      <TaskFormModal open={addModal.isOpen} onClose={addModal.close} />
      <TaskDrawer
        task={openTask}
        onClose={() => setOpenTask(null)}
        projectName={openTask?.projectId ? projectName(openTask.projectId) : undefined}
        clientName={clientName(openTask?.clientId)}
      />
    </>
  );
}
