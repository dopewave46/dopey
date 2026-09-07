import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import { Skeleton } from "./Skeleton";
import styles from "./DataTable.module.css";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. Defaults to String(row[key]). */
  render?: (row: T) => ReactNode;
  /** Value used for sorting; enables the sort control when provided. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Fixed width, e.g. "140px". */
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  /** Shown when rows is empty and not loading. */
  emptyState?: ReactNode;
  defaultSort?: { key: string; dir: "asc" | "desc" };
  minWidth?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  loading = false,
  emptyState,
  defaultSort,
  minWidth = "720px",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(defaultSort ?? null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  if (!loading && rows.length === 0 && emptyState) {
    return <div className={styles.wrap}>{emptyState}</div>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
        <table className={styles.table} style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align ?? "left" }}
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        className={cn(styles.sortBtn, active && styles.sortActive)}
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.header}
                        <Icon
                          name={active && sort!.dir === "desc" ? "arrow-down" : "arrow-up"}
                          size={12}
                          weight={2.4}
                          className={cn(styles.sortIcon, active && styles.sortIconOn)}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        <Skeleton height={12} width={col.align === "right" ? "50%" : "70%"} />
                      </td>
                    ))}
                  </tr>
                ))
              : sortedRows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    className={cn(onRowClick && styles.clickable)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter") onRowClick(row);
                          }
                        : undefined
                    }
                  >
                    {columns.map((col) => (
                      <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
