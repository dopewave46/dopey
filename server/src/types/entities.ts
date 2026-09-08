/**
 * Domain entities for DopeOrca OS — mirror the locked Master Product
 * Specification (Section G) and the frontend `src/services/types.ts` field for
 * field. The stub repositories and, from Prompt 10, the database both produce
 * these shapes. Backend-only additions (password hash, session) are marked.
 */

export type ID = string;
export type ISODateString = string;

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const LEAD_STAGES = [
  "new",
  "contacted",
  "interested",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const CLIENT_STATUSES = ["active", "inactive", "prospect", "archived"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PROJECT_STATUSES = [
  "planning",
  "ui_ux",
  "development",
  "testing",
  "client_review",
  "revision",
  "ready_for_launch",
  "live",
  "completed",
  "on_hold",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STAGE_STATES = ["not_started", "in_progress", "done"] as const;
export type ProjectStageState = (typeof PROJECT_STAGE_STATES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "review", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Stored invoice status. "overdue" and "pending" are DERIVED, never stored. */
export const INVOICE_STATUSES_STORED = ["draft", "sent", "paid", "cancelled"] as const;
export type InvoiceStatusStored = (typeof INVOICE_STATUSES_STORED)[number];
export const INVOICE_STATUSES_DISPLAY = [
  "draft",
  "sent",
  "pending",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type InvoiceStatusDisplay = (typeof INVOICE_STATUSES_DISPLAY)[number];

export const PAYMENT_METHODS = ["bank_transfer", "upi", "card", "cash", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["completed", "pending"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const EXPENSE_CATEGORIES = [
  "hosting",
  "domain",
  "software",
  "advertising",
  "equipment",
  "operations",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const AMC_PAYMENT_STATUSES = ["paid", "due", "overdue"] as const;
export type AmcPaymentStatus = (typeof AMC_PAYMENT_STATUSES)[number];
/** Derived from renewal_date vs today — never manually set (Prompt 08 §4). */
export type AmcStatus = "active" | "expiring_soon" | "expired";

export const FOLLOW_UP_PARENTS = ["lead", "client"] as const;
export type FollowUpParent = (typeof FOLLOW_UP_PARENTS)[number];

export const ACTIVITY_ENTITIES = [
  "lead",
  "client",
  "project",
  "task",
  "invoice",
  "payment",
  "amc",
] as const;
export type ActivityEntity = (typeof ACTIVITY_ENTITIES)[number];

export const NOTIFICATION_TYPES = [
  "follow_up_due",
  "task_overdue",
  "invoice_overdue",
  "amc_renewal",
  "project_deadline",
  "payment_received",
  "new_lead",
  "client_update",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/* ------------------------------------------------------------------ */
/* Entities                                                           */
/* ------------------------------------------------------------------ */

export interface Timestamped {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface User extends Timestamped {
  id: ID;
  name: string;
  email: string;
  role: "admin";
  avatarUrl?: string;
  /** backend-only */
  passwordHash: string;
}

/** Never leaves the server. */
export interface Session {
  id: ID;
  userId: ID;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  userAgent?: string;
  ip?: string;
}

export interface Lead extends Timestamped {
  id: ID;
  name: string;
  business?: string;
  phone?: string;
  email?: string;
  location?: string;
  source?: string;
  serviceRequired?: string;
  requirements?: string;
  estimatedValue?: number;
  stage: LeadStage;
  followUpDate?: ISODateString;
  notes?: string;
  convertedClientId?: ID;
  archivedAt?: ISODateString;
}

export interface Client extends Timestamped {
  id: ID;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  location?: string;
  website?: string;
  status: ClientStatus;
  sourceLeadId?: ID;
  notes?: string;
}

export interface Project extends Timestamped {
  id: ID;
  clientId: ID;
  name: string;
  value: number;
  startDate?: ISODateString;
  deadline?: ISODateString;
  status: ProjectStatus;
  progressPercent: number;
  requirements?: string;
  notes?: string;
  repoUrl?: string;
  stagingUrl?: string;
  liveUrl?: string;
}

export interface ProjectStage {
  id: ID;
  projectId: ID;
  stageName: string;
  state: ProjectStageState;
  completionPercent: number;
  order: number;
}

export interface Task extends Timestamped {
  id: ID;
  title: string;
  description?: string;
  projectId?: ID;
  clientId?: ID;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: ISODateString;
  notes?: string;
  completedAt?: ISODateString;
}

export interface Invoice extends Timestamped {
  id: ID;
  invoiceNumber: string;
  clientId: ID;
  projectId?: ID;
  amount: number;
  issueDate: ISODateString;
  dueDate: ISODateString;
  status: InvoiceStatusStored;
  paidDate?: ISODateString;
  notes?: string;
}

export interface Payment extends Timestamped {
  id: ID;
  clientId: ID;
  projectId?: ID;
  invoiceId?: ID;
  amount: number;
  paymentDate: ISODateString;
  method: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
}

export interface Expense extends Timestamped {
  id: ID;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: ISODateString;
  notes?: string;
}

export interface Amc extends Timestamped {
  id: ID;
  clientId: ID;
  projectId?: ID;
  service: string;
  startDate: ISODateString;
  renewalDate: ISODateString;
  paymentStatus: AmcPaymentStatus;
  hostingRenewalDate?: ISODateString;
  notes?: string;
}

export interface AmcTask {
  id: ID;
  amcId: ID;
  title: string;
  status: "todo" | "done";
  dueDate?: ISODateString;
}

export interface FollowUp {
  id: ID;
  parentType: FollowUpParent;
  parentId: ID;
  dueDate: ISODateString;
  note: string;
  status: "pending" | "done";
  completedAt?: ISODateString;
}

export interface Activity {
  id: ID;
  type: string;
  entityType: ActivityEntity;
  entityId: ID;
  summary: string;
  createdAt: ISODateString;
}

export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: ActivityEntity;
  entityId?: ID;
  isRead: boolean;
  /** de-dup key: `${type}:${entityId}:${YYYY-MM-DD}` (Prompt 09 §7) */
  dedupeKey?: string;
  createdAt: ISODateString;
}

/** Single-row-per-key store (spec Section G — Setting). */
export interface Setting {
  key: string;
  value: unknown;
  updatedAt: ISODateString;
}

/** Convenience view of the settings store the frontend consumes. */
export interface AgencySettings {
  agencyName: string;
  location: string;
  timezone: string;
  currency: "INR";
  dateFormat: string;
  renewalLeadDays: number;
  deadlineLeadDays: number;
  notificationPreferences: Record<NotificationType, boolean>;
  admin: Pick<User, "id" | "name" | "email" | "role" | "avatarUrl">;
}
