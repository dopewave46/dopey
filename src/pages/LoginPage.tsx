import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/services/auth";
import { ApiError } from "@/services/api";
import styles from "./LoginPage.module.css";

/**
 * Sign-in screen (Prompt 11 §3). Centered card, existing Input + Button
 * primitives, crimson/white/charcoal — no new design language. On success the
 * httpOnly session cookie is set by the browser and `AuthProvider` hydrates the
 * session; the guard then routes into the shell.
 */
export function LoginPage() {
  const { status, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "authed") return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("That email and password don't match.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("Too many attempts. Try again in a few minutes.");
      } else if (err instanceof ApiError && err.code === "network_error") {
        setError("Can't reach the server. Make sure the backend is running.");
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
          <span className={styles.wordmark}>DopeOrca&nbsp;OS</span>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Your agency operating system.</p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
