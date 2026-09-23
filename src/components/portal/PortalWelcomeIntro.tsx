import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./PortalWelcomeIntro.module.css";

const HOLD_MS = 2000;
const LEAVE_MS = 400;

/**
 * Full-screen branded welcome moment, played once per portal session right
 * after a successful login (portal welcome-animation spec §1). Purely
 * decorative — never blocks or delays the real dashboard data, which loads
 * underneath in parallel; `onDone` just tells the caller to stop covering it.
 */
export function PortalWelcomeIntro({ businessName, onDone }: { businessName: string; onDone: () => void }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reducedMotion) {
      onDoneRef.current();
      return;
    }
    const leaveTimer = window.setTimeout(() => setLeaving(true), HOLD_MS - LEAVE_MS);
    const doneTimer = window.setTimeout(() => onDoneRef.current(), HOLD_MS);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
    // Intentionally runs once — the animation timeline shouldn't restart on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className={`${styles.overlay} ${leaving ? styles.leaving : ""}`} role="status" aria-live="polite">
      <div className={styles.mark}>
        <span className={styles.glyph}>
          <Icon name="orca" size={26} weight={1.5} />
        </span>
        <span className={styles.wordmark}>DopeOrca</span>
      </div>
      <p className={styles.welcome}>Welcome, {businessName}</p>
    </div>
  );
}
