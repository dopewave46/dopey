import { Link } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import styles from "./ViewAllLink.module.css";

/** Tertiary "View all …" navigation link — design-system tertiary treatment. */
export function ViewAllLink({ to, children = "View all" }: { to: string; children?: React.ReactNode }) {
  return (
    <Link to={to} className={styles.link}>
      {children}
      <Icon name="arrow-right" size={14} weight={2.1} />
    </Link>
  );
}
