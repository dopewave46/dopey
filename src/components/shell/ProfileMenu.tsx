import { Icon } from "@/components/icons/Icon";
import { Menu } from "@/components/ui/Menu";
import { useToast } from "@/components/feedback/ToastProvider";
import { AGENCY, CURRENT_ADMIN, getInitials } from "@/services/session";
import styles from "./ProfileMenu.module.css";

export function ProfileMenu() {
  const toast = useToast();

  return (
    <Menu
      align="end"
      header={
        <div className={styles.header}>
          <span className={styles.name}>{CURRENT_ADMIN.name}</span>
          <span className={styles.email}>{CURRENT_ADMIN.email}</span>
        </div>
      }
      items={[
        { label: "Profile", icon: "user", href: "/settings" },
        { label: "Account", icon: "settings", href: "/settings" },
        { label: "Settings", icon: "settings", href: "/settings" },
        {
          label: "Log out",
          icon: "logout",
          tone: "danger",
          divided: true,
          onSelect: () => toast.info("Sign-out", "Authentication is added in a later update."),
        },
      ]}
      trigger={(props) => (
        <button type="button" className={styles.trigger} {...props}>
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(CURRENT_ADMIN.name)}
          </span>
          <span className={styles.meta}>
            <span className={styles.triggerName}>{CURRENT_ADMIN.name}</span>
            <span className={styles.triggerRole}>{AGENCY.agencyName}</span>
          </span>
          <Icon name="chevron-down" size={15} className={styles.caret} />
        </button>
      )}
    />
  );
}
