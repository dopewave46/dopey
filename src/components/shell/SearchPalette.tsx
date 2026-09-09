import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "@/components/icons/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Portal, useBodyScrollLock, useOverlayKeys } from "@/components/ui/overlay-internals";
import { NAV_ITEMS } from "@/config/navigation";
import { api } from "@/services/api";
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

interface ApiSearchResult {
  type: "lead" | "client" | "project" | "task" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_ICON: Record<ApiSearchResult["type"], IconName> = {
  lead: "leads",
  client: "crm",
  project: "projects",
  task: "tasks",
  invoice: "finance",
};
const TYPE_LABEL: Record<ApiSearchResult["type"], string> = {
  lead: "Leads",
  client: "Clients",
  project: "Projects",
  task: "Tasks",
  invoice: "Invoices",
};
const TYPE_ORDER: ApiSearchResult["type"][] = ["client", "lead", "project", "task", "invoice"];

/**
 * Command palette (Prompt 11 §11). Debounced `GET /api/search?q=`, grouped by
 * the record types the backend returns, plus a "Go to" group for navigation.
 */
export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<ApiSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useBodyScrollLock(open);
  useOverlayKeys(open, panelRef, onClose);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecords([]);
    }
  }, [open]);

  // Debounced record search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRecords([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api
        .get<ApiSearchResult[]>("/search", { q }, controller.signal)
        .then((rows) => setRecords(rows))
        .catch(() => {
          /* aborted or failed — leave prior results */
        })
        .finally(() => setSearching(false));
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const navResults = useMemo<Result[]>(() => {
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

  const grouped = useMemo(() => {
    const map = new Map<ApiSearchResult["type"], ApiSearchResult[]>();
    for (const r of records) {
      if (!map.has(r.type)) map.set(r.type, []);
      map.get(r.type)!.push(r);
    }
    return TYPE_ORDER.filter((t) => map.has(t)).map((t) => ({ type: t, rows: map.get(t)! }));
  }, [records]);

  if (!open) return null;

  const go = (to: string) => {
    navigate(to);
    onClose();
    setQuery("");
  };

  const firstHref = records[0]?.href ?? navResults[0]?.to;
  const hasAny = records.length > 0 || navResults.length > 0;

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
              placeholder="Search clients, leads, projects, tasks, invoices…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && firstHref) go(firstHref);
              }}
            />
            <kbd className={styles.esc}>Esc</kbd>
          </div>

          <div className={styles.body}>
            {query.trim() === "" ? (
              <div className={styles.hintBlock}>
                <p className={styles.hintTitle}>Search across your agency</p>
                <p className={styles.hintText}>
                  Find any client, lead, project, task or invoice by name — or jump to a section.
                </p>
              </div>
            ) : hasAny ? (
              <>
                {grouped.map((group) => (
                  <div key={group.type}>
                    <p className={styles.groupLabel}>{TYPE_LABEL[group.type]}</p>
                    <ul className={styles.list}>
                      {group.rows.map((r) => (
                        <li key={r.id}>
                          <button type="button" className={styles.result} onClick={() => go(r.href)}>
                            <span className={styles.resultIcon}>
                              <Icon name={TYPE_ICON[r.type]} size={16} />
                            </span>
                            <span className={styles.resultLabel}>{r.title}</span>
                            <span className={styles.resultHint}>{r.subtitle}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {navResults.length > 0 && (
                  <div>
                    <p className={styles.groupLabel}>Go to</p>
                    <ul className={styles.list}>
                      {navResults.map((r) => (
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
                  </div>
                )}
              </>
            ) : searching ? (
              <div className={styles.hintBlock}>
                <p className={styles.hintText}>Searching…</p>
              </div>
            ) : (
              <EmptyState
                compact
                icon="search"
                title={`No matches for "${query}"`}
                description="Try a client name, business, invoice number or project."
              />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
