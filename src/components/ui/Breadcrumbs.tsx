import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import styles from "./Breadcrumbs.module.css";

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Only render when there is genuine depth (2+ crumbs). Top-level pages should
 * pass nothing and rely on the page title alone (Prompt 03 §13).
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((crumb, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              <li className={styles.item}>
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className={styles.link}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className={styles.current}>
                    {crumb.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className={styles.sep}>
                  <Icon name="chevron-right" size={13} weight={2} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
