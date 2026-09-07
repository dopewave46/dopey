import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { ActivityTimeline } from "@/components/ui/ActivityTimeline";
import { Menu } from "@/components/ui/Menu";
import { ClientStatusBadge } from "@/components/crm/badges";
import { ClientFormModal } from "@/components/crm/ClientFormModal";
import { ScheduleFollowUpModal } from "@/components/crm/ScheduleFollowUpModal";
import { useCrm } from "@/hooks/useCrm";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/components/feedback/ToastProvider";
import { activitiesForEntity } from "@/services/crmSelectors";
import { crmStore } from "@/services/crmStore";
import { formatDate } from "@/utils/format";
import { SAMPLE_CLIENT_CONTEXT } from "@/data/sampleCrm";
import s from "@/components/crm/detail.module.css";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "projects", label: "Projects" },
  { value: "invoices", label: "Invoices" },
  { value: "payments", label: "Payments" },
  { value: "tasks", label: "Tasks" },
  { value: "notes", label: "Notes" },
  { value: "activity", label: "Activity" },
];

export function ClientDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { clients, leads, activities } = useCrm();

  const client = clients.find((c) => c.id === id);
  const [tab, setTab] = useState("overview");
  const [notesDraft, setNotesDraft] = useState(client?.notes ?? "");
  const editModal = useDisclosure();
  const followUpModal = useDisclosure();

  const clientActivities = useMemo(
    () => (client ? activitiesForEntity(activities, client.id) : []),
    [activities, client],
  );
  const sourceLead = client?.sourceLeadId ? leads.find((l) => l.id === client.sourceLeadId) : undefined;

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

  const ctx = SAMPLE_CLIENT_CONTEXT[client.id] ?? {};

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
                {
                  label: "Add project",
                  icon: "projects",
                  onSelect: () => {
                    toast.info("Add project", "The project form opens in the Projects module.");
                    navigate("/projects");
                  },
                },
                {
                  label: "Add task",
                  icon: "tasks",
                  onSelect: () => {
                    toast.info("Add task", "The task form opens in the Tasks module.");
                    navigate("/tasks");
                  },
                },
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
                <dt>Active project</dt>
                <dd>{ctx.activeProject || "—"}</dd>
                <dt>Invoices</dt>
                <dd style={{ color: ctx.overdueInvoice ? "var(--error)" : "var(--slate)" }}>
                  {ctx.overdueInvoice ? "1 overdue" : "None overdue"}
                </dd>
              </dl>
              <p style={{ font: "var(--t-meta)", color: "var(--muted)", marginTop: "var(--s-2)" }}>
                Project and invoice data connects in Prompts 06–07.
              </p>
            </Card>
          </div>
        </div>
      </TabPanel>

      <TabPanel when="projects" value={tab}>
        <EmptyState
          icon="projects"
          title={ctx.activeProject ? `1 active project — ${ctx.activeProject}` : "No projects yet"}
          description="The full project list, progress and timeline live in the Projects module (Prompt 06)."
          action={<Button variant="secondary" onClick={() => navigate("/projects")}>Open Projects</Button>}
        />
      </TabPanel>

      <TabPanel when="invoices" value={tab}>
        <EmptyState
          icon="finance"
          title="Invoices"
          description="Invoicing for this client connects with the Finance module (Prompt 07)."
          action={<Button variant="secondary" onClick={() => navigate("/finance")}>Open Finance</Button>}
        />
      </TabPanel>

      <TabPanel when="payments" value={tab}>
        <EmptyState
          icon="credit-card"
          title="Payments"
          description="Recorded payments for this client connect with the Finance module (Prompt 07)."
          action={<Button variant="secondary" onClick={() => navigate("/finance")}>Open Finance</Button>}
        />
      </TabPanel>

      <TabPanel when="tasks" value={tab}>
        <EmptyState
          icon="tasks"
          title="Tasks"
          description="Tasks linked to this client connect with the Tasks module (Prompt 08)."
          action={<Button variant="secondary" onClick={() => navigate("/tasks")}>Open Tasks</Button>}
        />
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
    </>
  );
}
