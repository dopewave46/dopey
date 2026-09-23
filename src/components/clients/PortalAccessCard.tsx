import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { api } from "@/services/api";
import { apiErrorMessage } from "@/utils/apiError";
import type { PortalCredentialInfo } from "@/services/types";
import styles from "./PortalAccessCard.module.css";

/**
 * Client Detail → "Portal" tab (client portal spec §5). Lets Shahid create
 * portal access, see the generated username, toggle it on/off, and reset the
 * password — the plaintext password is only ever shown once, right after
 * creation/reset, and is never fetched or displayed again after that.
 */
export function PortalAccessCard({ clientId }: { clientId: string }) {
  const toast = useToast();
  const { data: info, loading, reload } = useAsyncData(() =>
    api.get<PortalCredentialInfo | null>(`/clients/${clientId}/portal-credentials`),
  );
  const [reveal, setReveal] = useState<{ username: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const { credential, password } = await api.post<{ credential: PortalCredentialInfo; password: string }>(
        `/clients/${clientId}/portal-credentials`,
        {},
      );
      setReveal({ username: credential.username, password });
      await reload();
      toast.success("Portal access created");
    } catch (err) {
      toast.error("Couldn't create portal access", apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    try {
      const { credential, password } = await api.patch<{ credential: PortalCredentialInfo; password?: string }>(
        `/clients/${clientId}/portal-credentials`,
        { resetPassword: true },
      );
      if (password) setReveal({ username: credential.username, password });
      await reload();
      toast.success("Password reset");
    } catch (err) {
      toast.error("Couldn't reset the password", apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async () => {
    if (!info) return;
    setBusy(true);
    try {
      await api.patch(`/clients/${clientId}/portal-credentials`, { enabled: !info.enabled });
      await reload();
      toast.success(info.enabled ? "Portal access disabled" : "Portal access enabled");
    } catch (err) {
      toast.error("Couldn't update portal access", apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy", "Select and copy the text manually.");
    }
  };

  return (
    <Card>
      <CardHeader title="Client portal access" subtitle="Lets this client track their project's progress read-only" />

      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : reveal ? (
        <div className={styles.reveal}>
          <p className={styles.revealWarning}>
            <Icon name="alert-circle" size={14} weight={2} />
            Copy this now — the password won't be shown again.
          </p>
          <div className={styles.credRow}>
            <span className={styles.credLabel}>Username</span>
            <code className={styles.credValue}>{reveal.username}</code>
            <button type="button" className={styles.copyBtn} onClick={() => copy(reveal.username)} aria-label="Copy username">
              <Icon name="copy" size={14} weight={2} />
            </button>
          </div>
          <div className={styles.credRow}>
            <span className={styles.credLabel}>Password</span>
            <code className={styles.credValue}>{reveal.password}</code>
            <button type="button" className={styles.copyBtn} onClick={() => copy(reveal.password)} aria-label="Copy password">
              <Icon name="copy" size={14} weight={2} />
            </button>
          </div>
          <p className={styles.hint}>Send these to the client over WhatsApp, then dismiss this box.</p>
          <Button size="sm" variant="secondary" onClick={() => setReveal(null)}>
            Done
          </Button>
        </div>
      ) : info ? (
        <div className={styles.existing}>
          <div className={styles.credRow}>
            <span className={styles.credLabel}>Username</span>
            <code className={styles.credValue}>{info.username}</code>
          </div>
          <div className={styles.credRow}>
            <span className={styles.credLabel}>Status</span>
            <span className={info.enabled ? styles.statusOn : styles.statusOff}>
              {info.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className={styles.actions}>
            <Button size="sm" variant="secondary" onClick={toggleEnabled} disabled={busy}>
              {info.enabled ? "Disable access" : "Enable access"}
            </Button>
            <Button size="sm" variant="secondary" onClick={resetPassword} disabled={busy}>
              Reset password
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.empty}>
          <p className={styles.hint}>This client doesn't have portal access yet.</p>
          <Button size="sm" iconLeft="plus" onClick={create} loading={busy} disabled={busy}>
            Create Portal Access
          </Button>
        </div>
      )}
    </Card>
  );
}
