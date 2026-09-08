import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { ActivityTimeline } from "@/components/ui/ActivityTimeline";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Menu } from "@/components/ui/Menu";
import { Icon } from "@/components/icons/Icon";
import { ClientStatusBadge } from "@/components/crm/badges";
import { ClientFormModal } from "@/components/crm/ClientFormModal";
import { ScheduleFollowUpModal } from "@/components/crm/ScheduleFollowUpModal";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { ProjectStatusBadge } from "@/components/projects/badges";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { InvoiceStatusBadge } from "@/components/finance/badges";
import { InvoiceFormModal } from "@/components/finance/InvoiceFormModal";
import { RecordPaymentModal } from "@/components/finance/RecordPaymentModal";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/components/feedback/ToastProvider";
import { activitiesForEntity } from "@/services/crmSelectors";
import { projectsForClient, isActiveStatus } from "@/services/projectSelectors";
import { clientFinance, invoiceDisplayStatus } from "@/services/financeSelectors";
import { METHOD_LABELS } from "@/services/financeStore";
import { crmStore } from "@/services/crmStore";
import { formatCurrency, formatDate } from "@/utils/format";
import s from "@/components/crm/detail.module.css";
import cs from "./ClientDetailPage.module.css";
import p from "@/pages/ProjectDetailPage.module.css";

