import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { apiErrorMessage } from "@/utils/apiError";
import { financeStore, EXPENSE_CATEGORY_LABELS } from "@/services/financeStore";
import type { Expense, ExpenseCategory } from "@/services/types";
import styles from "@/components/crm/LeadFormModal.module.css";

export function ExpenseFormModal({
  open,
  onClose,
  expense,
}: {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
}) {
  const toast = useToast();
  const isEdit = Boolean(expense);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("software");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (expense) {
      setName(expense.name);
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setDate(expense.date.slice(0, 10));
      setNotes(expense.notes ?? "");
    } else {
      setName("");
      setCategory("software");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [open, expense]);

  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const n = Number(amount.replace(/[,\s]/g, ""));
    if (!name.trim()) next.name = "Give the expense a name.";
    if (!amount || Number.isNaN(n) || n <= 0) next.amount = "Enter an amount in rupees.";
    if (!date) next.date = "Pick a date.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    const payload = {
      name: name.trim(),
      category,
      amount: n,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    };
    setSaving(true);
    try {
      if (isEdit && expense) {
        await financeStore.updateExpense(expense.id, payload);
        toast.success("Expense updated", payload.name);
      } else {
        await financeStore.addExpense(payload);
        toast.success("Expense added", payload.name);
      }
      onClose();
    } catch (err) {
      toast.error("Couldn't save the expense", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit expense" : "Add expense"}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" loading={saving} disabled={saving}>
            {isEdit ? "Save changes" : "Add expense"}
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={submit} className={styles.form}>
        <Input
          label="Name"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g. Vercel Pro"
        />
        <div className={styles.row}>
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
          <Input
            label="Amount (₹)"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            inputMode="numeric"
          />
        </div>
        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
