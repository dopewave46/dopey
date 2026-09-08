import { Router } from "express";
import { wrap } from "../utils/wrap.js";
import { created, noContent, ok } from "../utils/envelope.js";
import { validate } from "../middleware/validate.js";
import { expenseSchemas, invoiceSchemas, paymentSchemas } from "../schemas/index.js";
import {
  createInvoice,
  decorate,
  deleteInvoice,
  getInvoice,
  listInvoices,
  setInvoiceStatus,
  updateInvoice,
} from "../services/invoice.service.js";
import { deletePayment, listPayments, recordPayment } from "../services/payment.service.js";
import { createExpense, deleteExpense, listExpenses, updateExpense } from "../services/expense.service.js";
import { breakdownByClient, moneyByMonth, revenueSummary } from "../services/finance.service.js";
import type { PeriodKey } from "../utils/dates.js";

export const financeRoutes = Router();

/* ---- revenue overview ---- */
financeRoutes.get("/overview", wrap(async (req, res) => {
  const period = ((req.query.period as string) || "6m") as PeriodKey;
  ok(res, {
    summary: await revenueSummary(period),
    byClient: await breakdownByClient(),
    byMonth: await moneyByMonth(period),
  });
}));

/* ---- invoices ---- */
financeRoutes.get("/invoices", validate(invoiceSchemas.list), wrap(async (req, res) => ok(res, await listInvoices(req.query))));
financeRoutes.post("/invoices", validate(invoiceSchemas.create), wrap(async (req, res) => created(res, await createInvoice(req.body))));
financeRoutes.get("/invoices/:id", wrap(async (req, res) => ok(res, await decorate(await getInvoice(req.params.id)))));
financeRoutes.patch("/invoices/:id", validate(invoiceSchemas.update), wrap(async (req, res) => ok(res, await updateInvoice(req.params.id, req.body))));
financeRoutes.post("/invoices/:id/status", validate(invoiceSchemas.setStatus), wrap(async (req, res) =>
  ok(res, await setInvoiceStatus(req.params.id, req.body.status)),
));
financeRoutes.get("/invoices/:id/payments", wrap(async (req, res) => ok(res, await listPayments({ invoiceId: req.params.id }))));
financeRoutes.delete("/invoices/:id", wrap(async (req, res) => {
  await deleteInvoice(req.params.id);
  noContent(res);
}));

/* ---- payments ---- */
financeRoutes.get("/payments", validate(paymentSchemas.list), wrap(async (req, res) => ok(res, await listPayments(req.query))));
financeRoutes.post("/payments", validate(paymentSchemas.create), wrap(async (req, res) => created(res, await recordPayment(req.body))));
financeRoutes.delete("/payments/:id", wrap(async (req, res) => {
  await deletePayment(req.params.id);
  noContent(res);
}));

/* ---- expenses ---- */
financeRoutes.get("/expenses", validate(expenseSchemas.list), wrap(async (req, res) => {
  const rows = await listExpenses(req.query);
  ok(res, rows, 200, { total: rows.reduce((s, e) => s + e.amount, 0) });
}));
financeRoutes.post("/expenses", validate(expenseSchemas.create), wrap(async (req, res) => created(res, await createExpense(req.body))));
financeRoutes.patch("/expenses/:id", validate(expenseSchemas.update), wrap(async (req, res) => ok(res, await updateExpense(req.params.id, req.body))));
financeRoutes.delete("/expenses/:id", wrap(async (req, res) => {
  await deleteExpense(req.params.id);
  noContent(res);
}));
