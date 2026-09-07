import { useState } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import { Menu } from "@/components/ui/Menu";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/utils/format";
import { PROJECT_BOARD_ORDER, PROJECT_STATUS_LABELS } from "@/services/projectStore";
import type { Project, ProjectStatus } from "@/services/types";
import styles from "./ProjectBoard.module.css";

export interface ProjectBoardProps {
  projects: Project[];
  clientName: (clientId: string) => string;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}

export function ProjectBoard({ projects, clientName, onOpen, onStatusChange }: ProjectBoardProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ProjectStatus | null>(null);

  const drop = (status: ProjectStatus) => {
    const project = projects.find((p) => p.id === dragId);
    setDragId(null);
    setOverCol(null);
    if (project && project.status !== status) onStatusChange(project.id, status);
  };

  return (
    <div className={styles.board}>
      {PROJECT_BOARD_ORDER.map((status) => {
        const cols = projects.filter((p) => p.status === status);
        const total = cols.reduce((sum, p) => sum + p.value, 0);
        return (
          <section
            key={status}
            className={cn(
              styles.column,
              (status === "live" || status === "completed") && styles.columnDone,
              overCol === status && styles.columnOver,
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((s) => (s === status ? null : s))}
            onDrop={() => drop(status)}
          >
            <header className={styles.head}>
              <span className={styles.title}>{PROJECT_STATUS_LABELS[status]}</span>
              <span className={styles.count}>{cols.length}</span>
            </header>
            {total > 0 && <div className={styles.total}>{formatCurrency(total)}</div>}

            <div className={styles.cards}>
              {cols.map((project) => (
                <article
                  key={project.id}
                  className={cn(styles.card, dragId === project.id && styles.dragging)}
                  draggable
                  onDragStart={() => setDragId(project.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  onClick={() => onOpen(project.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onOpen(project.id);
                  }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardName}>
                      {project.name.replace(`${clientName(project.clientId)} — `, "")}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Menu
                        align="end"
                        items={[
                          { label: "Open project", icon: "arrow-right", onSelect: () => onOpen(project.id) },
                          ...PROJECT_BOARD_ORDER.filter((s) => s !== project.status).map((s) => ({
                            label: `Move to ${PROJECT_STATUS_LABELS[s]}`,
                            onSelect: () => onStatusChange(project.id, s),
                            divided: s === "planning",
                          })),
                        ]}
                        trigger={(props) => (
                          <button type="button" className={styles.menuBtn} aria-label="Project actions" {...props}>
                            <Icon name="more" size={16} />
                          </button>
                        )}
                      />
                    </div>
                  </div>
                  <span className={styles.cardClient}>{clientName(project.clientId)}</span>
                  <ProgressBar value={project.progressPercent} size="sm" label={`${project.name} progress`} />
                  <span className={styles.cardValue}>{formatCurrency(project.value)}</span>
                </article>
              ))}
              {cols.length === 0 && <p className={styles.empty}>—</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
