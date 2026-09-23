import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/icons/Icon";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { api } from "@/services/api";
import { apiErrorMessage } from "@/utils/apiError";
import { formatDate } from "@/utils/format";
import type { ProjectUpdate } from "@/services/types";
import styles from "./ProjectUpdatesPanel.module.css";

/**
 * Project Detail → "Updates" tab (client portal spec §4/§5). Posts progress
 * notes that appear, verbatim, on the client's read-only portal timeline —
 * this is the admin authoring surface for that same data.
 */
export function ProjectUpdatesPanel({ projectId, currentProgress }: { projectId: string; currentProgress: number }) {
  const toast = useToast();
  const { data: updates, loading, reload } = useAsyncData(() => api.get<ProjectUpdate[]>(`/projects/${projectId}/updates`));

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [percent, setPercent] = useState(String(currentProgress));
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/updates`, {
        title: title.trim(),
        note: note.trim() || undefined,
        percentAtUpdate: percent === "" ? undefined : Number(percent),
      });
      setTitle("");
      setNote("");
      setPercent(String(currentProgress));
      await reload();
      toast.success("Update posted");
    } catch (err) {
      toast.error("Couldn't post the update", apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (updateId: string) => {
    try {
      await api.delete(`/projects/${projectId}/updates/${updateId}`);
      await reload();
      toast.success("Update removed");
    } catch (err) {
      toast.error("Couldn't remove the update", apiErrorMessage(err));
    }
  };

  return (
    <div className={styles.stack}>
      <Card>
        <CardHeader title="Post an update" subtitle="Clients see this on their portal timeline" />
        <div className={styles.form}>
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Homepage design approved" />
          <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Any more detail worth sharing…" />
          <Input
            label="Progress % (optional)"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
          <div>
            <Button onClick={submit} loading={submitting} disabled={submitting || !title.trim()} iconLeft="plus">
              Post Update
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Posted updates</h3>
        </div>
        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : !updates || updates.length === 0 ? (
          <EmptyState compact icon="clock" title="No updates posted yet" description="Post the first update above." />
        ) : (
          <ul className={styles.list}>
            {updates.map((u) => (
              <li key={u.id} className={styles.item}>
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemTitle}>{u.title}</span>
                    {u.percentAtUpdate !== undefined && <span className={styles.itemPct}>{u.percentAtUpdate}%</span>}
                  </div>
                  {u.note && <p className={styles.itemNote}>{u.note}</p>}
                  <span className={styles.itemDate}>{formatDate(u.createdAt)}</span>
                </div>
                <button type="button" className={styles.deleteBtn} onClick={() => void remove(u.id)} aria-label="Delete update">
                  <Icon name="trash" size={15} weight={1.8} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