export function ClientDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { clients, leads, activities } = useCrm();
  const { projects } = useProjects();
  const { tasks, store: taskStore } = useTasks();

  const client = clients.find((c) => c.id === id);
  const [tab, setTab] = useState("overview");
  const [notesDraft, setNotesDraft] = useState(client?.notes ?? "");
  const editModal = useDisclosure();
  const followUpModal = useDisclosure();
  const projectModal = useDisclosure();
  const taskModal = useDisclosure();

  const clientTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.clientId === id)
        .sort((a, b) => (a.status === b.status ? 0 : a.status === "completed" ? 1 : -1)),
    [tasks, id],
  );

  const clientActivities = useMemo(
    () => (client ? activitiesForEntity(activities, client.id) : []),
    [activities, client],
  );
  const { invoices, payments } = useFinance();
  const invoiceModal = useDisclosure();
  const paymentModal = useDisclosure();

  const clientProjects = useMemo(() => projectsForClient(projects, id), [projects, id]);
  const activeProject = clientProjects.find((pr) => isActiveStatus(pr.status));
  const fin = useMemo(() => clientFinance(id, invoices, payments), [id, invoices, payments]);
  const sourceLead = client?.sourceLeadId ? leads.find((l) => l.id === client.sourceLeadId) : undefined;

  const TABS = [
    { value: "overview", label: "Overview" },
    { value: "projects", label: "Projects", count: clientProjects.length },
    { value: "invoices", label: "Invoices", count: fin.invoices.length },
    { value: "payments", label: "Payments", count: fin.payments.length },
    { value: "tasks", label: "Tasks", count: clientTasks.length },
    { value: "notes", label: "Notes" },
    { value: "activity", label: "Activity" },
  ];

  if (!client) {
    return (
      <>
        <PageHeader
          title="Client not found"
          breadcrumbs={[{ label: "Clients", to: "/clients" }, { label: "Not found" }]}
        />
        <EmptyState
          icon="search"
          title="This client doesn't exist"
          action={<Button onClick={() => navigate("/clients")}>Back to Clients</Button>}
        />
      </>
    );
  }

  const saveNotes = () => {
    crmStore.updateClient(client.id, { notes: notesDraft.trim() || undefined });
    toast.success("Notes saved");
  };

  return (
    <>
      <PageHeader
        title={client.company || client.name}
        breadcrumbs={[{ label: "Clients", to: "/clients" }, { label: client.company || client.name }]}
        actions={
          <>
            <Button variant="secondary" iconLeft="user" onClick={editModal.open}>
              Edit client
            </Button>
            <Menu
              align="end"
              items={[
                { label: "Add project", icon: "projects", onSelect: projectModal.open },
                { label: "Add task", icon: "tasks", onSelect: taskModal.open },
                { label: "Schedule follow-up", icon: "calendar", onSelect: followUpModal.open },
                { label: "Add note", icon: "clock", onSelect: () => setTab("notes") },
              ]}
              trigger={(props) => (
                <Button variant="secondary" iconRight="chevron-down" {...props}>
                  Actions
                </Button>
              )}
            />
          </>
        }
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} aria-label="Client sections" />

      <TabPanel when="overview" value={tab}>
        <div className={s.grid}>
          <div className={s.main}>
            <Card>
              <CardHeader title="Client details" action={<ClientStatusBadge status={client.status} />} />
              <dl className={s.fields}>
                <dt>Contact</dt>
                <dd>{client.name}</dd>
                <dt>Company</dt>
                <dd>{client.company || "—"}</dd>
                <dt>Phone</dt>
                <dd>{client.phone || "—"}</dd>
                <dt>Email</dt>
                <dd>{client.email || "—"}</dd>
                <dt>Location</dt>
                <dd>{client.location || "—"}</dd>
                <dt>Website</dt>
                <dd>
                  {client.website ? (
                    <a href={`https://${client.website}`} target="_blank" rel="noreferrer">
                      {client.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>Client since</dt>
                <dd>{formatDate(client.createdAt)}</dd>
              </dl>
            </Card>
          </div>
          <div className={s.side}>
            <Card>
              <CardHeader title="Origin" />
              {sourceLead ? (
                <p className={s.prose}>
                  Converted from lead{" "}
                  <a href={`/leads/${sourceLead.id}`} onClick={(e) => { e.preventDefault(); navigate(`/leads/${sourceLead.id}`); }}>
                    {sourceLead.business || sourceLead.name}
                  </a>{" "}
                  · {formatDate(sourceLead.createdAt)}
                </p>
              ) : (
                <p className={s.prose}>Added directly (no source lead recorded).</p>
              )}
            </Card>
            <Card>
              <CardHeader title="Snapshot" />
              <dl className={s.fields}>
                <dt>Projects</dt>
                <dd>{clientProjects.length === 0 ? "None yet" : `${clientProjects.length} total`}</dd>
                <dt>Active project</dt>
                <dd>
                  {activeProject ? (
                    <button className={cs.linkBtn} onClick={() => navigate(`/projects/${activeProject.id}`)}>
                      {activeProject.name}
                    </button>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>Invoiced</dt>
                <dd>{formatCurrency(fin.invoiced)}</dd>
                <dt>Received</dt>
                <dd style={{ color: "var(--success)" }}>{formatCurrency(fin.received)}</dd>
                <dt>Outstanding</dt>
                <dd style={{ color: fin.hasOverdue ? "var(--error)" : "var(--slate)" }}>
                  {formatCurrency(fin.pending)}
                  {fin.hasOverdue ? " · overdue" : ""}
                </dd>
              </dl>
            </Card>
          </div>
        </div>
      </TabPanel>

      <TabPanel when="projects" value={tab}>
        {clientProjects.length === 0 ? (
          <EmptyState
            icon="projects"
            title="No projects yet"
            description="Start a project for this client to begin tracking work."
            action={
              <Button iconLeft="plus" onClick={projectModal.open}>
                Start a project
              </Button>
            }
          />
        ) : (
          <Card padding="none">
            <ul className={cs.projectList}>
              {clientProjects.map((proj) => (
                <li key={proj.id}>
                  <button className={cs.projectRow} onClick={() => navigate(`/projects/${proj.id}`)}>
                    <span className={cs.projectMain}>
                      <span className={cs.projectName}>{proj.name}</span>
                      <span className={cs.projectMeta}>
                        {formatCurrency(proj.value)}
                        {proj.deadline ? ` · due ${formatDate(proj.deadline)}` : ""}
                      </span>
                      <span className={cs.projectBar}>
                        <ProgressBar value={proj.progressPercent} size="sm" label={`${proj.name} progress`} />
                      </span>
                    </span>
                    <span className={cs.projectRight}>
                      <ProjectStatusBadge status={proj.status} />
                      <span className={cs.projectPct}>{proj.progressPercent}%</span>
                      <Icon name="chevron-right" size={16} className={cs.chev} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </TabPanel>

      <TabPanel when="invoices" value={tab}>
        {fin.invoices.length === 0 ? (
          <EmptyState
            icon="finance"
            title="No invoices yet"
            description="Create an invoice for one of this client's projects."
            action={
              <Button iconLeft="plus" onClick={invoiceModal.open}>
                Create Invoice
              </Button>
            }
          />
        ) : (
          <Card padding="none">
            <div className={p.tabHeader}>
              <h3 className={p.tabTitle}>
                {formatCurrency(fin.invoiced)} invoiced · {formatCurrency(fin.pending)} outstanding
              </h3>
              <Button size="sm" iconLeft="plus" onClick={invoiceModal.open}>
                Create Invoice
              </Button>
            </div>
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
          </Card>
        )}
      </TabPanel>

      <TabPanel when="payments" value={tab}>
        {fin.payments.length === 0 ? (
          <EmptyState
            icon="credit-card"
            title="No payments recorded yet"
            description="Record a payment against one of this client's invoices."
            action={
              <Button iconLeft="plus" onClick={paymentModal.open}>
                Record Payment
              </Button>
            }
          />
        ) : (
          <Card padding="none">
            <div className={p.tabHeader}>
              <h3 className={p.tabTitle}>{formatCurrency(fin.received)} received</h3>
              <Button size="sm" iconLeft="plus" onClick={paymentModal.open}>
                Record Payment
              </Button>
            </div>
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
                    </span>
                  </span>
                  <span className={p.financeRowAmount}>{formatCurrency(pmt.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </TabPanel>

      <TabPanel when="tasks" value={tab}>
        {clientTasks.length === 0 ? (
          <EmptyState
            icon="tasks"
            title="No tasks yet"
            description="Add a task linked to this client."
            action={
              <Button iconLeft="plus" onClick={taskModal.open}>
                Add Task
              </Button>
            }
          />
        ) : (
          <Card padding="none">
            <div className={p.tabHeader}>
              <h3 className={p.tabTitle}>
                {clientTasks.filter((t) => t.status !== "completed").length} open · {clientTasks.length} total
              </h3>
              <Button size="sm" iconLeft="plus" onClick={taskModal.open}>
                Add Task
              </Button>
            </div>
            <ul className={p.taskList}>
              {clientTasks.map((t) => {
                const done = t.status === "completed";
                return (
                  <li key={t.id} className={p.taskItem}>
                    <button
                      type="button"
                      className={p.taskCheck}
                      data-done={done}
                      onClick={() => taskStore.toggleTask(t.id)}
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                    >
                      {done && <Icon name="check" size={12} weight={3} />}
                    </button>
                    <span className={p.taskLabel} data-done={done}>
                      {t.title}
                    </span>
                    {t.projectId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${t.projectId}`)}
                        style={{ border: 0, background: "transparent", font: "var(--t-meta)", color: "var(--muted)", cursor: "pointer" }}
                      >
                        {projects.find((pr) => pr.id === t.projectId)?.name}
                      </button>
                    )}
                    {t.dueDate && <span className={p.taskDue}>{formatDate(t.dueDate)}</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </TabPanel>

      <TabPanel when="notes" value={tab}>
        <Card>
          <CardHeader title="Notes" />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
            <Textarea
              label="Free-form notes"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Anything worth remembering about this client…"
              rows={6}
            />
            <div>
              <Button onClick={saveNotes} disabled={notesDraft === (client.notes ?? "")}>
                Save notes
              </Button>
            </div>
          </div>
        </Card>
      </TabPanel>

      <TabPanel when="activity" value={tab}>
        <Card>
          <CardHeader title="Activity" subtitle="Events across this client's record" />
          <ActivityTimeline activities={clientActivities} emptyLabel="No activity yet for this client" />
        </Card>
      </TabPanel>

      <ClientFormModal open={editModal.isOpen} onClose={editModal.close} client={client} />
      <ScheduleFollowUpModal
        open={followUpModal.isOpen}
        onClose={followUpModal.close}
        parentType="client"
        parentId={client.id}
        parentName={client.company || client.name}
      />
      <NewProjectModal
        open={projectModal.isOpen}
        onClose={projectModal.close}
        navigateOnCreate
        prefill={{ clientId: client.id, name: `${client.company || client.name} — Website` }}
      />
      <InvoiceFormModal
        open={invoiceModal.isOpen}
        onClose={invoiceModal.close}
        prefill={{ clientId: client.id, projectId: activeProject?.id }}
        navigateOnCreate
      />
      <RecordPaymentModal
        open={paymentModal.isOpen}
        onClose={paymentModal.close}
        prefill={{ clientId: client.id }}
      />
      <TaskFormModal
        open={taskModal.isOpen}
        onClose={taskModal.close}
        prefill={{ clientId: client.id, projectId: activeProject?.id }}
      />
    </>
  );
}
