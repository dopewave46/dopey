import type { Amc, AmcTask } from "@/services/types";

/**
 * ---------------------------------------------------------------------------
 * Sample Maintenance / AMC content — contracts + their task checklists.
 *
 * Shaped exactly like the Amc / AmcTask entities in the locked spec
 * (Section G). Loaded into `amcStore`. Client ids match `sampleCrm.ts`,
 * project ids `sampleProjects.ts`. AMC status (Active / Expiring Soon /
 * Expired) is DERIVED from renewalDate — never stored.
 * ---------------------------------------------------------------------------
 */

const now = Date.now();
const day = 86_400_000;
const at = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();

export const AMC_SERVICES = [
  "Website Maintenance",
  "Hosting + SSL",
  "Support Retainer",
  "Security & Backups",
  "Content Updates",
] as const;

export const SAMPLE_AMCS: Amc[] = [
  {
    id: "amc-01",
    clientId: "client-04",
    projectId: "proj-04",
    service: "Website Maintenance",
    startDate: at(-320),
    renewalDate: at(18), // expiring soon
    paymentStatus: "due",
    hostingRenewalDate: at(40),
    notes: "Annual plan. Includes monthly updates and one small content change per month.",
    createdAt: at(-320),
    updatedAt: at(-30),
  },
  {
    id: "amc-02",
    clientId: "client-03",
    projectId: "proj-03",
    service: "Hosting + SSL",
    startDate: at(-12),
    renewalDate: at(353),
    paymentStatus: "paid",
    hostingRenewalDate: at(353),
    notes: "Rolled in with the landing page project. Vercel Pro + domain.",
    createdAt: at(-12),
    updatedAt: at(-12),
  },
  {
    id: "amc-03",
    clientId: "client-01",
    projectId: undefined,
    service: "Support Retainer",
    startDate: at(-90),
    renewalDate: at(210),
    paymentStatus: "paid",
    hostingRenewalDate: at(120),
    notes: "5 hours/month of ad-hoc changes and support for Blue Fig Studio.",
    createdAt: at(-90),
    updatedAt: at(-20),
  },
  {
    id: "amc-04",
    clientId: "client-02",
    projectId: "proj-02",
    service: "Website Maintenance",
    startDate: at(-400),
    renewalDate: at(-10), // expired
    paymentStatus: "overdue",
    hostingRenewalDate: at(-10),
    notes: "Old plan from the previous site. Needs a renewal conversation with the new build.",
    createdAt: at(-400),
    updatedAt: at(-40),
  },
];

export const SAMPLE_AMC_TASKS: AmcTask[] = [
  { id: "amct-01", amcId: "amc-01", title: "Monthly plugin + security updates", status: "done", dueDate: at(-4) },
  { id: "amct-02", amcId: "amc-01", title: "Quarterly backup verification", status: "todo", dueDate: at(12) },
  { id: "amct-03", amcId: "amc-01", title: "Renewal reminder call to Sunil", status: "todo", dueDate: at(8) },
  { id: "amct-04", amcId: "amc-02", title: "Confirm SSL auto-renew is on", status: "done" },
  { id: "amct-05", amcId: "amc-03", title: "September content changes — homepage stats", status: "todo", dueDate: at(3) },
  { id: "amct-06", amcId: "amc-04", title: "Migrate maintenance to the new site plan", status: "todo" },
];
