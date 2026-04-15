"use client";

import type { ReactElement } from "react";
import { useId } from "react";

import styles from "./course-wireframe.module.css";

type CourseEditorSummaryProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CourseEditorSummary({ value, onChange }: CourseEditorSummaryProps): ReactElement {
  const summaryId = useId();

  return (
    <section className={`${styles.panel} ${styles.summaryBox}`} aria-labelledby={`${summaryId}-heading`}>
      <h2 className={styles.panelTitle} id={`${summaryId}-heading`}>
        Course summary
      </h2>
      <p className={styles.summaryLead}>
        Write a short recap of what you have built: scope, audience, delivery format, and anything
        handover reviewers should know. This is separate from the catalog description above.
      </p>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${summaryId}-field`}>
          Your summary
        </label>
        <textarea
          id={`${summaryId}-field`}
          className={styles.textarea}
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Five-module onboarding path with SCORM wrap-in, workplace scenarios, and a 45-minute seat-time target for retail supervisors."
        />
      </div>
      <p className={styles.summaryFootnote}>
        Wireframe only — this text is not saved until the real editor API exists.
      </p>
    </section>
  );
}
