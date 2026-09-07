import { useId, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import styles from "./Tabs.module.css";

export interface TabDef {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabDef[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
}

/** Underline tab bar. Pair with your own panel switching (keeps it flexible). */
export function Tabs({ tabs, value, onChange, ...rest }: TabsProps) {
  const base = useId();
  return (
    <div className={styles.bar} role="tablist" aria-label={rest["aria-label"]}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            id={`${base}-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(styles.tab, selected && styles.active)}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {typeof tab.count === "number" && <span className={styles.count}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children, when, value }: { children: ReactNode; when: string; value: string }) {
  if (when !== value) return null;
  return (
    <div role="tabpanel" className={styles.panel}>
      {children}
    </div>
  );
}
