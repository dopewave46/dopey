import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ActivityTimeline } from "@/components/ui/ActivityTimeline";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/icons/Icon";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { RecordPaymentModal } from "@/components/finance/RecordPaymentModal";
import { InvoiceFormModal } from "@/components/finance/InvoiceFormModal";
import { InvoiceStatusBadge } from "@/components/finance/badges";
import { AddProjectTaskModal } from "@/components/projects/AddProjectTaskModal";
import { ProjectStageStrip } from "@/components/projects/ProjectStageStrip";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectStatusBadge } from "@/components/projects/badges";
import { useProjects } from "@/hooks/useProjects";
import { useCrm } from "@/hooks/useCrm";
import { useFinance } from "@/hooks/useFinance";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/components/feedback/ToastProvider";
import { PROJECT_BOARD_ORDER, PROJECT_STATUS_LABELS } from "@/services/projectStore";
import { METHOD_LABELS } from "@/services/financeStore";
import { projectFinance, invoiceDisplayStatus } from "@/services/financeSelectors";
import { formatCurrency, formatDate } from "@/utils/format";
import type { ProjectStatus } from "@/services/types";
import s from "@/components/crm/detail.module.css";
import p from "./ProjectDetailPage.module.css";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "timeline", label: "Timeline" },
  { value: "finance", label: "Finance" },
  { value: "links", label: "Links" },
  { value: "notes", label: "Notes" },
];

