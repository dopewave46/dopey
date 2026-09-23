import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { usePortalAuth } from "@/services/portalAuth";
import { ApiError } from "@/services/api";
import styles from "@/pages/LoginPage.module.css";

/**
 * Client-portal sign-in (spec §6). Reuses the admin login's visual pattern
 * (same tokens, same Input/Button primitives) but with distinct branding —
 * "DopeOrca — Project Tracker" — so a client never mistakes it for the
 * internal admin login.
 */
export function PortalLoginPage() {
  const { status, login } = usePortalAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "DopeOrca — Project Tracker";
  }, []);

  if (status === "authed") return <Navigate to="/portal" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("That username and password don't match.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("Too many attempts. Try again in a few minutes.");
      } else if (err instanceof ApiError && err.code === "network_error") {
        setError("Can't reach the server. Please try again shortly.");
      } else {
        setError(err instanceof Error ? err.message : "Couldn't sign you in.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <main className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.glyph}>
            <Icon name="orca" size={20} weight={1.6} />
          </span>
          <span className={styles.wordmark}>DopeOrca</span>
        </div>
        <h1 className={styles.title}>Track your project</h1>
        <p className={styles.subtitle}>Sign in with the details your DopeOrca contact sent you.</p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Input
            label="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className={styles.error} role="alert">
              <Icon name="alert-circle" size={14} weight={2} />
              {error}
            </p>
          )}

          <Button type="submit" fullWidth loading={submitting} disabled={submitting}>
            Sign in
          </Button>
        </form>
      </main>
    </div>
  );
}
