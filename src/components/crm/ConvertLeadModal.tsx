import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { useDisclosure } from "@/hooks/useDisclosure";
import { crmStore } from "@/services/crmStore";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { formatCurrency } from "@/utils/format";
import type { Client, Lead } from "@/services/types";
import styles from "./LeadFormModal.module.css";

export interface ConvertLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}

/**
 * Lead → Client conversion (spec Section H). Pre-fills the client from lead
 * data — nothing is re-typed. On confirm the lead is marked Won + Converted
 * and linked; then "Create project" opens the shared project form (Prompt 06),
 * pre-filled with the client, name and estimated value.
 */
export function ConvertLeadModal({ open, onClose, lead }: ConvertLeadModalProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const projectModal = useDisclosure();
  const [phase, setPhase] = useState<"confirm" | "done">("confirm");
  const [client, setClient] = useState<Client | null>(null);

  const initial = useMemo(
    () => ({
      name: lead?.name ?? "",
      company: lead?.business ?? "",
      phone: lead?.phone ?? "",
      email: lead?.email ?? "",
      location: lead?.location ?? "",
      website: "",
      notes: lead?.notes ?? "",
    }),
    [lead],
  );
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setPhase("confirm");
      setClient(null);
    }
  }, [open, initial]);

  if (!lead) return null;

  const confirm = (e: FormEvent) => {
    e.preventDefault();
    const created = crmStore.convertLeadToClient(lead.id, {
      name: draft.name.trim(),
      company: draft.company.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      location: draft.location.trim() || undefined,
      website: draft.website.trim() || undefined,
      notes: draft.notes.trim() || undefined,
    });
    setClient(created);
    setPhase("done");
    toast.success("Lead converted", `${created.company || created.name} is now a client.`);
  };

  const set = (key: keyof typeof draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const projectName = `${lead.business || lead.name} — ${lead.serviceRequired || "Website"}`;

  return (
    <>
      {phase === "done" && client ? (
        <Modal
          open={open}
          onClose={onClose}
          title="Client created"
          description={`${client.company || client.name} is linked to this lead. What next?`}
          footer={
            <>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
              <Button
                iconLeft="arrow-right"
                onClick={() => {
                  onClose();
                  navigate(`/clients/${client.id}`);
                }}
              >
                Open client profile
              </Button>
            </>
          }
        >
          <div className={styles.form}>
            <p style={{ font: "var(--t-body)", color: "var(--slate)" }}>
              Start the project now — the client, name and value carry over from the lead.
            </p>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--r-card)",
                padding: "var(--s-3) var(--s-4)",
                background: "var(--surface-2)",
                font: "var(--t-body)",
              }}
            >
              <strong>{projectName}</strong>
              <div style={{ color: "var(--muted)", font: "var(--t-meta)", marginTop: 2 }}>
                {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "Value to be set"} · for{" "}
                {client.company || client.name}
              </div>
            </div>
            <Button variant="secondary" iconLeft="plus" onClick={projectModal.open}>
              Create project
            </Button>
          </div>
        </Modal>
      ) : (
        <Modal
          open={open}
          onClose={onClose}
          title="Convert to client"
          description="Everything is carried over from the lead. Confirm the details and save."
          footer={
            <>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form="convert-form">
                Create client
              </Button>
            </>
          }
        >
          <form id="convert-form" onSubmit={confirm} className={styles.form}>
            <div className={styles.row}>
              <Input label="Contact name" value={draft.name} onChange={(e) => set("name", e.target.value)} required />
              <Input label="Company" value={draft.company} onChange={(e) => set("company", e.target.value)} />
            </div>
            <div className={styles.row}>
              <Input label="Phone" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
              <Input label="Email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className={styles.row}>
              <Input label="Location" value={draft.location} onChange={(e) => set("location", e.target.value)} />
              <Input
                label="Website"
                value={draft.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="example.com"
              />
            </div>
          </form>
        </Modal>
      )}

      <NewProjectModal
        open={projectModal.isOpen}
        onClose={() => {
          projectModal.close();
          onClose();
        }}
        navigateOnCreate
        prefill={
          client
            ? { clientId: client.id, name: projectName, value: lead.estimatedValue }
            : undefined
        }
      />
    </>
  );
}
