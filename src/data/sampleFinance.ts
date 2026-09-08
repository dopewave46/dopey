import type { Expense, Invoice, Payment } from "@/services/types";

/**
 * ---------------------------------------------------------------------------
 * Sample Finance content — invoices, payments, expenses.
 *
 * Single source of truth for money across the app: the Finance module, the
 * Dashboard Money section, the Client profile Invoices/Payments tabs and the
 * Project Detail Finance tab all read from `financeStore`, which is seeded
 * from here. Shaped exactly like the Invoice / Payment / Expense entities in
 * the locked spec (Section G). Ids match `sampleProjects.ts` / `sampleCrm.ts`.
 * No tax / GST fields anywhere (spec correction).
 * ---------------------------------------------------------------------------
 */

const now = Date.now();
const day = 86_400_000;
const iso = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();

/** Stored invoice status is one of draft | sent | paid | cancelled. */
export const SAMPLE_INVOICES: Invoice[] = [
  // proj-01 · Blue Fig Studio — Brand website (value ₹1,85,000)
  {
    id: "inv-0201",
    invoiceNumber: "INV-0201",
    clientId: "client-01",
    projectId: "proj-01",
    amount: 92500,
    issueDate: iso(-20),
    dueDate: iso(-6),
    status: "paid",
    paidDate: iso(-15),
    notes: "50% advance.",
    createdAt: iso(-20),
    updatedAt: iso(-15),
  },
  {
    id: "inv-0208",
    invoiceNumber: "INV-0208",
    clientId: "client-01",
    projectId: "proj-01",
    amount: 92500,
    issueDate: iso(-8),
    dueDate: iso(-2),
    status: "sent",
    notes: "Balance on delivery.",
    createdAt: iso(-8),
    updatedAt: iso(-8),
  },
  // proj-02 · Sea Salt Cafe — Website + booking (value ₹1,20,000)
  {
    id: "inv-0210",
    invoiceNumber: "INV-0210",
    clientId: "client-02",
    projectId: "proj-02",
    amount: 60000,
    issueDate: iso(-38),
    dueDate: iso(-24),
    status: "paid",
    paidDate: iso(-34),
    notes: "50% advance.",
    createdAt: iso(-38),
    updatedAt: iso(-34),
  },
  {
    id: "inv-0214",
    invoiceNumber: "INV-0214",
    clientId: "client-02",
    projectId: "proj-02",
    amount: 60000,
    issueDate: iso(-3),
    dueDate: iso(11),
    status: "sent",
    notes: "Balance — due on launch.",
    createdAt: iso(-3),
    updatedAt: iso(-3),
  },
  // proj-03 · Kadam & Co. — Landing page refresh (value ₹65,000)
  {
    id: "inv-0218",
    invoiceNumber: "INV-0218",
    clientId: "client-03",
    projectId: "proj-03",
    amount: 65000,
    issueDate: iso(-16),
    dueDate: iso(-2),
    status: "paid",
    paidDate: iso(-13),
    notes: "Full amount, paid upfront.",
    createdAt: iso(-16),
    updatedAt: iso(-13),
  },
  // proj-04 · Bhatia Textiles — Catalogue site (value ₹2,40,000) — historical
  {
    id: "inv-0120",
    invoiceNumber: "INV-0120",
    clientId: "client-04",
    projectId: "proj-04",
    amount: 240000,
    issueDate: iso(-300),
    dueDate: iso(-286),
    status: "paid",
    paidDate: iso(-292),
    createdAt: iso(-300),
    updatedAt: iso(-292),
  },
  // a draft not yet sent
  {
    id: "inv-0221",
    invoiceNumber: "INV-0221",
    clientId: "client-02",
    projectId: "proj-06",
    amount: 22000,
    issueDate: iso(-1),
    dueDate: iso(13),
    status: "draft",
    notes: "Menu QR pages — advance. Not sent yet.",
    createdAt: iso(-1),
    updatedAt: iso(-1),
  },
];

export const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: "pay-0201",
    clientId: "client-01",
    projectId: "proj-01",
    invoiceId: "inv-0201",
    amount: 92500,
    paymentDate: iso(-15),
    method: "bank_transfer",
    reference: "NEFT ref 4471902",
    status: "completed",
    createdAt: iso(-15),
    updatedAt: iso(-15),
  },
  {
    id: "pay-0210",
    clientId: "client-02",
    projectId: "proj-02",
    invoiceId: "inv-0210",
    amount: 60000,
    paymentDate: iso(-34),
    method: "upi",
    reference: "UPI 802@okhdfc",
    status: "completed",
    createdAt: iso(-34),
    updatedAt: iso(-34),
  },
  {
    id: "pay-0214",
    clientId: "client-02",
    projectId: "proj-02",
    invoiceId: "inv-0214",
    amount: 30000,
    paymentDate: iso(-2),
    method: "upi",
    reference: "UPI seasalt@okaxis",
    status: "completed",
    createdAt: iso(-2),
    updatedAt: iso(-2),
  },
  {
    id: "pay-0218",
    clientId: "client-03",
    projectId: "proj-03",
    invoiceId: "inv-0218",
    amount: 65000,
    paymentDate: iso(-13),
    method: "upi",
    reference: "UPI kadamco@ybl",
    status: "completed",
    createdAt: iso(-13),
    updatedAt: iso(-13),
  },
  {
    id: "pay-0120",
    clientId: "client-04",
    projectId: "proj-04",
    invoiceId: "inv-0120",
    amount: 240000,
    paymentDate: iso(-292),
    method: "bank_transfer",
    status: "completed",
    createdAt: iso(-292),
    updatedAt: iso(-292),
  },
];

const EXP = (
  id: string,
  name: string,
  category: Expense["category"],
  amount: number,
  offsetDays: number,
  notes?: string,
): Expense => ({
  id,
  name,
  category,
  amount,
  date: iso(offsetDays),
  notes,
  createdAt: iso(offsetDays),
  updatedAt: iso(offsetDays),
});

export const SAMPLE_EXPENSES: Expense[] = [
  EXP("exp-01", "Vercel Pro", "hosting", 1700, -4, "Monthly — staging + prod deploys"),
  EXP("exp-02", "Figma", "software", 1200, -6, "Monthly seat"),
  EXP("exp-03", "Domain — seasaltcafe.in renewal", "domain", 900, -9),
  EXP("exp-04", "Instagram ads", "advertising", 6000, -12, "Lead-gen campaign"),
  EXP("exp-05", "Adobe CC", "software", 4230, -18, "Monthly"),
  EXP("exp-06", "DigitalOcean", "hosting", 1100, -20, "Client droplets"),
  EXP("exp-07", "Coworking desk", "operations", 8000, -22, "Monthly"),
  EXP("exp-08", "External SSD 2TB", "equipment", 12500, -34),
  EXP("exp-09", "Vercel Pro", "hosting", 1700, -34),
  EXP("exp-10", "Coworking desk", "operations", 8000, -52),
  EXP("exp-11", "Google Workspace", "software", 850, -40, "Monthly"),
  EXP("exp-12", "Instagram ads", "advertising", 4500, -46),
];

/** Next invoice number after the seed set. */
export const NEXT_INVOICE_SEQ = 222;
