import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/icons/Icon";
import { AmcStatusBadge, AmcPaymentBadge } from "@/components/amc/badges";
import { AmcFormModal } from "@/components/amc/AmcFormModal";
import { useAmc } from "@/hooks/useAmc";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/components/feedback/ToastProvider";
import { run } from "@/utils/runAction";
import { daysUntil } from "@/services/amcSelectors";
import { formatDate } from "@/utils/format";
import s from "@/components/crm/detail.module.css";
import p from "./ProjectDetailPage.module.css";

export function AmcDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { amcs, amcTasks, store } = useAmc();
  const { clients } = useCrm();
  const { projects } = useProjects();

  const amc = amcs.find((a) => a.id === id);
  const editModal = useDisclosure();
  const deleteConfirm = useDisclosure();
  const [newTask, setNewTask] = useState("");

  const tasks = useMemo(
    () => amcTasks.filter((t) => t.amcId === id).sort((a, b) => (a.status === b.status ? 0 : a.status === "done" ? 1 : -1)),
    [amcTasks, id],
  );

  if (!amc) {
    return (
      <>
        <PageHeader
          title="Plan not found"
          breadcrumbs={[{ label: "Maintenance / AMC", to: "/amc" }, { label: "Not found" }]}
        />
        <EmptyState
          icon="search"
          title="This maintenance plan doesn't exist"
          action={<Button onClick={() => navigate("/amc")}>Back to Maintenance</Button>}
        />
      </>
    );
  }

  const client = clients.find((c) => c.id === amc.clientId);
  const project = projects.find((pr) => pr.id === amc.projectId);
  const renewalDays = daysUntil(amc.renewalDate);

  return (
    <>
      <PageHeader
        title={`${client?.company || client?.name || "Client"} — ${amc.service}`}
        breadcrumbs={[
          { label: "Maintenance / AMC", to: "/amc" },
          { label: `${client?.company || client?.name || "Client"} — ${amc.service}` },
        ]}
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

      <div className={s.grid}>
        <div className={s.main}>
          <Card>
            <CardHeader
              title="Contract"
              action={
                <span style={{ display: "flex", gap: "var(--s-2)" }}>
                  <AmcStatusBadge amc={amc} />
                  <AmcPaymentBadge status={amc.paymentStatus} />
                </span>
              }
            />
            <dl className={s.fields}>
              <dt>Client</dt>
              <dd>
                <Link to={`/clients/${amc.clientId}`}>{client?.company || client?.name || "—"}</Link>
              </dd>
              <dt>Project</dt>
              <dd>{project ? <Link to={`/projects/${project.id}`}>{project.name}</Link> : "—"}</dd>
              <dt>Service</dt>
              <dd>{amc.service}</dd>
              <dt>Start date</dt>
              <dd>{formatDate(amc.startDate)}</dd>
              <dt>Renewal date</dt>
              <dd style={{ color: renewalDays < 0 ? "var(--error)" : renewalDays <= 30 ? "var(--warning)" : undefined }}>
                {formatDate(amc.renewalDate)} ·{" "}
                {renewalDays < 0 ? `${Math.abs(renewalDays)} days ago` : `in ${renewalDays} days`}
              </dd>
              <dt>Hosting renewal</dt>
              <dd>{amc.hostingRenewalDate ? formatDate(amc.hostingRenewalDate) : "—"}</dd>
            </dl>
            {amc.notes && <p className={s.prose} style={{ marginTop: "var(--s-3)" }}>{amc.notes}</p>}
          </Card>

          <Card padding="none">
            <div className={p.tabHeader}>
              <h3 className={p.tabTitle}>Maintenance checklist</h3>
            </div>
            <div style={{ padding: "var(--s-3) var(--s-4)", borderBottom: "1px solid var(--border)", display: "flex", gap: "var(--s-2)", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Add checklist item"
                  placeholder="e.g. Quarterly backup verification"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTask.trim()) {
                      void run(store.addTask(amc.id, newTask.trim()), toast, "Couldn't add the item");
                      setNewTask("");
                    }
                  }}
                />
              </div>
              <Button
                variant="secondary"
                iconLeft="plus"
                onClick={() => {
                  if (newTask.trim()) {
                    void run(store.addTask(amc.id, newTask.trim()), toast, "Couldn't add the item");
                    setNewTask("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            {tasks.length === 0 ? (
              <EmptyState compact icon="tasks" title="No checklist items yet" />
            ) : (
              <ul className={p.taskList}>
                {tasks.map((t) => (
                  <li key={t.id} className={p.taskItem}>
                    <button
                      type="button"
                      className={p.taskCheck}
                      data-done={t.status === "done"}
                      onClick={() => void run(store.toggleTask(t.id), toast, "Couldn't update the item")}
                      aria-label={t.status === "done" ? "Mark incomplete" : "Mark complete"}
                    >
                      {t.status === "done" && <Icon name="check" size={12} weight={3} />}
                    </button>
                    <span className={p.taskLabel} data-done={t.status === "done"}>
                      {t.title}
                    </span>
                    {t.dueDate && <span className={p.taskDue}>{formatDate(t.dueDate)}</span>}
                    <button
                      type="button"
                      aria-label="Delete item"
                      onClick={() => void run(store.deleteTask(t.id), toast, "Couldn't delete the item")}
                      style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer", padding: 4 }}
                    >
                      <Icon name="close" size={13} weight={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className={s.side}>
          <Card>
            <CardHeader title="Renewal" />
            <p className={s.prose}>
              Started {formatDate(amc.startDate)}. Next renewal {formatDate(amc.renewalDate)}.
            </p>
            <p style={{ font: "var(--t-meta)", color: "var(--muted)", marginTop: "var(--s-2)" }}>
              {amc.hostingRenewalDate
                ? `Hosting renews ${formatDate(amc.hostingRenewalDate)}.`
                : "No separate hosting renewal date set."}
            </p>
          </Card>
        </div>
      </div>

      <AmcFormModal open={editModal.isOpen} onClose={editModal.close} amc={amc} />
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onClose={deleteConfirm.close}
        onConfirm={() => {
          void run(store.deleteAmc(amc.id), toast, "Couldn't delete the plan").then((ok) => {
            deleteConfirm.close();
            if (ok) {
              toast.success("Plan deleted");
              navigate("/amc");
            }
          });
        }}
        title="Delete this maintenance plan?"
        message="The contract and its checklist will be removed. This can't be undone."
        confirmLabel="Delete plan"
        destructive
      />
    </>
  );
}
