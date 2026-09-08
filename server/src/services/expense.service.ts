import { db } from "../repositories/index.js";
import type { Expense, ExpenseCategory } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO, periodRange, inRange, type PeriodKey } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";

export async function listExpenses(filter: { category?: ExpenseCategory; period?: PeriodKey; q?: string } = {}): Promise<Expense[]> {
  let rows = await db.expenses.all();
  if (filter.category) rows = rows.filter((e) => e.category === filter.category);
  if (filter.period) {
    const { start, end } = periodRange(filter.period);
    rows = rows.filter((e) => inRange(e.date, start, end));
  }
  if (filter.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((e) => e.name.toLowerCase().includes(q) || (e.notes ?? "").toLowerCase().includes(q));
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function createExpense(input: Omit<Expense, "id" | "createdAt" | "updatedAt">): Promise<Expense> {
  const now = nowISO();
  const expense: Expense = { ...input, id: newId("exp"), createdAt: now, updatedAt: now };
  await db.expenses.insert(expense);
  return expense;
}

export async function updateExpense(id: string, patch: Partial<Expense>): Promise<Expense> {
  const existing = await db.expenses.getById(id);
  if (!existing) throw new NotFoundError("Expense");
  return (await db.expenses.patch(id, patch))!;
}

export async function deleteExpense(id: string): Promise<void> {
  const existing = await db.expenses.getById(id);
  if (!existing) throw new NotFoundError("Expense");
  await db.expenses.remove(id);
}
