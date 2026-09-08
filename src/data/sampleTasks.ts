import type { Task } from "@/services/types";

/**
 * ---------------------------------------------------------------------------
 * Sample tasks — the single source for the whole app.
 *
 * The /tasks page, the Dashboard "Today's Tasks" card, the Project Detail
 * Tasks tab and the Client Profile Tasks tab all read from `taskStore`, which
 * is seeded from here. Shaped exactly like the Task entity in the locked spec
 * (Section G). Project ids match `sampleProjects.ts`, client ids `sampleCrm.ts`.
 * ---------------------------------------------------------------------------
 */

const now = Date.now();
const day = 86_400_000;
const at = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();

type Priority = Task["priority"];

const task = (
  id: string,
  title: string,
  opts: {
    projectId?: string;
    clientId?: string;
    priority?: Priority;
    due?: number;
    done?: boolean;
    doneAt?: number;
    description?: string;
    notes?: string;
  } = {},
): Task => ({
  id,
  title,
  description: opts.description,
  projectId: opts.projectId,
  clientId: opts.clientId,
  priority: opts.priority ?? "medium",
  status: opts.done ? "completed" : "todo",
  dueDate: opts.due !== undefined ? at(opts.due) : undefined,
  notes: opts.notes,
  completedAt: opts.done ? at(opts.doneAt ?? -1) : undefined,
  createdAt: at(-14),
  updatedAt: at(opts.done ? (opts.doneAt ?? -1) : -2),
});

export const SAMPLE_TASKS: Task[] = [
  // ---- today ----
  task("task-01", "Call 25 prospects", { priority: "high", due: 0, description: "Work through the outreach list — aim for 25 dials before lunch." }),
  task("task-02", "Follow up with Blue Fig Studio on case-study copy", {
    projectId: "proj-01",
    clientId: "client-01",
    priority: "high",
    due: 0,
  }),
  task("task-03", "Apply homepage revision 2 feedback — Sea Salt Cafe", {
    projectId: "proj-02",
    clientId: "client-02",
    priority: "urgent",
    due: 0,
    notes: "Client wants the hero copy tightened and the CTA moved above the fold.",
  }),
  task("task-04", "Send Shaikh Motors a rough quote + 2 reference sites", { clientId: undefined, priority: "medium", due: 0 }),

  // ---- overdue ----
  task("task-05", "Get DNS access from Kadam & Co.", {
    projectId: "proj-03",
    clientId: "client-03",
    priority: "urgent",
    due: -1,
    notes: "Blocking the launch. Chase Meera directly.",
  }),
  task("task-06", "Chase 3 case-study write-ups", { projectId: "proj-01", clientId: "client-01", priority: "medium", due: -3 }),
  task("task-07", "Reconcile August expenses", { priority: "low", due: -2 }),

  // ---- upcoming ----
  task("task-08", "Cross-browser QA on the Blue Fig work page", { projectId: "proj-01", clientId: "client-01", priority: "medium", due: 2 }),
  task("task-09", "Final content pass before launch — Sea Salt Cafe", { projectId: "proj-02", clientId: "client-02", priority: "high", due: 3 }),
  task("task-10", "Draft the menu data model with Sea Salt staff", { projectId: "proj-06", clientId: "client-02", priority: "medium", due: 5 }),
  task("task-11", "Prep the Bhatia Textiles AMC renewal conversation", { clientId: "client-04", priority: "medium", due: 4 }),
  task("task-12", "Write the DopeOrca September update post", { priority: "low", due: 7 }),
  task("task-13", "Review portfolio site analytics", { priority: "low" }), // no due date -> upcoming/backlog

  // ---- completed ----
  task("task-14", "Send demo to Highfield Realty", { clientId: undefined, priority: "high", done: true, doneAt: -1 }),
  task("task-15", "Build case-study CMS collection", { projectId: "proj-01", clientId: "client-01", priority: "medium", done: true, doneAt: -3 }),
  task("task-16", "Set up redirects from old Kadam URLs", { projectId: "proj-03", clientId: "client-03", priority: "medium", done: true, doneAt: -2 }),
  task("task-17", "Invoice Sea Salt Cafe for the balance", { projectId: "proj-02", clientId: "client-02", priority: "high", done: true, doneAt: -4 }),
];
