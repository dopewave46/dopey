import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import {
  crmStore,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  LEAD_SOURCES,
  SERVICES,
} from "@/services/crmStore";
import type { Lead, LeadStage } from "@/services/types";
import styles from "./LeadFormModal.module.css";

export interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Provide to edit an existing lead; omit to create a new one. */
  lead?: Lead;
  onSaved?: (lead: Lead) => void;
}

interface FormValues {
  name: string;
  business: string;
  phone: string;
  email: string;
  location: string;
  source: string;
  serviceRequired: string;
  requirements: string;
  estimatedValue: string;
  stage: LeadStage;
  followUpDate: string;
  notes: string;
}

const EMPTY: FormValues = {
  name: "",
  business: "",
  phone: "",
  email: "",
  location: "",
  source: "",
  serviceRequired: "",
  requirements: "",
  estimatedValue: "",
  stage: "new",
  followUpDate: "",
  notes: "",
};

function toForm(lead: Lead): FormValues {
  return {
    name: lead.name ?? "",
    business: lead.business ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    location: lead.location ?? "",
    source: lead.source ?? "",
    serviceRequired: lead.serviceRequired ?? "",
    requirements: lead.requirements ?? "",
    estimatedValue: lead.estimatedValue ? String(lead.estimatedValue) : "",
    stage: lead.stage,
    followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : "",
    notes: lead.notes ?? "",
  };
}

export function LeadFormModal({ open, onClose, lead, onSaved }: LeadFormModalProps) {
  const toast = useToast();
  const isEdit = Boolean(lead);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  useEffect(() => {
    if (open) {
      setValues(lead ? toForm(lead) : EMPTY);
      setErrors({});
    }
  }, [open, lead]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Enter the contact's name.";
    if (!values.business.trim()) next.business = "Enter the business name.";
    if (!values.phone.trim()) next.phone = "A phone number keeps follow-ups easy.";
    if (values.estimatedValue && Number.isNaN(Number(values.estimatedValue.replace(/[,\s]/g, "")))) {
      next.estimatedValue = "Enter a number in rupees.";
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    const payload = {
      name: values.name.trim(),
      business: values.business.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || undefined,
      location: values.location.trim() || undefined,
      source: values.source || undefined,
      serviceRequired: values.serviceRequired || undefined,
      requirements: values.requirements.trim() || undefined,
      estimatedValue: values.estimatedValue
        ? Number(values.estimatedValue.replace(/[,\s]/g, ""))
        : undefined,
      stage: values.stage,
      followUpDate: values.followUpDate ? new Date(values.followUpDate).toISOString() : undefined,
      notes: values.notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (isEdit && lead) {
        const updated = await crmStore.updateLead(lead.id, payload);
        toast.success("Lead updated", updated.business || updated.name);
        onSaved?.(updated);
      } else {
        const created = await crmStore.addLead(payload);
        toast.success(
          "Lead added",
          `${created.business} is in the ${LEAD_STAGE_LABELS[created.stage]} column.`,
        );
        onSaved?.(created);
      }
      onClose();
    } catch (err) {
      toast.error("Couldn't save the lead", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit lead" : "Add lead"}
      description={isEdit ? undefined : "One quick form — the lead lands in your pipeline immediately."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="lead-form" loading={saving} disabled={saving}>
            {isEdit ? "Save changes" : "Save lead"}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <Input
            label="Name"
            required
            autoFocus
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Business"
            required
            value={values.business}
            onChange={(e) => set("business", e.target.value)}
            error={errors.business}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Phone"
            required
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errors.phone}
            placeholder="+91 …"
          />
          <Input
            label="Email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Location"
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Area, Mumbai"
          />
          <Select label="Lead source" value={values.source} onChange={(e) => set("source", e.target.value)}>
            <option value="">Not set</option>
            {LEAD_SOURCES.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.row}>
          <Select
            label="Service required"
            value={values.serviceRequired}
            onChange={(e) => set("serviceRequired", e.target.value)}
          >
            <option value="">Not set</option>
            {SERVICES.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </Select>
          <Input
            label="Estimated value (₹)"
            value={values.estimatedValue}
            onChange={(e) => set("estimatedValue", e.target.value)}
            error={errors.estimatedValue}
            inputMode="numeric"
            placeholder="e.g. 45000"
          />
        </div>

        <div className={styles.row}>
          <Select
            label="Stage"
            value={values.stage}
            onChange={(e) => set("stage", e.target.value as LeadStage)}
          >
            {LEAD_STAGE_ORDER.map((stage) => (
              <option key={stage} value={stage}>
                {LEAD_STAGE_LABELS[stage]}
              </option>
            ))}
          </Select>
          <Input
            label="Follow-up date"
            type="date"
            value={values.followUpDate}
            onChange={(e) => set("followUpDate", e.target.value)}
          />
        </div>

        <Textarea
          label="Requirements"
          value={values.requirements}
          onChange={(e) => set("requirements", e.target.value)}
          placeholder="Scope, pages, integrations, timeline…"
        />
        <Textarea
          label="Notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </form>
    </Modal>
  );
}
