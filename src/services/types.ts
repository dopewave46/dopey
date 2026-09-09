/**
 * Domain models for DopeOrca OS.
 *
 * These mirror the locked Master Product Specification (Prompt 01, §G).
 * They exist so later modules (CRM, Leads, Projects, Finance, …) and a real
 * backend can share one contract. The shell does not implement business logic
 * against them yet.
 */

export type ID = string;
export type ISODateString = string;

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export type LeadStage =
  | "new"
  | "contacted"
  | "interested"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ClientStatus = "active" | "inactive" | "prospect" | "archived";

export type ProjectStatus =
  | "planning"
  | "ui_ux"
  | "development"
  | "testing"
  | "client_review"
  | "revision"
  | "ready_for_launch"
  | "live"
  | "completed"
  | "on_hold";

export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled";

export type PaymentMethod = "bank_transfer" | "upi" | "card" | "cash" | "other";
export type PaymentStatus = "completed" | "pending";

export type ExpenseCategory =
  | "hosting"
  | "domain"
  | "software"
  | "advertising"
  | "equipment"
  | "operations"
  | "other";

export type AmcPaymentStatus = "paid" | "due" | "overdue";

/** Contract status — derived server-side from renewal date (Prompt 08 §4). */
export type AmcStatus = "active" | "expiring_soon" | "expired";

export type ActivityEntity =
  | "lead"
  | "client"
  | "project"
  | "task"
  | "invoice"
  | "payment"
  | "amc";

export type NotificationType =
  | "follow_up_due"
  | "task_overdue"
  | "invoice_overdue"
  | "amc_renewal"
  | "project_deadline"
  | "payment_received"
  | "new_lead"
  | "client_update";

/* ------------------------------------------------------------------ */
/* Entities                                                           */
/* ------------------------------------------------------------------ */

export interface Timestamped {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  role: "admin";
  avatarUrl?: string;
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
  state: "not_started" | "in_progress" | "done";
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
  status: InvoiceStatus;
  paidDate?: ISODateString;
  notes?: string;
  /** Server-derived (Prompt 09 invoice.service) — present on API responses. */
  displayStatus?: InvoiceStatus;
  /** Server-derived outstanding balance — present on API responses. */
  balance?: number;
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
  /** Server-derived (Prompt 09 amc.service) — present on API responses. */
  status?: AmcStatus;
  /** Server-derived days until renewal — present on API responses. */
  daysToRenewal?: number;
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
  parentType: "lead" | "client";
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

export interface AppNotification {
  id: ID;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: ActivityEntity;
  entityId?: ID;
  isRead: boolean;
  createdAt: ISODateString;
}

export interface AgencySettings {
  agencyName: string;
  location: string;
  timezone: string;
  currency: "INR";
  admin: User;
}
