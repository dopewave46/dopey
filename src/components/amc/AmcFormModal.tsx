import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { amcStore } from "@/services/amcStore";
import { AMC_SERVICES } from "@/data/sampleAmc";
import type { Amc, AmcPaymentStatus } from "@/services/types";
import styles from "@/components/crm/LeadFormModal.module.css";

export interface AmcFormModalProps {
  open: boolean;
  onClose: () => void;
  amc?: Amc;
  prefill?: { clientId?: string; projectId?: string };
  navigateOnCreate?: boolean;
}

export function AmcFormModal({ open, onClose, amc, prefill, navigateOnCreate }: AmcFormModalProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const { clients } = useCrm();
  const { projects } = useProjects();
  const isEdit = Boolean(amc);

  const [v, setV] = useState({
    clientId: "",
    projectId: "",
    service: AMC_SERVICES[0] as string,
    startDate: "",
    renewalDate: "",
    hostingRenewalDate: "",
    paymentStatus: "due" as AmcPaymentStatus,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (amc) {
      setV({
        clientId: amc.clientId,
        projectId: amc.projectId ?? "",
        service: amc.service,
        startDate: amc.startDate.slice(0, 10),
        renewalDate: amc.renewalDate.slice(0, 10),
        hostingRenewalDate: amc.hostingRenewalDate ? amc.hostingRenewalDate.slice(0, 10) : "",
        paymentStatus: amc.paymentStatus,
        notes: amc.notes ?? "",
      });
    } else {
      const today = new Date();
      const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      setV({
        clientId: prefill?.clientId ?? "",
        projectId: prefill?.projectId ?? "",
        service: AMC_SERVICES[0],
        startDate: today.toISOString().slice(0, 10),
        renewalDate: nextYear.toISOString().slice(0, 10),
        hostingRenewalDate: "",
        paymentStatus: "due",
        notes: "",
      });
    }
  }, [open, amc, prefill]);

  const set = (key: keyof typeof v, value: string) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const clientProjects = projects.filter((p) => p.clientId === v.clientId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!v.clientId) next.clientId = "Pick the client this plan is for.";
    if (!v.service.trim()) next.service = "Name the service.";
    if (!v.startDate) next.startDate = "Pick a start date.";
    if (!v.renewalDate) next.renewalDate = "Pick a renewal date.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    const payload = {
      clientId: v.clientId,
      projectId: v.projectId || undefined,
      service: v.service.trim(),
      startDate: new Date(v.startDate).toISOString(),
      renewalDate: new Date(v.renewalDate).toISOString(),
      hostingRenewalDate: v.hostingRenewalDate ? new Date(v.hostingRenewalDate).toISOString() : undefined,
      paymentStatus: v.paymentStatus,
      notes: v.notes.trim() || undefined,
    };
    if (isEdit && amc) {
      amcStore.updateAmc(amc.id, payload);
      toast.success("Plan updated");
    } else {
      const created = amcStore.addAmc(payload);
      toast.success("Maintenance plan added");
      if (navigateOnCreate) navigate(`/amc/${created.id}`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit maintenance plan" : "Add maintenance plan"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="amc-form">
            {isEdit ? "Save changes" : "Save plan"}
          </Button>
        </>
      }
    >
      <form id="amc-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <Select
            label="Client"
            required
            value={v.clientId}
            onChange={(e) => {
              set("clientId", e.target.value);
              setV((prev) => ({ ...prev, projectId: "" }));
            }}
            error={errors.clientId}
            disabled={isEdit}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </Select>
          <Select label="Project" value={v.projectId} onChange={(e) => set("projectId", e.target.value)}>
            <option value="">No project</option>
            {clientProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <Select label="Service" value={v.service} onChange={(e) => set("service", e.target.value)} error={errors.service}>
          {AMC_SERVICES.map((svc) => (
            <option key={svc} value={svc}>
              {svc}
            </option>
          ))}
        </Select>

        <div className={styles.row}>
          <Input label="Start date" type="date" required value={v.startDate} onChange={(e) => set("startDate", e.target.value)} error={errors.startDate} />
          <Input label="Renewal date" type="date" required value={v.renewalDate} onChange={(e) => set("renewalDate", e.target.value)} error={errors.renewalDate} />
        </div>

        <div className={styles.row}>
          <Input
            label="Hosting renewal date"
            type="date"
            value={v.hostingRenewalDate}
            onChange={(e) => set("hostingRenewalDate", e.target.value)}
          />
          <Select
            label="Payment status"
            value={v.paymentStatus}
            onChange={(e) => set("paymentStatus", e.target.value as AmcPaymentStatus)}
          >
            <option value="paid">Paid</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>

        <Textarea label="Notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </form>
    </Modal>
  );
}
