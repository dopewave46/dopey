import type { ReactNode } from "react";
import styles from "./Toolbar.module.css";

/** Filter / search row that sits above a table or board. Wraps on small screens. */
export function Toolbar({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.lead}>{children}</div>
      {trailing && <div className={styles.trailing}>{trailing}</div>}
    </div>
  );
}
