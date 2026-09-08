import type {
  Activity,
  Amc,
  AmcTask,
  Client,
  Expense,
  FollowUp,
  Invoice,
  Lead,
  Payment,
  Project,
  ProjectStage,
  ProjectStatus,
  Task,
} from "../types/entities.js";

/**
 * Demo seed data — mirrors the frontend's mock dataset (same ids: client-01…,
 * proj-01…, lead-01…) so Prompt 11 connects with no surprises. Deterministic,
 * relative to "now". This is not production data; a real deployment starts
 * empty and the admin builds it up.
 */

const now = Date.now();
const D = 86_400_000;
const iso = (offsetDays: number) => new Date(now + offsetDays * D).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

/* ---------------- Project stage helper ---------------- */

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

function stagesFor(projectId: string, status: ProjectStatus): ProjectStage[] {
  const idx = STAGE_FLOW.indexOf(status);
  return STAGE_FLOW.map((stage, order) => {
    let state: ProjectStage["state"] = "not_started";
    if (status === "completed" || (idx >= 0 && order < idx)) state = "done";
    else if (idx >= 0 && order === idx) state = "in_progress";
    return {
      id: `${projectId}-stg-${order}`,
      projectId,
      stageName: STAGE_LABEL[stage],
      state,
      completionPercent: state === "done" ? 100 : state === "in_progress" ? 40 : 0,
      order,
    };
  });
}

export function progressFromStages(stages: ProjectStage[]): number {
  if (!stages.length) return 0;
  const score = stages.reduce(
    (s, st) => s + (st.state === "done" ? 1 : st.state === "in_progress" ? 0.5 : 0),
    0,
  );
  return Math.round((score / stages.length) * 100);
}

/* ---------------- Seed builder ---------------- */

