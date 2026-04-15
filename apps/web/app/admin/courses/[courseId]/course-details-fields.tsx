"use client";

import type { ReactElement } from "react";
import { useId } from "react";

import styles from "./course-wireframe.module.css";

export type CourseDetailsFieldsProps = {
  title: string;
  description: string;
  objectives: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onObjectivesChange: (value: string) => void;
};

export function CourseDetailsFields({
  title,
  description,
  objectives,
  onTitleChange,
  onDescriptionChange,
  onObjectivesChange
}: CourseDetailsFieldsProps): ReactElement {
  const baseId = useId();
  const titleFieldId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const objectivesId = `${baseId}-objectives`;

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Course details</h2>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={titleFieldId}>
          Title
        </label>
        <input
          id={titleFieldId}
          className={styles.input}
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={descriptionId}>
          Description
        </label>
        <textarea
          id={descriptionId}
          className={styles.textarea}
          rows={5}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Short overview learners see before they enroll or open the course."
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={objectivesId}>
          Learning objectives
        </label>
        <textarea
          id={objectivesId}
          className={styles.textarea}
          rows={5}
          value={objectives}
          onChange={(e) => onObjectivesChange(e.target.value)}
          placeholder="One objective per line. Use measurable verbs where possible."
        />
      </div>
    </div>
  );
}
