import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { useProjects } from "@/hooks/useProjects";
import { useCrm } from "@/hooks/useCrm";
import { useFinance } from "@/hooks/useFinance";
import { projectFinance } from "@/services/financeSelectors";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { PROJECT_BOARD_ORDER, PROJECT_STATUS_LABELS } from "@/services/projectStore";
import styles from "./ProjectsPage.module.css";

type View = "grid" | "board";
type Sort = "deadline" | "progress" | "value";

export function ProjectsPage() {
  const navigate = useNavigate();
  const loading = useSimulatedLoad();
  const { projects, store } = useProjects();
  const { clients } = useCrm();
  const { invoices, payments } = useFinance();

  const [view, setView] = useState<View>("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<Sort>("deadline");
  const newModal = useDisclosure();

  const clientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.company ||
    clients.find((c) => c.id === clientId)?.name ||
    "Unknown client";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = projects.filter((p) => {
      if (status && p.status !== status) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || clientName(p.clientId).toLowerCase().includes(q);
    });
    return [...rows].sort((a, b) => {
      if (sort === "progress") return b.progressPercent - a.progressPercent;
      if (sort === "value") return b.value - a.value;
      // deadline — soonest first, undated last
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, query, status, sort, clients]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every website DopeOrca is building — progress and status at a glance."
        actions={
          <>
            <SegmentedControl
              aria-label="Projects view"
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: "Cards" },
                { value: "board", label: "Board" },
              ]}
            />
            <Button iconLeft="plus" onClick={newModal.open}>
              Start New Project
            </Button>
          </>
        }
      />

      {projects.length === 0 && !loading ? (
        <EmptyState
          icon="projects"
          title="No projects yet"
          description="Start your first project to begin tracking work."
          action={
            <Button iconLeft="plus" onClick={newModal.open}>
              Start New Project
            </Button>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search project or client…"
              aria-label="Search projects"
            />
            <InlineSelect
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="All statuses"
              options={PROJECT_BOARD_ORDER.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
            />
            {view === "grid" && (
              <InlineSelect
                label="Sort"
                value={sort}
                onChange={(v) => setSort(v as Sort)}
                options={[
                  { value: "deadline", label: "Deadline" },
                  { value: "progress", label: "Progress" },
                  { value: "value", label: "Value" },
                ]}
              />
            )}
          </Toolbar>

          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : view === "grid" ? (
            filtered.length === 0 ? (
              <EmptyState compact icon="search" title="No projects match these filters" />
            ) : (
              <div className={styles.grid}>
                {filtered.map((project) => {
                  const fin = projectFinance(project.id, project.value, invoices, payments);
                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      clientName={clientName(project.clientId)}
                      payment={{ status: fin.status, label: fin.label }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  );
                })}
              </div>
            )
          ) : (
            <ProjectBoard
              projects={filtered}
              clientName={clientName}
              onOpen={(id) => navigate(`/projects/${id}`)}
              onStatusChange={(id, s) => store.setStatus(id, s)}
            />
          )}
        </>
      )}

      <NewProjectModal open={newModal.isOpen} onClose={newModal.close} navigateOnCreate />
    </>
  );
}