export function buildSeed() {
  const leads: Lead[] = [
    lead("lead-01", "Raj Malhotra", "ABC Tuition Classes", "interested", 45000, {
      phone: "+91 98200 41122",
      email: "raj@abctuition.in",
      location: "Andheri, Mumbai",
      source: "Referral",
      serviceRequired: "Business website",
      followUpDate: iso(1),
      createdAt: iso(-9),
    }),
    lead("lead-02", "Sana Kapadia", "Kapadia Interiors", "proposal", 120000, {
      phone: "+91 99303 55810",
      email: "hello@kapadiainteriors.com",
      source: "Instagram",
      serviceRequired: "Branding + website",
      followUpDate: iso(0),
      createdAt: iso(-14),
    }),
    lead("lead-03", "Vivek Nair", "Highfield Realty", "negotiation", 340000, {
      phone: "+91 98670 20114",
      source: "Networking event",
      serviceRequired: "Web app",
      followUpDate: iso(2),
      createdAt: iso(-21),
    }),
    lead("lead-04", "Farhan Shaikh", "Shaikh Motors", "new", 18000, {
      phone: "+91 90040 71265",
      source: "WhatsApp",
      serviceRequired: "Landing page",
      followUpDate: iso(0),
      createdAt: hoursAgo(14),
    }),
    lead("lead-05", "Deepa Menon", "The Salt Table", "contacted", 95000, {
      phone: "+91 98195 33027",
      source: "Referral",
      serviceRequired: "E-commerce store",
      followUpDate: iso(3),
      createdAt: iso(-4),
    }),
    lead("lead-06", "Arjun Rao", "Rao & Associates", "lost", 60000, {
      source: "Cold outreach",
      serviceRequired: "Website redesign",
      createdAt: iso(-30),
    }),
    lead("lead-07", "Nikita Sharma", "Bloom Dental", "new", 55000, {
      email: "front.desk@bloomdental.in",
      source: "Website enquiry",
      serviceRequired: "Business website",
      followUpDate: iso(1),
      createdAt: hoursAgo(5),
    }),
    lead("lead-08", "Meera Kadam", "Kadam & Co.", "won", 65000, {
      email: "meera@kadamandco.in",
      source: "Referral",
      serviceRequired: "Landing page",
      convertedClientId: "client-03",
      createdAt: iso(-44),
    }),
  ];

  const clients: Client[] = [
    client("client-01", "Ananya Rao", "Blue Fig Studio", {
      phone: "+91 98201 77450",
      email: "ananya@bluefigstudio.com",
      location: "Versova, Mumbai",
      website: "bluefigstudio.com",
      createdAt: iso(-120),
    }),
    client("client-02", "Imran Qureshi", "Sea Salt Cafe", {
      phone: "+91 99872 30061",
      email: "imran@seasaltcafe.in",
      location: "Juhu, Mumbai",
      website: "seasaltcafe.in",
      createdAt: iso(-64),
    }),
    client("client-03", "Meera Kadam", "Kadam & Co.", {
      phone: "+91 98330 55219",
      email: "meera@kadamandco.in",
      location: "Dadar, Mumbai",
      website: "kadamandco.in",
      sourceLeadId: "lead-08",
      createdAt: iso(-38),
    }),
    client("client-04", "Sunil Bhatia", "Bhatia Textiles", {
      phone: "+91 98195 66302",
      email: "sunil@bhatiatextiles.com",
      location: "Bhiwandi",
      website: "bhatiatextiles.com",
      status: "inactive",
      createdAt: iso(-300),
    }),
  ];

  const projectSeeds: Array<[string, string, string, ProjectStatus, number, number | undefined, number]> = [
    // id, clientId, name, status, value, deadlineOffset, startOffset
    ["proj-01", "client-01", "Blue Fig Studio — Brand website", "development", 185000, 9, -24],
    ["proj-02", "client-02", "Sea Salt Cafe — Website + booking", "client_review", 120000, 3, -40],
    ["proj-03", "client-03", "Kadam & Co. — Landing page refresh", "ready_for_launch", 65000, 1, -18],
    ["proj-04", "client-04", "Bhatia Textiles — Catalogue site", "completed", 240000, -250, -320],
    ["proj-05", "client-01", "Blue Fig Studio — Journal microsite", "on_hold", 40000, 30, -10],
    ["proj-06", "client-02", "Sea Salt Cafe — Menu QR pages", "planning", 22000, 20, -3],
  ];

  const projectStages: ProjectStage[] = [];
  const projects: Project[] = projectSeeds.map(([id, clientId, name, status, value, dl, start]) => {
    const st = stagesFor(id, status);
    projectStages.push(...st);
    return {
      id,
      clientId,
      name,
      value,
      status,
      startDate: iso(start),
      deadline: dl === undefined ? undefined : iso(dl),
      progressPercent: progressFromStages(st),
      createdAt: iso(start),
      updatedAt: iso(-1),
    };
  });

  const tasks: Task[] = [
    task("task-01", "Call 25 prospects", "high", { due: iso(0) }),
    task("task-02", "Follow up with Blue Fig Studio on case-study copy", "high", {
      due: iso(0),
      projectId: "proj-01",
      clientId: "client-01",
    }),
    task("task-03", "Apply homepage revision 2 feedback — Sea Salt Cafe", "urgent", {
      due: iso(0),
      projectId: "proj-02",
      clientId: "client-02",
    }),
    task("task-05", "Get DNS access from Kadam & Co.", "urgent", {
      due: iso(-1),
      projectId: "proj-03",
      clientId: "client-03",
    }),
    task("task-06", "Chase 3 case-study write-ups", "medium", {
      due: iso(-3),
      projectId: "proj-01",
      clientId: "client-01",
    }),
    task("task-07", "Reconcile August expenses", "low", { due: iso(-2) }),
    task("task-08", "Cross-browser QA on the Blue Fig work page", "medium", {
      due: iso(2),
      projectId: "proj-01",
      clientId: "client-01",
    }),
    task("task-09", "Final content pass before launch — Sea Salt Cafe", "high", {
      due: iso(3),
      projectId: "proj-02",
      clientId: "client-02",
    }),
    task("task-14", "Send demo to Highfield Realty", "high", { done: true }),
    task("task-15", "Build case-study CMS collection", "medium", {
      done: true,
      projectId: "proj-01",
      clientId: "client-01",
    }),
    task("task-17", "Invoice Sea Salt Cafe for the balance", "high", {
      done: true,
      projectId: "proj-02",
      clientId: "client-02",
    }),
  ];

  const invoices: Invoice[] = [
    inv("inv-0201", "INV-0201", "client-01", "proj-01", 92500, iso(-20), iso(-6), "paid", iso(-15)),
    inv("inv-0208", "INV-0208", "client-01", "proj-01", 92500, iso(-8), iso(-2), "sent"),
    inv("inv-0210", "INV-0210", "client-02", "proj-02", 60000, iso(-38), iso(-24), "paid", iso(-34)),
    inv("inv-0214", "INV-0214", "client-02", "proj-02", 60000, iso(-3), iso(11), "sent"),
    inv("inv-0218", "INV-0218", "client-03", "proj-03", 65000, iso(-16), iso(-2), "paid", iso(-13)),
    inv("inv-0120", "INV-0120", "client-04", "proj-04", 240000, iso(-300), iso(-286), "paid", iso(-292)),
    inv("inv-0221", "INV-0221", "client-02", "proj-06", 22000, iso(-1), iso(13), "draft"),
  ];

  const payments: Payment[] = [
    pay("pay-0201", "client-01", "proj-01", "inv-0201", 92500, iso(-15), "bank_transfer"),
    pay("pay-0210", "client-02", "proj-02", "inv-0210", 60000, iso(-34), "upi"),
    pay("pay-0214", "client-02", "proj-02", "inv-0214", 30000, iso(-2), "upi"),
    pay("pay-0218", "client-03", "proj-03", "inv-0218", 65000, iso(-13), "upi"),
    pay("pay-0120", "client-04", "proj-04", "inv-0120", 240000, iso(-292), "bank_transfer"),
  ];

  const expenses: Expense[] = [
    exp("exp-01", "Vercel Pro", "hosting", 1700, iso(-4)),
    exp("exp-02", "Figma", "software", 1200, iso(-6)),
    exp("exp-03", "Domain — seasaltcafe.in renewal", "domain", 900, iso(-9)),
    exp("exp-04", "Instagram ads", "advertising", 6000, iso(-12)),
    exp("exp-05", "Adobe CC", "software", 4230, iso(-18)),
    exp("exp-06", "Coworking desk", "operations", 8000, iso(-22)),
    exp("exp-07", "External SSD 2TB", "equipment", 12500, iso(-34)),
    exp("exp-08", "Google Workspace", "software", 850, iso(-40)),
  ];

  const amcs: Amc[] = [
    amc("amc-01", "client-04", "proj-04", "Website Maintenance", iso(-320), iso(18), "due", iso(40)),
    amc("amc-02", "client-03", "proj-03", "Hosting + SSL", iso(-12), iso(353), "paid", iso(353)),
    amc("amc-03", "client-01", undefined, "Support Retainer", iso(-90), iso(210), "paid", iso(120)),
    amc("amc-04", "client-02", "proj-02", "Website Maintenance", iso(-400), iso(-10), "overdue", iso(-10)),
  ];

  const amcTasks: AmcTask[] = [
    { id: "amct-01", amcId: "amc-01", title: "Monthly plugin + security updates", status: "done", dueDate: iso(-4) },
    { id: "amct-02", amcId: "amc-01", title: "Quarterly backup verification", status: "todo", dueDate: iso(12) },
    { id: "amct-03", amcId: "amc-01", title: "Renewal reminder call to Sunil", status: "todo", dueDate: iso(8) },
    { id: "amct-04", amcId: "amc-02", title: "Confirm SSL auto-renew is on", status: "done" },
    { id: "amct-05", amcId: "amc-03", title: "September content changes", status: "todo", dueDate: iso(3) },
    { id: "amct-06", amcId: "amc-04", title: "Migrate maintenance to the new site plan", status: "todo" },
  ];

  const followUps: FollowUp[] = [
    fu("fu-01", "lead", "lead-02", iso(0), "Call Sana about the proposal."),
    fu("fu-02", "lead", "lead-04", iso(0), "Send Shaikh Motors a rough quote."),
    fu("fu-03", "lead", "lead-01", iso(1), "Follow up with ABC Tuition on the revised estimate."),
    fu("fu-04", "lead", "lead-03", iso(2), "Highfield Realty — confirm phase 1 scope in writing."),
    fu("fu-05", "lead", "lead-05", iso(-1), "The Salt Table — chase the voicemail."),
    fu("fu-06", "client", "client-04", iso(-3), "Bhatia Textiles — AMC renewal conversation."),
    fu("fu-07", "client", "client-02", iso(4), "Sea Salt Cafe — review homepage revisions."),
  ];

  const activities: Activity[] = [
    act("act-01", "lead_created", "lead", "lead-07", "Lead added — Bloom Dental (Website enquiry)", hoursAgo(5)),
    act("act-02", "stage_changed", "lead", "lead-03", "Highfield Realty moved to Negotiation", hoursAgo(30)),
    act("act-03", "lead_converted", "client", "client-03", "Lead converted — Kadam & Co. is now a client", iso(-38)),
    act("act-04", "payment_received", "payment", "pay-0214", "Payment recorded — Sea Salt Cafe (₹30,000)", hoursAgo(48)),
    act("act-05", "status_changed", "project", "proj-02", "Sea Salt Cafe — Website + booking moved to Client Review", hoursAgo(20)),
  ];

  return {
    leads,
    clients,
    projects,
    projectStages,
    tasks,
    invoices,
    payments,
    expenses,
    amcs,
    amcTasks,
    followUps,
    activities,
  };
}

