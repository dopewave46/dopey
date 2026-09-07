import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "@/components/icons/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Portal, useBodyScrollLock, useOverlayKeys } from "@/components/ui/overlay-internals";
import { NAV_ITEMS } from "@/config/navigation";
import styles from "./SearchPalette.module.css";

export interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Result {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  to: string;
}

/**
 * Command palette scaffold. Right now it only searches navigation destinations
 * so the interaction is real and testable. A later prompt connects it to
 * Clients / Leads / Projects / Tasks / Invoices via `services/api`.
 */
export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useBodyScrollLock(open);
  useOverlayKeys(open, panelRef, onClose);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q)).map((item) => ({
      id: item.to,
      label: item.label,
      hint: "Go to page",
      icon: item.icon,
      to: item.to,
    }));
  }, [query]);

  if (!open) return null;

  const go = (to: string) => {
    navigate(to);
    onClose();
    setQuery("");
  };

  return (
    <Portal>
      <div className={styles.scrim} onClick={onClose}>
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Search DopeOrca OS"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.inputRow}>
            <Icon name="search" size={18} weight={1.9} />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              className={styles.input}
              placeholder="Search projects, clients, leads…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) go(results[0].to);
              }}
            />
            <kbd className={styles.esc}>Esc</kbd>
          </div>

          <div className={styles.body}>
            {query.trim() === "" ? (
              <div className={styles.hintBlock}>
                <p className={styles.hintTitle}>Search across your agency</p>
                <p className={styles.hintText}>
                  Clients, leads, projects, tasks, and invoices will appear here. For now, jump to any
                  section by name.
                </p>
              </div>
            ) : results.length > 0 ? (
              <ul className={styles.list}>
                {results.map((r) => (
                  <li key={r.id}>
                    <button type="button" className={styles.result} onClick={() => go(r.to)}>
                      <span className={styles.resultIcon}>
                        <Icon name={r.icon} size={16} />
                      </span>
                      <span className={styles.resultLabel}>{r.label}</span>
                      <span className={styles.resultHint}>{r.hint}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon="search"
                title={`No matches for "${query}"`}
                description="Full record search connects in a later update."
              />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
