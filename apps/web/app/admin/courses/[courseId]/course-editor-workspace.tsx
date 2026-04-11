"use client";

import type { ReactElement } from "react";
import { useState } from "react";

import { CourseCopyAssistant } from "./course-copy-assistant";
import { CourseDetailsFields } from "./course-details-fields";
import { DocumentUploadBlock } from "./document-upload-block";
import { ImageUploadBlock } from "./image-upload-block";
import { LearningTimeAssistant } from "./learning-time-assistant";
import { CourseEditorSummary } from "./course-editor-summary";
import { ScormUploadBlock } from "./scorm-upload-block";
import styles from "./course-wireframe.module.css";

type CourseEditorWorkspaceProps = {
  initialTitle: string;
};

export function CourseEditorWorkspace({ initialTitle }: CourseEditorWorkspaceProps): ReactElement {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [courseSummary, setCourseSummary] = useState("");

  return (
    <div className={styles.editorShell}>
      <div className={styles.grid}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <CourseDetailsFields
            title={title}
            description={description}
            objectives={objectives}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onObjectivesChange={setObjectives}
          />
          <ScormUploadBlock />
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <CourseCopyAssistant
            courseTitle={title}
            onApplyDescription={setDescription}
            onApplyObjectives={setObjectives}
          />
          <DocumentUploadBlock />
          <ImageUploadBlock />
          <LearningTimeAssistant />
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Publish</h2>
            <p
              style={{
                margin: "0 0 var(--space-4)",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)"
              }}
            >
              Draft / scheduled / live controls would live here.
            </p>
            <button type="button" className={styles.secondaryBtn}>
              Save draft
            </button>
          </div>
        </aside>
      </div>
      <CourseEditorSummary value={courseSummary} onChange={setCourseSummary} />
    </div>
  );
}