export function ProjectDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { projects, stages, tasks, activities, store } = useProjects();
  const { clients } = useCrm();
  const { invoices, payments } = useFinance();

  const project = projects.find((pr) => pr.id === id);
  const [tab, setTab] = useState("overview");
  const editModal = useDisclosure();
  const deleteConfirm = useDisclosure();
  const paymentModal = useDisclosure();
  const invoiceModal = useDisclosure();
  const taskModal = useDisclosure();
  const [reqDraft, setReqDraft] = useState(project?.requirements ?? "");
  const [notesDraft, setNotesDraft] = useState(project?.notes ?? "");
  const [linksEdit, setLinksEdit] = useState(false);
  const [links, setLinks] = useState({
    repoUrl: project?.repoUrl ?? "",
    stagingUrl: project?.stagingUrl ?? "",
    liveUrl: project?.liveUrl ?? "",
  });

  const projectStages = useMemo(
    () => stages.filter((st) => st.projectId === id),
    [stages, id],
  );
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === id), [tasks, id]);
  const projectActivities = useMemo(
    () => activities.filter((a) => a.entityId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [activities, id],
  );

  if (!project) {
    return (
      <>
        <PageHeader
          title="Project not found"
          breadcrumbs={[{ label: "Projects", to: "/projects" }, { label: "Not found" }]}
        />
        <EmptyState
          icon="search"
          title="This project doesn't exist"
          action={<Button onClick={() => navigate("/projects")}>Back to Projects</Button>}
        />
      </>
    );
  }

  const client = clients.find((c) => c.id === project.clientId);
  const clientLabel = client?.company || client?.name || "Unknown client";
  const fin = projectFinance(project.id, project.value, invoices, payments);

  return (
    <>
      <PageHeader
        title={project.name}
        breadcrumbs={[{ label: "Projects", to: "/projects" }, { label: project.name }]}
        actions={
          <>
            <Button variant="secondary" iconLeft="user" onClick={editModal.open}>
              Edit
            </Button>
            <Button variant="danger" iconLeft="close" onClick={deleteConfirm.open}>
              Delete
            </Button>
          </>
        }
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} aria-label="Project sections" />

      {/* OVERVIEW */}
      <TabPanel when="overview" value={tab}>
        <div className={s.grid}>
          <div className={s.main}>
            <Card>
              <CardHeader title="Overview" action={<ProjectStatusBadge status={project.status} />} />
              <dl className={s.fields}>
                <dt>Client</dt>
                <dd>
                  <Link to={`/clients/${project.clientId}`}>{clientLabel}</Link>
                </dd>
                <dt>Value</dt>
                <dd>{formatCurrency(project.value)}</dd>
                <dt>Start date</dt>
                <dd>{project.startDate ? formatDate(project.startDate) : "—"}</dd>
                <dt>Deadline</dt>
                <dd>{project.deadline ? formatDate(project.deadline) : "—"}</dd>
                <dt>Progress</dt>
                <dd>{project.progressPercent}%</dd>
              </dl>
              <div className={p.progressWrap}>
                <ProgressBar value={project.progressPercent} label="Overall progress" />
              </div>
            </Card>

            <Card>
              <CardHeader title="Stage" />
              <ProjectStageStrip status={project.status} />
            </Card>

            <Card>
              <CardHeader
                title="Requirements"
                action={
                  reqDraft !== (project.requirements ?? "") ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        store.updateProject(project.id, { requirements: reqDraft.trim() || undefined });
                        toast.success("Requirements saved");
                      }}
                    >
                      Save
                    </Button>
                  ) : undefined
                }
              />
              <Textarea
                label="Brief"
                value={reqDraft}
                onChange={(e) => setReqDraft(e.target.value)}
                placeholder="Short brief — pages, features, integrations…"
                rows={4}
              />
            </Card>
          </div>

          <div className={s.side}>
            <Card>
              <CardHeader title="Status" />
              <InlineSelect
                label="Move to"
                value={project.status}
                onChange={(v) => store.setStatus(project.id, v as ProjectStatus)}
                options={PROJECT_BOARD_ORDER.map((st) => ({ value: st, label: PROJECT_STATUS_LABELS[st] }))}
              />
            </Card>
            <Card>
              <CardHeader title="Payment" />
              <div className={p.payStat}>
                <span className={p.payValue}>{formatCurrency(fin.paid)}</span>
                <span className={p.payOf}>of {formatCurrency(project.value)}</span>
              </div>
              <ProgressBar
                value={project.value > 0 ? (fin.paid / project.value) * 100 : 0}
                size="sm"
                tone={fin.status === "paid" ? "success" : "crimson"}
                label="Paid vs total"
              />
              <p className={p.payHint}>{formatCurrency(fin.pending)} outstanding · {fin.label}</p>
            </Card>
          </div>
        </div>
      </TabPanel>

      {/* TASKS */}
      <TabPanel when="tasks" value={tab}>
        <Card padding="none">
          <div className={p.tabHeader}>
            <h3 className={p.tabTitle}>Tasks</h3>
            <Button size="sm" iconLeft="plus" onClick={taskModal.open}>
              Add Task
            </Button>
          </div>
          {projectTasks.length === 0 ? (
            <EmptyState compact icon="tasks" title="No tasks yet" description="Add the first task for this project." />
          ) : (
            <ul className={p.taskList}>
              {projectTasks.map((task) => {
                const done = task.status === "completed";
                const overdue = !done && task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <li key={task.id} className={p.taskItem}>
                    <button
                      type="button"
                      className={p.taskCheck}
                      data-done={done}
                      onClick={() => store.toggleTask(task.id)}
                      aria-pressed={done}
                      aria-label={done ? "Mark task incomplete" : "Mark task complete"}
                    >
                      {done && <Icon name="check" size={12} weight={3} />}
                    </button>
                    <span className={p.taskLabel} data-done={done}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className={p.taskDue} data-overdue={overdue || undefined}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className={p.footNote}>
            Full task management — priority, buckets, status — arrives with the Tasks module (Prompt 08).
          </p>
        </Card>
      </TabPanel>

      {/* TIMELINE */}
      <TabPanel when="timeline" value={tab}>
        <Card>
          <CardHeader
            title="Timeline"
            subtitle="Tap a stage to cycle: not started → in progress → done"
          />
          <ProjectTimeline stages={projectStages} onCycle={(sid) => store.cycleStage(sid)} />
        </Card>
      </TabPanel>

      {/* FINANCE */}
      <TabPanel when="finance" value={tab}>
        <div className={p.stack}>
            <Card>
              <CardHeader
                title="Money"
                action={
                  <div style={{ display: "flex", gap: "var(--s-2)" }}>
                    <Button size="sm" variant="secondary" iconLeft="plus" onClick={invoiceModal.open}>
                      Invoice
                    </Button>
                    <Button size="sm" iconLeft="plus" onClick={paymentModal.open}>
                      Record Payment
                    </Button>
                  </div>
                }
              />
              <div className={p.financeStats}>
                <div>
                  <span className={p.financeK}>Value</span>
                  <span className={p.financeV}>{formatCurrency(project.value)}</span>
                </div>
                <div>
                  <span className={p.financeK}>Paid</span>
                  <span className={p.financeV} style={{ color: "var(--success)" }}>
                    {formatCurrency(fin.paid)}
                  </span>
                </div>
                <div>
                  <span className={p.financeK}>Pending</span>
                  <span className={p.financeV} style={{ color: "var(--warning)" }}>
                    {formatCurrency(fin.pending)}
                  </span>
                </div>
              </div>
              <ProgressBar
                value={project.value > 0 ? (fin.paid / project.value) * 100 : 0}
                label="Paid vs total"
                tone={fin.status === "paid" ? "success" : "crimson"}
              />
            </Card>

            <Card padding="none">
              <div className={p.tabHeader}>
                <h3 className={p.tabTitle}>Invoices</h3>
              </div>
              {fin.invoices.length === 0 ? (
                <EmptyState compact icon="finance" title="No invoices for this project yet" />
              ) : (
                <ul className={p.financeRows}>
                  {fin.invoices.map((inv) => (
                    <li
                      key={inv.id}
                      className={p.financeRow}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/finance/invoices/${inv.id}`)}
                    >
                      <span className={p.financeRowIcon}>
                        <Icon name="finance" size={14} weight={1.9} />
                      </span>
                      <span className={p.financeRowBody}>
                        <span className={p.financeRowLabel}>{inv.invoiceNumber}</span>
                        <span className={p.financeRowMeta}>
                          Issued {formatDate(inv.issueDate)} · due {formatDate(inv.dueDate)}
                        </span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                        <InvoiceStatusBadge status={invoiceDisplayStatus(inv, payments)} />
                        <span className={p.financeRowAmount}>{formatCurrency(inv.amount)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="none">
              <div className={p.tabHeader}>
                <h3 className={p.tabTitle}>Payments</h3>
              </div>
              {fin.payments.length === 0 ? (
                <EmptyState compact icon="credit-card" title="No payments recorded yet" />
              ) : (
                <ul className={p.financeRows}>
                  {fin.payments.map((pmt) => (
                    <li key={pmt.id} className={p.financeRow}>
                      <span className={p.financeRowIcon} data-kind="Payment">
                        <Icon name="check" size={14} weight={1.9} />
                      </span>
                      <span className={p.financeRowBody}>
                        <span className={p.financeRowLabel}>{METHOD_LABELS[pmt.method]}</span>
                        <span className={p.financeRowMeta}>
                          {formatDate(pmt.paymentDate)} · {pmt.status === "completed" ? "Completed" : "Pending"}
                          {pmt.reference ? ` · ${pmt.reference}` : ""}
                        </span>
                      </span>
                      <span className={p.financeRowAmount}>{formatCurrency(pmt.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
        </div>
      </TabPanel>

      {/* LINKS */}
      <TabPanel when="links" value={tab}>
        <Card>
          <CardHeader
            title="Links"
            action={
              <Button
                size="sm"
                variant={linksEdit ? "primary" : "secondary"}
                onClick={() => {
                  if (linksEdit) {
                    store.updateProject(project.id, {
                      repoUrl: links.repoUrl.trim() || undefined,
                      stagingUrl: links.stagingUrl.trim() || undefined,
                      liveUrl: links.liveUrl.trim() || undefined,
                    });
                    toast.success("Links saved");
                  }
                  setLinksEdit((e) => !e);
                }}
              >
                {linksEdit ? "Save" : "Edit"}
              </Button>
            }
          />
          {linksEdit ? (
            <div className={p.linkForm}>
              <Input label="GitHub / repository" value={links.repoUrl} onChange={(e) => setLinks({ ...links, repoUrl: e.target.value })} placeholder="github.com/…" />
              <Input label="Staging URL" value={links.stagingUrl} onChange={(e) => setLinks({ ...links, stagingUrl: e.target.value })} placeholder="staging.example.com" />
              <Input label="Live website URL" value={links.liveUrl} onChange={(e) => setLinks({ ...links, liveUrl: e.target.value })} placeholder="example.com" />
            </div>
          ) : (
            <div className={p.linkChips}>
              <LinkChip label="Repository" icon="external-link" url={project.repoUrl} />
              <LinkChip label="Staging" icon="external-link" url={project.stagingUrl} />
              <LinkChip label="Live site" icon="external-link" url={project.liveUrl} />
            </div>
          )}
        </Card>
      </TabPanel>

      {/* NOTES */}
      <TabPanel when="notes" value={tab}>
        <div className={s.grid}>
          <div className={s.main}>
            <Card>
              <CardHeader
                title="Notes"
                subtitle={`Last updated ${formatDate(project.updatedAt)}`}
                action={
                  notesDraft !== (project.notes ?? "") ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        store.addNote(project.id, notesDraft.trim());
                        toast.success("Notes saved");
                      }}
                    >
                      Save
                    </Button>
                  ) : undefined
                }
              />
              <Textarea
                label="Free-form notes"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={6}
              />
            </Card>
          </div>
          <div className={s.side}>
            <Card>
              <CardHeader title="Activity" />
              <ActivityTimeline activities={projectActivities} emptyLabel="No activity yet" />
            </Card>
          </div>
        </div>
      </TabPanel>

      <NewProjectModal open={editModal.isOpen} onClose={editModal.close} project={project} />
      <RecordPaymentModal
        open={paymentModal.isOpen}
        onClose={paymentModal.close}
        prefill={{ projectId: project.id }}
      />
      <InvoiceFormModal
        open={invoiceModal.isOpen}
        onClose={invoiceModal.close}
        prefill={{ projectId: project.id }}
        navigateOnCreate
      />
      <AddProjectTaskModal open={taskModal.isOpen} onClose={taskModal.close} projectId={project.id} />
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onClose={deleteConfirm.close}
        onConfirm={() => {
          store.deleteProject(project.id);
          deleteConfirm.close();
          toast.success("Project deleted");
          navigate("/projects");
        }}
        title="Delete this project?"
        message="This removes the project and its stages and tasks. This can't be undone."
        confirmLabel="Delete project"
        destructive
      />
    </>
  );
}

function LinkChip({ label, url, icon }: { label: string; url?: string; icon: "external-link" }) {
  if (!url) {
    return (
      <span className={p.chipEmpty}>
        {label}: <span>Not added yet</span>
      </span>
    );
  }
  const href = url.startsWith("http") ? url : `https://${url}`;
  return (
    <a className={p.chip} href={href} target="_blank" rel="noreferrer">
      <Icon name={icon} size={13} weight={2} />
      <span>{label}</span>
      <span className={p.chipUrl}>{url}</span>
    </a>
  );
}
