import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Icon } from "@/components/icons/Icon";
import { useToast } from "@/components/feedback/ToastProvider";
import { useOutreach } from "@/hooks/useOutreach";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { run } from "@/utils/runAction";
import { formatDate } from "@/utils/format";
import type { OutreachLog } from "@/services/types";
import styles from "./OutreachPage.module.css";

/**
 * Outreach daily log (Outreach + 45-Day Mission module). Today's entry is a
 * form saved explicitly (matching Settings' save pattern); the streak and
 * history are server-derived and refetch on every save.
 */
export function OutreachPage() {
  const loading = useSimulatedLoad();
  const toast = useToast();
  const { today, history, streak, store } = useOutreach();

  const [form, setForm] = useState({ callsMade: 0, instagramPosted: false, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (today) {
      setForm({ callsMade: today.callsMade, instagramPosted: today.instagramPosted, notes: today.notes ?? "" });
    }
  }, [today]);

  const target = today?.callsTarget ?? 30;
  const pct = target > 0 ? (form.callsMade / target) * 100 : 0;

  const save = async () => {
    setSaving(true);
    const ok = await run(
      store.updateToday({ callsMade: form.callsMade, instagramPosted: form.instagramPosted, notes: form.notes.trim() || undefined }),
      toast,
      "Couldn't save today's log",
    );
    setSaving(false);
    if (ok) toast.success("Outreach log saved");
  };

  const columns: Column<OutreachLog>[] = useMemo(
    () => [
      { key: "date", header: "Date", sortValue: (l) => l.date, render: (l) => formatDate(l.date) },
      {
        key: "calls",
        header: "Calls",
        sortValue: (l) => l.callsMade,
        render: (l) => (
          <span style={{ fontWeight: 600, color: l.callsMade >= l.callsTarget ? "var(--success)" : "var(--slate)" }}>
            {l.callsMade} / {l.callsTarget}
          </span>
        ),
      },
      {
        key: "instagram",
        header: "Instagram",
        render: (l) =>
          l.instagramPosted ? (
            <Icon name="check" size={15} weight={2.4} style={{ color: "var(--success)" }} />
          ) : (
            <span style={{ color: "var(--muted)" }}>—</span>
          ),
      },
      {
        key: "notes",
        header: "Notes",
        render: (l) => <span style={{ color: "var(--slate)" }}>{l.notes || "—"}</span>,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Outreach" description="Today's call routine and Instagram habit — logged once a day." />

      {loading || !today ? (
        <Card>
          <SkeletonText lines={5} />
        </Card>
      ) : (
        <>
          <div className={styles.topGrid}>
            <Card>
              <CardHeader title="Today's entry" subtitle={formatDate(today.date)} />
              <div className={styles.entry}>
                <div className={styles.callsRow}>
                  <span className={styles.callsLabel}>Calls made today</span>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => setForm((f) => ({ ...f, callsMade: Math.max(0, f.callsMade - 1) }))}
                      aria-label="Decrease calls made"
                    >
                      <Icon name="chevron-left" size={16} weight={2.2} />
                    </button>
                    <input
                      className={styles.callsInput}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={form.callsMade}
                      onChange={(e) => setForm((f) => ({ ...f, callsMade: Math.max(0, Number(e.target.value) || 0) }))}
                    />
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => setForm((f) => ({ ...f, callsMade: f.callsMade + 1 }))}
                      aria-label="Increase calls made"
                    >
                      <Icon name="plus" size={16} weight={2.2} />
                    </button>
                    <span className={styles.callsTarget}>of {target}</span>
                  </div>
                </div>
                <ProgressBar value={pct} label={`${form.callsMade} of ${target} calls made today`} tone={pct >= 100 ? "success" : "crimson"} />

                <button
                  type="button"
                  className={styles.instaRow}
                  onClick={() => setForm((f) => ({ ...f, instagramPosted: !f.instagramPosted }))}
                  aria-pressed={form.instagramPosted}
                >
                  <span className={styles.checkbox} data-checked={form.instagramPosted}>
                    {form.instagramPosted && <Icon name="check" size={12} weight={3} />}
                  </span>
                  <span>Posted on Instagram today</span>
                </button>

                <Textarea
                  label="Notes"
                  hint="Optional — e.g. “3 interested, 1 demo requested”"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />

                <div className={styles.actions}>
                  <Button onClick={save} loading={saving} disabled={saving} iconLeft="check">
                    Save today's log
                  </Button>
                </div>
              </div>
            </Card>

            <StatCard
              label="Current streak"
              value={`${streak} day${streak === 1 ? "" : "s"}`}
              icon="flag"
              support="consecutive days hitting the call target"
            />
          </div>

          <Card>
            <CardHeader title="History" subtitle="Most recent first" />
            {history.length === 0 ? (
              <EmptyState compact icon="phone" title="No outreach logged yet" description="Save today's entry to start your history." />
            ) : (
              <DataTable columns={columns} rows={history} getRowId={(l) => l.id} defaultSort={{ key: "date", dir: "desc" }} minWidth="600px" />
            )}
          </Card>
        </>
      )}
    </>
  );
}