/* ---------------- tiny builders ---------------- */

function lead(id: string, name: string, business: string, stage: Lead["stage"], estimatedValue: number, extra: Partial<Lead>): Lead {
  return {
    id,
    name,
    business,
    stage,
    estimatedValue,
    createdAt: iso(-10),
    updatedAt: iso(-1),
    ...extra,
  };
}

function client(id: string, name: string, company: string, extra: Partial<Client>): Client {
  return { id, name, company, status: "active", createdAt: iso(-60), updatedAt: iso(-5), ...extra };
}

function task(id: string, title: string, priority: Task["priority"], extra: { due?: string; done?: boolean; projectId?: string; clientId?: string }): Task {
  return {
    id,
    title,
    priority,
    status: extra.done ? "completed" : "todo",
    dueDate: extra.due,
    projectId: extra.projectId,
    clientId: extra.clientId,
    completedAt: extra.done ? iso(-1) : undefined,
    createdAt: iso(-14),
    updatedAt: iso(-2),
  };
}

function inv(
  id: string,
  invoiceNumber: string,
  clientId: string,
  projectId: string,
  amount: number,
  issueDate: string,
  dueDate: string,
  status: Invoice["status"],
  paidDate?: string,
): Invoice {
  return { id, invoiceNumber, clientId, projectId, amount, issueDate, dueDate, status, paidDate, createdAt: issueDate, updatedAt: paidDate ?? issueDate };
}

