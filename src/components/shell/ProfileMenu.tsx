import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import { Menu } from "@/components/ui/Menu";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAuth } from "@/services/auth";
import { AGENCY, getInitials } from "@/services/session";

import styles from "./ProfileMenu.module.css";

export function ProfileMenu() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const name = user?.name ?? "Admin";
  const email = user?.email ?? "";

  const handleLogout = async () => {
    await logout();
    toast.info("Signed out", "You've been logged out.");
    navigate("/login", { replace: true });
  };

  return (
    <Menu
      align="end"
      header={
        <div className={styles.header}>
          <span className={styles.name}>{name}</span>
          <span className={styles.email}>{email}</span>
        </div>
      }
      items={[
        { label: "Profile", icon: "user", href: "/settings" },
        { label: "Settings", icon: "settings", href: "/settings" },
        {
          label: "Log out",
          icon: "logout",
          tone: "danger",
          divided: true,
          onSelect: () => void handleLogout(),
        },
      ]}
      trigger={(props) => (
        <button type="button" className={styles.trigger} {...props}>
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(name)}
          </span>
          <span className={styles.meta}>
            <span className={styles.triggerName}>{name}</span>
            <span className={styles.triggerRole}>{AGENCY.agencyName}</span>
          </span>
          <Icon name="chevron-down" size={15} className={styles.caret} />
        </button>
      )}
    />
  );
}
