import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityTimeline } from "@/components/ui/ActivityTimeline";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LeadStageBadge } from "@/components/crm/badges";
import { LeadFormModal } from "@/components/crm/LeadFormModal";
import { ConvertLeadModal } from "@/components/crm/ConvertLeadModal";
import { useCrm } from "@/hooks/useCrm";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/components/feedback/ToastProvider";
import { activitiesForEntity } from "@/services/crmSelectors";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/services/crmStore";
import { formatCurrency, formatDate } from "@/utils/format";
import type { LeadStage } from "@/services/types";
import s from "@/components/crm/detail.module.css";

export function LeadDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { leads, followUps, activities, clients, store } = useCrm();

  const lead = leads.find((l) => l.id === id);
  const editModal = useDisclosure();
  const convertModal = useDisclosure();
  const archiveConfirm = useDisclosure();
  const [callNote, setCallNote] = useState("");

  const leadActivities = useMemo(
    () => (lead ? activitiesForEntity(activities, lead.id) : []),
    [activities, lead],
  );
  const leadFollowUps = useMemo(
    () =>
      lead
        ? followUps
            .filter((f) => f.parentType === "lead" && f.parentId === lead.id && f.status === "pending")
            .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
        : [],
    [followUps, lead],
  );

  if (!lead) {
    return (
      <>
        <PageHeader title="Lead not found" breadcrumbs={[{ label: "Leads", to: "/leads" }, { label: "Not found" }]} />
        <EmptyState
          icon="search"
          title="This lead doesn't exist"
          description="It may have been removed. Head back to your pipeline."
          action={<Button onClick={() => navigate("/leads")}>Back to Leads</Button>}
        />
      </>
    );
  }

  const convertedClient = lead.convertedClientId
    ? clients.find((c) => c.id === lead.convertedClientId)
    : undefined;

  const logCall = () => {
    if (!callNote.trim()) return;
    store.logLeadNote(lead.id, callNote.trim());
    setCallNote("");
    toast.success("Call logged");
  };

  return (
    <>
      <PageHeader
        title={lead.business || lead.name}
        breadcrumbs={[{ label: "Leads", to: "/leads" }, { label: lead.business || lead.name }]}
        actions={
          <>
            <Button variant="secondary" iconLeft="user" onClick={editModal.open}>
              Edit
            </Button>
            {lead.stage === "won" && !convertedClient && (
              <Button iconLeft="arrow-right" onClick={convertModal.open}>
                Convert to Client
              </Button>
            )}
            {convertedClient && (
              <Button iconLeft="building" onClick={() => navigate(`/clients/${convertedClient.id}`)}>
                Open client
              </Button>
            )}
          </>
        }
      />

      <div className={s.grid}>
        <div className={s.main}>
          <Card>
            <CardHeader
              title="Lead details"
              action={<LeadStageBadge stage={lead.stage} />}
            />
            <dl className={s.fields}>
              <dt>Contact</dt>
              <dd>{lead.name}</dd>
              <dt>Phone</dt>
              <dd>{lead.phone || "—"}</dd>
              <dt>Email</dt>
              <dd>{lead.email || "—"}</dd>
              <dt>Location</dt>
              <dd>{lead.location || "—"}</dd>
              <dt>Source</dt>
              <dd>{lead.source || "—"}</dd>
              <dt>Service</dt>
              <dd>{lead.serviceRequired || "—"}</dd>
              <dt>Est. value</dt>
              <dd>{lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "—"}</dd>
              <dt>Added</dt>
              <dd>{formatDate(lead.createdAt)}</dd>
            </dl>
          </Card>

          {lead.requirements && (
            <Card>
              <CardHeader title="Requirements" />
              <p className={s.prose}>{lead.requirements}</p>
            </Card>
          )}

          {lead.notes && (
            <Card>
              <CardHeader title="Notes" />
              <p className={s.prose}>{lead.notes}</p>
            </Card>
          )}

          <Card>
            <CardHeader title="Activity" />
            <ActivityTimeline activities={leadActivities} emptyLabel="No activity logged yet" />
          </Card>
        </div>

        <div className={s.side}>
          <Card>
            <CardHeader title="Stage" />
            <InlineSelect
              label="Move to"
              value={lead.stage}
              onChange={(v) => {
                const next = v as LeadStage;
                if (next === "won" && !convertedClient) {
                  convertModal.open();
                } else {
                  store.setLeadStage(lead.id, next);
                }
              }}
              options={LEAD_STAGE_ORDER.map((st) => ({ value: st, label: LEAD_STAGE_LABELS[st] }))}
            />
          </Card>

          <Card>
            <CardHeader title="Log a call / follow-up" />
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <Textarea
                label="What happened?"
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="Spoke to the owner, sending a revised quote…"
              />
              <Button variant="secondary" iconLeft="check" onClick={logCall} disabled={!callNote.trim()}>
                Log it
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Follow-up schedule" />
            {leadFollowUps.length === 0 ? (
              <EmptyState compact icon="calendar" title="Nothing scheduled" />
            ) : (
              <div className={s.followList}>
                {leadFollowUps.map((fu) => {
                  const overdue = new Date(fu.dueDate) < new Date();
                  return (
                    <div key={fu.id} className={s.followItem} data-overdue={overdue}>
                      <span className={s.followDue}>{formatDate(fu.dueDate)}</span>
                      <span className={s.followNote}>{fu.note}</span>
                      <div className={s.followActions}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            store.completeFollowUp(fu.id);
                            toast.success("Follow-up done");
                          }}
                        >
                          Mark done
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Danger zone" />
            <Button variant="danger" fullWidth iconLeft="close" onClick={archiveConfirm.open}>
              Archive lead
            </Button>
          </Card>
        </div>
      </div>

      <LeadFormModal open={editModal.isOpen} onClose={editModal.close} lead={lead} />
      <ConvertLeadModal open={convertModal.isOpen} onClose={convertModal.close} lead={lead} />
      <ConfirmDialog
        open={archiveConfirm.isOpen}
        onClose={archiveConfirm.close}
        onConfirm={() => {
          store.archiveLead(lead.id);
          archiveConfirm.close();
          toast.success("Lead archived");
          navigate("/leads");
        }}
        title="Archive this lead?"
        message="The lead is hidden from your pipeline but kept for reporting. You can't undo this from the UI yet."
        confirmLabel="Archive lead"
        destructive
      />
    </>
  );
}
