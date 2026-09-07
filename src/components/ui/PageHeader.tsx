import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import styles from "./PageHeader.module.css";

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Right-aligned actions — primary action last. */
  actions?: ReactNode;
  /** Optional row below the header (tabs, filters). */
  toolbar?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions, toolbar }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <div className={styles.headingGroup}>
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
    </header>
  );
}
