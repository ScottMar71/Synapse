"use client";

import type { ReactElement } from "react";
import { useId, useState } from "react";

import { CourseCopyAssistant } from "./course-copy-assistant";
import styles from "./course-wireframe.module.css";

type CourseDetailsEditorProps = {
  initialTitle: string;
};

export function CourseDetailsEditor({ initialTitle }: CourseDetailsEditorProps): ReactElement {
  const baseId = useId();
  const titleFieldId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const objectivesId = `${baseId}-objectives`;

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");

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
          onChange={(e) => setTitle(e.target.value)}
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
          onChange={(e) => setDescription(e.target.value)}
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
          onChange={(e) => setObjectives(e.target.value)}
          placeholder="One objective per line. Use measurable verbs where possible."
        />
      </div>
      <CourseCopyAssistant
        courseTitle={title}
        onApplyDescription={setDescription}
        onApplyObjectives={setObjectives}
      />
    </div>
  );
}
