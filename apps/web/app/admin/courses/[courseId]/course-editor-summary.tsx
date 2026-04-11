import type { ReactElement } from "react";

import styles from "./course-wireframe.module.css";

type CourseEditorSummaryProps = {
  title: string;
  description: string;
  objectives: string;
};

function descriptionPreview(text: string): string {
  const t = text.trim();
  if (!t) {
    return "No description yet.";
  }
  const oneLine = t.replace(/\s+/g, " ");
  return oneLine.length > 160 ? `${oneLine.slice(0, 157)}…` : oneLine;
}

function objectiveLineCount(text: string): number {
  return text.split("\n").filter((line) => line.trim().length > 0).length;
}

export function CourseEditorSummary({
  title,
  description,
  objectives
}: CourseEditorSummaryProps): ReactElement {
  const count = objectiveLineCount(objectives);
  const objectivesLabel =
    count === 0 ? "None listed" : count === 1 ? "1 objective" : `${count} objectives`;

  return (
    <section className={`${styles.panel} ${styles.summaryBox}`} aria-label="Editor summary">
      <h2 className={styles.panelTitle}>Summary</h2>
      <dl className={styles.summaryList}>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryTerm}>Title</dt>
          <dd className={styles.summaryDetail}>{title.trim() || "—"}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryTerm}>Description</dt>
          <dd className={styles.summaryDetail}>{descriptionPreview(description)}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryTerm}>Learning objectives</dt>
          <dd className={styles.summaryDetail}>{objectivesLabel}</dd>
        </div>
      </dl>
      <p className={styles.summaryFootnote}>
        Reflects the fields above as you edit. Wireframe only — nothing is persisted.
      </p>
    </section>
  );
}
