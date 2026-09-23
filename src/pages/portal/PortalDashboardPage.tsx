import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ProjectStageStrip } from "@/components/projects/ProjectStageStrip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { portalApi } from "@/services/portalApi";
import { formatDate } from "@/utils/format";
import type { PortalProject, ProjectUpdate } from "@/services/types";
import { cn } from "@/utils/cn";
import styles from "./PortalDashboardPage.module.css";

const PROGRESS_ANIM_MS = 600;

/** Ticks a displayed number from 0 to `target` once, eased — purely cosmetic. */
function useCountUp(target: number, durationMs: number, disabled: boolean): number {
  const [value, setValue] = useState(disabled ? target : 0);

  useEffect(() => {
    if (disabled) {
      setValue(target);
      return;
    }
    setValue(0);
    let raf = 0;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, disabled]);

  return value;
}

/**
 * Client portal home (spec §6). Shows the client's own project (or a picker
 * if they have more than one) with a read-only stage strip + progress, and a
 * timeline of updates Shahid has posted. No Finance/Payment data anywhere.
 */
export function PortalDashboardPage() {
  const [projects, setProjects] = useState<PortalProject[] | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    document.title = "DopeOrca — Project Tracker";
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      portalApi.get<{ projects: PortalProject[] }>("/project"),
      portalApi.get<{ updates: ProjectUpdate[] }>("/updates"),
    ])
      .then(([p, u]) => {
        if (cancelled) return;
        setProjects(p.projects);
        setUpdates(u.updates);
        if (p.projects.length === 1) setSelectedId(p.projects[0].id);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your project.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProject = projects?.find((p) => p.id === selectedId);
  const animatedPercent = useCountUp(selectedProject?.progressPercent ?? 0, PROGRESS_ANIM_MS, reducedMotion);

  if (error) {
    return <ErrorState title="Couldn't load your project" message={error} onRetry={() => window.location.reload()} />;
  }

  if (!projects || !updates) {
    return (
      <div style={{ display: "grid", gap: "var(--s-4)" }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon="projects"
        title="Your project hasn't started yet"
        description="Check back soon — we'll post updates here as work begins."
      />
    );
  }

  if (!selectedId) {
    return (
      <div className={styles.stack}>
        <h1 className={styles.pageTitle}>Your projects</h1>
        <ul className={styles.pickerList}>
          {projects.map((p) => (
            <li key={p.id}>
              <button type="button" className={styles.pickerItem} onClick={() => setSelectedId(p.id)}>
                <span>{p.name}</span>
                <span className={styles.pickerMeta}>
                  {p.statusLabel} · {p.progressPercent}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const project = selectedProject ?? projects[0];
  const projectUpdates = updates.filter((u) => u.projectId === project.id);

  return (
    <div className={styles.stack}>
      {projects.length > 1 && (
        <button type="button" className={styles.backLink} onClick={() => setSelectedId(null)}>
          <Icon name="chevron-left" size={14} weight={2} />
          All projects
        </button>
      )}

      <Card className={styles.projectCard}>
        <CardHeader title={project.name} subtitle={project.statusLabel} />
        <ProjectStageStrip status={project.status} glow />
        <div className={styles.progressRow}>
          <ProgressBar value={animatedPercent} label="Overall progress" durationMs={PROGRESS_ANIM_MS} />
          <span className={styles.progressPct}>{animatedPercent}%</span>
        </div>
        {project.deadline && (
          <p className={styles.deadline}>
            <Icon name="calendar" size={14} weight={2} />
            Expected by {formatDate(project.deadline)}
          </p>
        )}
      </Card>

      <div className={styles.updatesHead}>
        <h2 className={styles.sectionTitle}>Updates</h2>
      </div>

      {projectUpdates.length === 0 ? (
        <EmptyState icon="clock" title="No updates yet" description="Check back soon — we'll post progress here." />
      ) : (
        <ul className={styles.timeline}>
          {projectUpdates.map((u, i) => (
            <li
              key={u.id}
              className={cn(styles.updateCard, !reducedMotion && styles.updateCardAnim)}
              style={reducedMotion ? undefined : { animationDelay: `${Math.min(i, 10) * 70}ms` }}
            >
              <div className={styles.updateHead}>
                <span className={styles.updateTitle}>{u.title}</span>
                {u.percentAtUpdate !== undefined && <span className={styles.updatePct}>{u.percentAtUpdate}%</span>}
              </div>
              {u.note && <p className={styles.updateNote}>{u.note}</p>}
              <span className={styles.updateDate}>{formatDate(u.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
