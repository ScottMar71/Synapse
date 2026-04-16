import type { ReactElement, ReactNode } from "react";
import { useId } from "react";

import { cx } from "../internal/cx";
import styles from "./empty-state.module.css";

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  /** Optional icon or illustration (decorative — hide from AT if purely visual). */
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, children, className }: EmptyStateProps): ReactElement {
  const titleId = useId();
  return (
    <section className={cx(styles.wrap, className)} aria-labelledby={titleId}>
      {icon ? (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {description ? <div className={styles.description}>{description}</div> : null}
      {children ? <div className={styles.actions}>{children}</div> : null}
    </section>
  );
}