function pay(
  id: string,
  clientId: string,
  projectId: string,
  invoiceId: string,
  amount: number,
  paymentDate: string,
  method: Payment["method"],
): Payment {
  return { id, clientId, projectId, invoiceId, amount, paymentDate, method, status: "completed", createdAt: paymentDate, updatedAt: paymentDate };
}

function exp(id: string, name: string, category: Expense["category"], amount: number, date: string): Expense {
  return { id, name, category, amount, date, createdAt: date, updatedAt: date };
}

function amc(
  id: string,
  clientId: string,
  projectId: string | undefined,
  service: string,
  startDate: string,
  renewalDate: string,
  paymentStatus: Amc["paymentStatus"],
  hostingRenewalDate?: string,
): Amc {
  return { id, clientId, projectId, service, startDate, renewalDate, paymentStatus, hostingRenewalDate, createdAt: startDate, updatedAt: iso(-20) };
}

function fu(id: string, parentType: FollowUp["parentType"], parentId: string, dueDate: string, note: string): FollowUp {
  return { id, parentType, parentId, dueDate, note, status: "pending" };
}

function act(id: string, type: string, entityType: Activity["entityType"], entityId: string, summary: string, createdAt: string): Activity {
  return { id, type, entityType, entityId, summary, createdAt };
}
