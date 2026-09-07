import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { AGENCY, CURRENT_ADMIN } from "@/services/session";
import styles from "./SettingsPage.module.css";

/**
 * Read-only settings summary. Editing controls are added with the Settings
 * module in a later prompt; the values shown here are the locked defaults.
 */
export function SettingsPage() {
  const rows: Array<[string, string]> = [
    ["Agency name", AGENCY.agencyName],
    ["Location", AGENCY.location],
    ["Timezone", `${AGENCY.timezone} (IST, UTC+5:30)`],
    ["Currency", "Indian Rupee — ₹ (INR)"],
    ["Admin", `${CURRENT_ADMIN.name} · ${CURRENT_ADMIN.email}`],
    ["Theme", "Light (Version 1)"],
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Agency information, localisation and preferences for DopeOrca OS."
      />

      <div className={styles.grid}>
        <Card>
          <CardHeader title="Agency &amp; localisation" subtitle="Locked defaults for Version 1" />
          <dl className={styles.list}>
            {rows.map(([label, value]) => (
              <div className={styles.row} key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Preferences"
            subtitle="Notification and application preferences arrive with the Settings module"
          />
          <ul className={styles.pending}>
            <li>Notification preferences per type and renewal lead-time</li>
            <li>Default landing view and list page size</li>
            <li>Admin profile and password</li>
            <li>Invoice footer and terms</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
