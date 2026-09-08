import type { Activity, Project, ProjectStage, ProjectStatus, Task } from "@/services/types";

/**
 * ---------------------------------------------------------------------------
 * Sample Projects content — projects, stage checklists, linked tasks, activity.
 *
 * Shaped exactly like the Project / ProjectStage / Task entities in the locked
 * spec (Section G). Loaded once into `projectStore`; a later prompt swaps the
 * seed for a real fetch. Client ids match `sampleCrm.ts`.
 * ---------------------------------------------------------------------------
 */

const now = Date.now();
const days = (n: number) => new Date(now + n * 86_400_000).toISOString();

const STAGE_FLOW: ProjectStatus[] = [
  "planning",
  "ui_ux",
  "development",
  "testing",
  "client_review",
  "revision",
  "ready_for_launch",
  "live",
  "completed",
];
const STAGE_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  ui_ux: "UI/UX",
  development: "Development",
  testing: "Testing",
  client_review: "Client Review",
  revision: "Revision",
  ready_for_launch: "Ready for Launch",
  live: "Live",
  completed: "Completed",
  on_hold: "On Hold",
};

function seedStages(projectId: string, status: ProjectStatus): ProjectStage[] {
  const idx = STAGE_FLOW.indexOf(status);
  return STAGE_FLOW.map((stage, order) => {
    let s: ProjectStage["state"] = "not_started";
    if (status === "completed" || (idx >= 0 && order < idx)) s = "done";
    else if (idx >= 0 && order === idx) s = "in_progress";
    return {
      id: `${projectId}-stg-${order}`,
      projectId,
      stageName: STAGE_LABEL[stage],
      state: s,
      completionPercent: s === "done" ? 100 : s === "in_progress" ? 40 : 0,
      order,
    };
  });
}

function progress(stages: ProjectStage[]): number {
  const score = stages.reduce(
    (sum, s) => sum + (s.state === "done" ? 1 : s.state === "in_progress" ? 0.5 : 0),
    0,
  );
  return Math.round((score / stages.length) * 100);
}

interface Seed {
  id: string;
  clientId: string;
  name: string;
  value: number;
  startDate?: string;
  deadline?: string;
  status: ProjectStatus;
  requirements?: string;
  notes?: string;
  repoUrl?: string;
  stagingUrl?: string;
  liveUrl?: string;
}

const SEEDS: Seed[] = [
  {
    id: "proj-01",
    clientId: "client-01",
    name: "Blue Fig Studio — Brand website",
    value: 185000,
    startDate: days(-24),
    deadline: days(9),
    status: "development",
    requirements: "Portfolio-led marketing site: 6 pages, case-study CMS, contact + Calendly embed.",
    notes: "Homepage hero approved. Waiting on 3 case-study write-ups from the client.",
    repoUrl: "github.com/dopeorca/bluefig-web",
    stagingUrl: "staging.bluefigstudio.com",
  },
  {
    id: "proj-02",
    clientId: "client-02",
    name: "Sea Salt Cafe — Website + booking",
    value: 120000,
    startDate: days(-40),
    deadline: days(3),
    status: "client_review",
    requirements: "Marketing site + table-booking flow, events calendar, gallery, newsletter signup.",
    notes: "Sent revision 2 for homepage. Booking flow signed off.",
    repoUrl: "github.com/dopeorca/seasalt-web",
    stagingUrl: "staging.seasaltcafe.in",
  },
  {
    id: "proj-03",
    clientId: "client-03",
    name: "Kadam & Co. — Landing page refresh",
    value: 65000,
    startDate: days(-18),
    deadline: days(1),
    status: "ready_for_launch",
    requirements: "Single landing page: new copy, practice-areas section, enquiry form.",
    notes: "Client approved final. Awaiting DNS access to point the domain.",
    repoUrl: "github.com/dopeorca/kadam-landing",
    stagingUrl: "kadam-landing.vercel.app",
  },
  {
    id: "proj-04",
    clientId: "client-04",
    name: "Bhatia Textiles — Catalogue site",
    value: 240000,
    startDate: days(-320),
    deadline: days(-250),
    status: "completed",
    requirements: "Product catalogue with 400+ SKUs, enquiry cart, dealer login.",
    notes: "Delivered last year. Due for an AMC conversation.",
    repoUrl: "github.com/dopeorca/bhatia-catalogue",
    liveUrl: "bhatiatextiles.com",
  },
  {
    id: "proj-05",
    clientId: "client-01",
    name: "Blue Fig Studio — Journal microsite",
    value: 40000,
    startDate: days(-10),
    deadline: days(30),
    status: "on_hold",
    requirements: "Standalone blog/journal on a subdomain, MDX content, RSS.",
    notes: "Paused until the main site ships.",
  },
  {
    id: "proj-06",
    clientId: "client-02",
    name: "Sea Salt Cafe — Menu QR pages",
    value: 22000,
    startDate: days(-3),
    deadline: days(20),
    status: "planning",
    requirements: "Lightweight mobile menu pages behind table QR codes, editable by staff.",
  },
];

