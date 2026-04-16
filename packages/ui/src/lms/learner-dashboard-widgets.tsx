import type { ReactElement, ReactNode } from "react";

import { cx } from "../internal/cx";
import styles from "./learner-dashboard-widgets.module.css";

export type DashboardNumericStat = {
  id: string;
  /** Visible number or percent — chart-friendly tabular display. */
  value: string;
  label: string;
  caption?: string;
};

export type DashboardNumericSummaryRowProps = {
  /** Screen reader heading for the summary region. */
  title?: string;
  items: DashboardNumericStat[];
  className?: string;
};

/**
 * Compact numeric KPIs for learner home and chart legends.
 * Prefer `value` as pre-formatted strings so callers control locale and units.
 */
export function DashboardNumericSummaryRow({
  title = "Summary",
  items,
  className,
}: DashboardNumericSummaryRowProps): ReactElement {
  return (
    <section className={cx(styles.section, className)} aria-labelledby="dash-num-summary-title">
      <h2 id="dash-num-summary-title" className={styles.srOnly}>
        {title}
      </h2>
      <ul className={styles.summaryGrid}>
        {items.map((item) => (
          <li key={item.id} className={styles.summaryCard}>
            <p className={styles.summaryValue}>{item.value}</p>
            <p className={styles.summaryLabel}>{item.label}</p>
            {item.caption ? <p className={styles.summaryCaption}>{item.caption}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export type ContinueLearningItem = {
  id: string;
  title: string;
  meta: string;
  /** Primary CTA — pass app `<Link>` or `<Button>`. */
  action: ReactNode;
};

export type ContinueLearningRowProps = {
  title?: string;
  description?: ReactNode;
  items: ContinueLearningItem[];
  className?: string;
};

/** Responsive row of “continue learning” tiles for the learner dashboard. */
export function ContinueLearningRow({
  title = "Continue learning",
  description,
  items,
  className,
}: ContinueLearningRowProps): ReactElement {
  return (
    <section className={cx(styles.section, className)} aria-labelledby="continue-learning-title">
      <h2 id="continue-learning-title" className={styles.sectionTitle}>
        {title}
      </h2>
      {description ? <div className={styles.sectionDescription}>{description}</div> : null}
      <ul className={styles.continueRow}>
        {items.map((item) => (
          <li key={item.id} className={styles.continueCard}>
            <div className={styles.continueBody}>
              <h3 className={styles.continueTitle}>{item.title}</h3>
              <p className={styles.continueMeta}>{item.meta}</p>
            </div>
            <div className={styles.continueActions}>{item.action}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type LearnerDeadlineItem = {
  id: string;
  title: string;
  /** Pre-formatted due date/time for the learner locale. */
  dueLabel: string;
  /** When true, due copy uses warning emphasis (not color-only — paired with clear text). */
  urgent?: boolean;
  /** Optional link or button (e.g. open lesson). */
  action?: ReactNode;
};

export type LearnerDeadlinesListProps = {
  title?: string;
  description?: ReactNode;
  items: LearnerDeadlineItem[];
  emptyMessage?: string;
  className?: string;
};

export function LearnerDeadlinesList({
  title = "Upcoming deadlines",
  description,
  items,
  emptyMessage = "No upcoming deadlines.",
  className,
}: LearnerDeadlinesListProps): ReactElement {
  return (
    <section className={cx(styles.section, className)} aria-labelledby="deadlines-title">
      <h2 id="deadlines-title" className={styles.sectionTitle}>
        {title}
      </h2>
      {description ? <div className={styles.sectionDescription}>{description}</div> : null}
      {items.length === 0 ? (
        <p className={styles.emptyBox}>{emptyMessage}</p>
      ) : (
        <ul className={styles.deadlineList}>
          {items.map((item) => (
            <li key={item.id} className={styles.deadlineRow}>
              <div>
                <p className={styles.deadlineTitle}>{item.title}</p>
                <p className={cx(styles.deadlineDue, item.urgent ? styles.deadlineDueWarn : undefined)}>
                  Due {item.dueLabel}
                  {item.urgent ? " · soon" : ""}
                </p>
              </div>
              {item.action ? <div className={styles.deadlineMeta}>{item.action}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
