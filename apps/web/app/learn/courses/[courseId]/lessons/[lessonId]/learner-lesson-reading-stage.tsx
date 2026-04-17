"use client";

import { LessonViewerReadingMeasure } from "@conductor/ui";
import type { ReactElement } from "react";

import styles from "./reading-lesson-view.module.css";

export function LearnerLessonReadingStage({ html }: { html: string | null }): ReactElement {
  return (
    <LessonViewerReadingMeasure>
      {html ? (
        <div className={styles.readingHtml} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          No reading content has been published for this lesson yet.
        </p>
      )}
    </LessonViewerReadingMeasure>
  );
}
