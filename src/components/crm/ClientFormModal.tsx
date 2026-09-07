import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { crmStore } from "@/services/crmStore";
import { CLIENT_STATUS_META } from "@/components/ui/StatusBadge";
import type { Client, ClientStatus } from "@/services/types";
import styles from "./LeadFormModal.module.css";

export function ClientFormModal({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client: Client;
}) {
  const toast = useToast();
  const [v, setV] = useState({
    name: client.name,
    company: client.company ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    location: client.location ?? "",
    website: client.website ?? "",
    status: client.status as ClientStatus,
    notes: client.notes ?? "",
  });

  useEffect(() => {
    if (open) {
      setV({
        name: client.name,
        company: client.company ?? "",
        phone: client.phone ?? "",
        email: client.email ?? "",
        location: client.location ?? "",
        website: client.website ?? "",
        status: client.status,
        notes: client.notes ?? "",
      });
    }
  }, [open, client]);

  const set = (key: keyof typeof v, value: string) => setV((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    crmStore.updateClient(client.id, {
      name: v.name.trim(),
      company: v.company.trim() || undefined,
      phone: v.phone.trim() || undefined,
      email: v.email.trim() || undefined,
      location: v.location.trim() || undefined,
      website: v.website.trim() || undefined,
      status: v.status,
      notes: v.notes.trim() || undefined,
    });
    toast.success("Client updated", v.company || v.name);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit client"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="client-form">
            Save changes
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <Input label="Contact name" required value={v.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Company" value={v.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div className={styles.row}>
          <Input label="Phone" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label="Email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className={styles.row}>
          <Input label="Location" value={v.location} onChange={(e) => set("location", e.target.value)} />
          <Input label="Website" value={v.website} onChange={(e) => set("website", e.target.value)} />
        </div>
        <Select
          label="Status"
          value={v.status}
          onChange={(e) => set("status", e.target.value as ClientStatus)}
        >
          {Object.entries(CLIENT_STATUS_META).map(([value, m]) => (
            <option key={value} value={value}>
              {m.label}
            </option>
          ))}
        </Select>
        <Textarea label="Notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </form>
    </Modal>
  );
}
