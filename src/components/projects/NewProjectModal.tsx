import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { useCrm } from "@/hooks/useCrm";
import { projectStore, PROJECT_STATUS_LABELS, PROJECT_BOARD_ORDER } from "@/services/projectStore";
import { apiErrorMessage } from "@/utils/apiError";
import type { Project, ProjectStatus } from "@/services/types";
import styles from "@/components/crm/LeadFormModal.module.css";

export interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  /** Provide to edit an existing project. */
  project?: Project;
  /** Pre-fill from a converted lead (Prompt 05). */
  prefill?: { clientId?: string; name?: string; value?: number };
  /** Navigate to the new project on create. */
  navigateOnCreate?: boolean;
  onSaved?: (project: Project) => void;
}

interface Values {
  clientId: string;
  name: string;
  value: string;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  requirements: string;
  notes: string;
}

const emptyValues = (): Values => ({
  clientId: "",
  name: "",
  value: "",
  startDate: new Date().toISOString().slice(0, 10),
  deadline: "",
  status: "planning",
  requirements: "",
  notes: "",
});

export function NewProjectModal({
  open,
  onClose,
  project,
  prefill,
  navigateOnCreate = false,
  onSaved,
}: NewProjectModalProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const { clients } = useCrm();
  const isEdit = Boolean(project);

  const [v, setV] = useState<Values>(emptyValues);
  const [nameTouched, setNameTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setNameTouched(Boolean(project));
    if (project) {
      setV({
        clientId: project.clientId,
        name: project.name,
        value: project.value ? String(project.value) : "",
        startDate: project.startDate ? project.startDate.slice(0, 10) : "",
        deadline: project.deadline ? project.deadline.slice(0, 10) : "",
        status: project.status,
        requirements: project.requirements ?? "",
        notes: project.notes ?? "",
      });
    } else {
      setV({
        ...emptyValues(),
        clientId: prefill?.clientId ?? "",
        name: prefill?.name ?? "",
        value: prefill?.value ? String(prefill.value) : "",
      });
    }
  }, [open, project, prefill]);

  const clientName = useMemo(
    () => clients.find((c) => c.id === v.clientId)?.company || clients.find((c) => c.id === v.clientId)?.name,
    [clients, v.clientId],
  );

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onClientChange = (clientId: string) => {
    setV((prev) => {
      const next = { ...prev, clientId };
      if (!nameTouched && !isEdit) {
        const name = clients.find((c) => c.id === clientId);
        if (name) next.name = `${name.company || name.name} — Website`;
      }
      return next;
    });
    setErrors((e) => ({ ...e, clientId: undefined }));
  };

  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!v.clientId) next.clientId = "Pick the client this project is for.";
    if (!v.name.trim()) next.name = "Give the project a name.";
    if (v.value && Number.isNaN(Number(v.value.replace(/[,\s]/g, "")))) next.value = "Enter a number in rupees.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    const payload = {
      clientId: v.clientId,
      name: v.name.trim(),
      value: v.value ? Number(v.value.replace(/[,\s]/g, "")) : 0,
      startDate: v.startDate ? new Date(v.startDate).toISOString() : undefined,
      deadline: v.deadline ? new Date(v.deadline).toISOString() : undefined,
      status: v.status,
      requirements: v.requirements.trim() || undefined,
      notes: v.notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (isEdit && project) {
        const updated = await projectStore.updateProject(project.id, payload);
        toast.success("Project updated", updated.name);
        onSaved?.(updated);
      } else {
        const created = await projectStore.addProject(payload);
        toast.success("Project created", `${created.name} · ${PROJECT_STATUS_LABELS[created.status]}`);
        onSaved?.(created);
        if (navigateOnCreate) navigate(`/projects/${created.id}`);
      }
      onClose();
    } catch (err) {
      toast.error("Couldn't save the project", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit project" : "Start a new project"}
      description={
        isEdit
          ? undefined
          : clientName
            ? `Carried over from ${clientName}. Fill in the rest.`
            : "One quick form — the project starts tracking straight away."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={saving} disabled={saving}>
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className={styles.form}>
        <Select
          label="Client"
          required
          value={v.clientId}
          onChange={(e) => onClientChange(e.target.value)}
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

        <Input
          label="Project name"
          required
          value={v.name}
          onChange={(e) => {
            setNameTouched(true);
            set("name", e.target.value);
          }}
          error={errors.name}
          placeholder="e.g. Blue Fig Studio — Website"
        />

        <div className={styles.row}>
          <Input
            label="Project value (₹)"
            value={v.value}
            onChange={(e) => set("value", e.target.value)}
            error={errors.value}
            inputMode="numeric"
            placeholder="e.g. 120000"
          />
          <Select label="Initial status" value={v.status} onChange={(e) => set("status", e.target.value as ProjectStatus)}>
            {PROJECT_BOARD_ORDER.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.row}>
          <Input label="Start date" type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
          <Input label="Deadline" type="date" value={v.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </div>

        <Textarea
          label="Requirements"
          value={v.requirements}
          onChange={(e) => set("requirements", e.target.value)}
          placeholder="Short brief — pages, features, integrations…"
        />
        <Textarea label="Notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </form>
    </Modal>
  );
}
