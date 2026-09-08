import { db } from "../repositories/index.js";
import type { Payment, PaymentMethod, PaymentStatus } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { logActivity } from "./activity.service.js";
import { completedPaymentsFor, getInvoice, outstandingBalance } from "./invoice.service.js";
import { onPaymentReceived } from "./notification.service.js";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  upi: "UPI",
  card: "Card",
  cash: "Cash",
  other: "Other",
};

export async function listPayments(filter: { clientId?: string; projectId?: string; method?: PaymentMethod; invoiceId?: string } = {}): Promise<Payment[]> {
  let rows = await db.payments.all();
  if (filter.clientId) rows = rows.filter((p) => p.clientId === filter.clientId);
  if (filter.projectId) rows = rows.filter((p) => p.projectId === filter.projectId);
  if (filter.method) rows = rows.filter((p) => p.method === filter.method);
  if (filter.invoiceId) rows = rows.filter((p) => p.invoiceId === filter.invoiceId);
  return rows.sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));
}

export async function getPayment(id: string): Promise<Payment> {
  const payment = await db.payments.getById(id);
  if (!payment) throw new NotFoundError("Payment");
  return payment;
}

/**
 * Record a payment and run the cascade (spec Section J, Prompt 07 §5):
 *  - reduce the linked invoice's outstanding balance (implicit — balance is derived)
 *  - flip the invoice to Paid when fully settled; draft → sent on first payment
 *  - log an activity and fire the payment_received notification (event-driven)
 * Project / client paid-vs-pending figures are always derived from payments, so
 * they update automatically with no extra write.
 */
export async function recordPayment(input: {
  clientId?: string;
  projectId?: string;
  invoiceId?: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  status?: PaymentStatus;
  reference?: string;
}): Promise<Payment> {
  let clientId = input.clientId;
  let projectId = input.projectId;

  if (input.invoiceId) {
    const invoice = await getInvoice(input.invoiceId);
    clientId = invoice.clientId;
    projectId = invoice.projectId;
  }
  if (!clientId) throw new ValidationError("A payment needs a client or a linked invoice.");

  const now = nowISO();
  const payment: Payment = {
    id: newId("pay"),
    clientId,
    projectId,
    invoiceId: input.invoiceId,
    amount: input.amount,
    paymentDate: input.paymentDate,
    method: input.method,
    status: input.status ?? "completed",
    reference: input.reference,
    createdAt: now,
    updatedAt: now,
  };
  await db.payments.insert(payment);

  if (payment.invoiceId && payment.status === "completed") {
    const invoice = await getInvoice(payment.invoiceId);
    if (invoice.status !== "cancelled") {
      const payments = await db.payments.all();
      const paid = completedPaymentsFor(payments, invoice.id).reduce((s, p) => s + p.amount, 0);
      if (paid >= invoice.amount) {
        await db.invoices.patch(invoice.id, { status: "paid", paidDate: payment.paymentDate });
      } else if (invoice.status === "draft") {
        await db.invoices.patch(invoice.id, { status: "sent" });
      }
    }
  }

  await logActivity("payment", payment.id, "payment_received", `Payment recorded — ₹${payment.amount.toLocaleString("en-IN")} (${METHOD_LABEL[payment.method]})`);
  if (payment.status === "completed") await onPaymentReceived(payment);
  return payment;
}

export async function deletePayment(id: string): Promise<void> {
  const payment = await getPayment(id);
  await db.payments.remove(id);
  // If the invoice was auto-marked paid and now has a balance, drop it back to sent.
  if (payment.invoiceId) {
    const invoice = await db.invoices.getById(payment.invoiceId);
    if (invoice && invoice.status === "paid") {
      const payments = await db.payments.all();
      if (outstandingBalance(invoice, payments) > 0) {
        await db.invoices.patch(invoice.id, { status: "sent", paidDate: undefined });
      }
    }
  }
}
