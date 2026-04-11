"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import styles from "./course-wireframe.module.css";

type LearningTimeAssistantProps = {
  initialModuleCount?: number;
  initialReadingPages?: number;
};

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `~${Math.round(totalMinutes)} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (mins === 0) {
    return `~${hours}h`;
  }
  return `~${hours}h ${mins}m`;
}

function estimateMinutes(moduleCount: number, readingPages: number): number {
  const perModule = 18;
  const perPage = 2.5;
  const assessmentOverhead = 12;
  return Math.max(
    20,
    moduleCount * perModule + readingPages * perPage + assessmentOverhead
  );
}

export function LearningTimeAssistant({
  initialModuleCount = 4,
  initialReadingPages = 12
}: LearningTimeAssistantProps): ReactElement {
  const [moduleCount, setModuleCount] = useState(initialModuleCount);
  const [readingPages, setReadingPages] = useState(initialReadingPages);

  const minutes = useMemo(
    () => estimateMinutes(moduleCount, readingPages),
    [moduleCount, readingPages]
  );

  return (
    <div className={`${styles.panel} ${styles.aiPanel}`}>
      <h2 className={styles.panelTitle}>Learning time assistant</h2>
      <p className={styles.aiEstimate}>{formatDuration(minutes)}</p>
      <p className={styles.aiRationale}>
        Approximate seat time from {moduleCount} module
        {moduleCount === 1 ? "" : "s"} and about {readingPages} pages of equivalent
        reading, plus a short assessment buffer. Adjust the wireframe inputs to see
        the estimate update.
      </p>
      <div className={styles.controls}>
        <span className={styles.stepperLabel}>Modules</span>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Decrease module count"
            onClick={() => setModuleCount((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span aria-live="polite">{moduleCount}</span>
          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Increase module count"
            onClick={() => setModuleCount((n) => Math.min(24, n + 1))}
          >
            +
          </button>
        </div>
        <span className={styles.stepperLabel}>Reading pages</span>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Decrease reading pages"
            onClick={() => setReadingPages((n) => Math.max(0, n - 2))}
          >
            −
          </button>
          <span aria-live="polite">{readingPages}</span>
          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Increase reading pages"
            onClick={() => setReadingPages((n) => Math.min(200, n + 2))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
