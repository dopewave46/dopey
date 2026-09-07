import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/icons/Icon";
import type { Crumb } from "@/components/ui/Breadcrumbs";
import styles from "./PlaceholderModule.module.css";

export interface PlaceholderModuleProps {
  title: string;
  description: string;
  icon: IconName;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  /** What this module will do once built — from the Master Product Specification. */
  planned: string[];
}

export function PlaceholderModule({
  title,
  description,
  icon,
  breadcrumbs,
  actions,
  planned,
}: PlaceholderModuleProps) {
  return (
    <>
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} actions={actions} />

      <Card size="lg" className={styles.panel}>
        <span className={styles.icon}>
          <Icon name={icon} size={24} weight={1.7} />
        </span>
        <h2 className={styles.heading}>This module is next in line</h2>
        <p className={styles.sub}>
          The application shell, navigation, and design system are in place. {title} is built on top of
          this foundation in a following update.
        </p>
        <ul className={styles.list}>
          {planned.map((item) => (
            <li key={item}>
              <Icon name="check" size={14} weight={2.2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
