import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { usePortalAuth } from "@/services/portalAuth";
import { PortalWelcomeIntro } from "@/components/portal/PortalWelcomeIntro";
import styles from "./PortalShell.module.css";

/** sessionStorage flag — its own key, unrelated to the admin app's storage. */
const WELCOME_SHOWN_KEY = "orca.portal.welcomeShown";

/**
 * Minimal shell for the client portal (spec §6) — deliberately NOT the admin
 * `AppShell`: no sidebar, no search, no notifications, no admin nav. Just a
 * branded header with the client's name and a logout link, and the page body.
 */
export function PortalShell() {
  const { status, client, logout, refresh } = usePortalAuth();
  const { pathname } = useLocation();

  const [showIntro, setShowIntro] = useState(false);
  const introTriggered = useRef(false);

  useEffect(() => {
    if (status !== "authed" || introTriggered.current) return;
    introTriggered.current = true;
    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem(WELCOME_SHOWN_KEY) === "1";
    } catch {
      /* storage unavailable — skip the intro rather than risk showing it every time */
    }
    if (!alreadyShown) {
      setShowIntro(true);
      try {
        sessionStorage.setItem(WELCOME_SHOWN_KEY, "1");
      } catch {
        /* non-critical */
      }
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className={styles.boot} aria-busy="true">
        <span className={styles.bootMark} />
      </div>
    );
  }
  if (status === "unauthed") {
    return <Navigate to="/portal/login" replace state={{ from: pathname }} />;
  }
  if (status === "offline") {
    return (
      <div className={styles.boot}>
        <ErrorState
          title="Can't reach the server"
          message="The DopeOrca OS backend isn't responding. Check your connection and try again."
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {showIntro && client && (
        <PortalWelcomeIntro businessName={client.company || client.name} onDone={() => setShowIntro(false)} />
      )}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.glyph}>
            <Icon name="orca" size={18} weight={1.6} />
          </span>
          <span className={styles.wordmark}>DopeOrca</span>
        </div>
        <div className={styles.right}>
          {client && <span className={styles.clientName}>{client.company || client.name}</span>}
          <button type="button" className={styles.logout} onClick={() => void logout()}>
            <Icon name="logout" size={15} weight={2} />
            Log out
          </button>
        </div>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