export const SAMPLE_PROJECTS: Project[] = SEEDS.map((seed) => {
  const stages = seedStages(seed.id, seed.status);
  return {
    id: seed.id,
    clientId: seed.clientId,
    name: seed.name,
    value: seed.value,
    startDate: seed.startDate,
    deadline: seed.deadline,
    status: seed.status,
    progressPercent: progress(stages),
    requirements: seed.requirements,
    notes: seed.notes,
    repoUrl: seed.repoUrl,
    stagingUrl: seed.stagingUrl,
    liveUrl: seed.liveUrl,
    createdAt: seed.startDate ?? days(-30),
    updatedAt: days(-1),
  };
});

export const SAMPLE_PROJECT_STAGES: ProjectStage[] = SEEDS.flatMap((seed) =>
  seedStages(seed.id, seed.status),
);

const task = (
  id: string,
  projectId: string,
  title: string,
  done: boolean,
  dueOffset?: number,
): Task => ({
  id,
  title,
  projectId,
  priority: "medium",
  status: done ? "completed" : "todo",
  dueDate: dueOffset !== undefined ? days(dueOffset) : undefined,
  completedAt: done ? days(-2) : undefined,
  createdAt: days(-15),
  updatedAt: days(-2),
});

export const SAMPLE_PROJECT_TASKS: Task[] = [
  task("ptask-01", "proj-01", "Build case-study CMS collection", true, -3),
  task("ptask-02", "proj-01", "Wire up Calendly embed on contact page", false, 2),
  task("ptask-03", "proj-01", "Chase client for 3 case-study write-ups", false, 1),
  task("ptask-04", "proj-01", "Cross-browser QA on the work page", false, 6),
  task("ptask-05", "proj-02", "Apply homepage revision 2 feedback", false, 0),
  task("ptask-06", "proj-02", "Final content pass before launch", false, 2),
  task("ptask-07", "proj-03", "Get DNS access from client", false, 0),
  task("ptask-08", "proj-03", "Set up redirects from old URLs", true, -1),
  task("ptask-09", "proj-06", "Draft the menu data model with staff", false, 5),
];

export const SAMPLE_PROJECT_ACTIVITIES: Activity[] = [
  {
    id: "pact-01",
    type: "status_changed",
    entityType: "project",
    entityId: "proj-02",
    summary: "Sea Salt Cafe — Website + booking moved to Client Review",
    createdAt: new Date(now - 20 * 3_600_000).toISOString(),
  },
  {
    id: "pact-02",
    type: "payment_received",
    entityType: "project",
    entityId: "proj-01",
    summary: "Payment recorded — Blue Fig Studio — Brand website (₹90,000)",
    createdAt: new Date(now - 2 * 86_400_000).toISOString(),
  },
  {
    id: "pact-03",
    type: "status_changed",
    entityType: "project",
    entityId: "proj-03",
    summary: "Kadam & Co. — Landing page refresh moved to Ready for Launch",
    createdAt: new Date(now - 3 * 86_400_000).toISOString(),
  },
  {
    id: "pact-04",
    type: "project_created",
    entityType: "project",
    entityId: "proj-06",
    summary: "Project created — Sea Salt Cafe — Menu QR pages",
    createdAt: new Date(now - 3 * 86_400_000).toISOString(),
  },
];

