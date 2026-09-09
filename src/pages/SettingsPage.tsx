import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth";
import { apiErrorMessage } from "@/utils/apiError";
import styles from "./SettingsPage.module.css";

interface AgencySettingsResponse {
  agencyName: string;
  location: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  renewalLeadDays: number;
  deadlineLeadDays: number;
  notificationPreferences: Record<string, boolean>;
  admin: { name: string; email: string; role: string };
}

/**
 * Settings (Prompt 11 §9). Loads `GET /api/settings`; the agency name,
 * location and notification lead-times are editable and saved via
 * `PATCH /api/settings` (the backend key/value store from Prompt 10).
 */
export function SettingsPage() {
  const toast = useToast();
  const { refresh } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() =>
    api.get<AgencySettingsResponse>("/settings"),
  );

  const [form, setForm] = useState({ agencyName: "", location: "", renewalLeadDays: "", deadlineLeadDays: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        agencyName: data.agencyName,
        location: data.location,
        renewalLeadDays: String(data.renewalLeadDays),
        deadlineLeadDays: String(data.deadlineLeadDays),
      });
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/settings", {
        "agency.name": form.agencyName.trim(),
        "agency.location": form.location.trim(),
        "notifications.renewalLeadDays": Number(form.renewalLeadDays) || 30,
        "notifications.deadlineLeadDays": Number(form.deadlineLeadDays) || 5,
      });
      await Promise.all([reload(), refresh()]);
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Couldn't save settings", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Agency information, localisation and preferences for DopeOrca OS."
      />

      {error ? (
        <ErrorState title="Couldn't load settings" message={error.message} onRetry={reload} />
      ) : loading || !data ? (
        <Card>
          <SkeletonText lines={6} />
        </Card>
      ) : (
        <div className={styles.grid}>
          <Card>
            <CardHeader title="Agency &amp; localisation" subtitle="Used across the app" />
            <div className={styles.form}>
              <Input
                label="Agency name"
                value={form.agencyName}
                onChange={(e) => setForm((f) => ({ ...f, agencyName: e.target.value }))}
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <dl className={styles.list}>
                <div className={styles.row}>
                  <dt>Timezone</dt>
                  <dd>{data.timezone} (IST, UTC+5:30)</dd>
                </div>
                <div className={styles.row}>
                  <dt>Currency</dt>
                  <dd>Indian Rupee — ₹ (INR)</dd>
                </div>
                <div className={styles.row}>
                  <dt>Admin</dt>
                  <dd>
                    {data.admin.name} · {data.admin.email}
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt>Theme</dt>
                  <dd>Light (Version 1)</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Notifications" subtitle="How far ahead to warn you" />
            <div className={styles.form}>
              <Input
                label="AMC renewal lead-time (days)"
                type="number"
                inputMode="numeric"
                value={form.renewalLeadDays}
                onChange={(e) => setForm((f) => ({ ...f, renewalLeadDays: e.target.value }))}
              />
              <Input
                label="Project deadline lead-time (days)"
                type="number"
                inputMode="numeric"
                value={form.deadlineLeadDays}
                onChange={(e) => setForm((f) => ({ ...f, deadlineLeadDays: e.target.value }))}
              />
              <ul className={styles.pending}>
                {Object.entries(data.notificationPreferences).map(([type, on]) => (
                  <li key={type}>
                    {type.replace(/_/g, " ")} — {on ? "on" : "off"}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <div className={styles.actions}>
            <Button onClick={save} loading={saving} disabled={saving} iconLeft="check">
              Save changes
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
