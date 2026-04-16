"use client";

import type { ComponentType, MouseEvent, ReactElement, ReactNode } from "react";

import { cx } from "../internal/cx";
import { DefaultLessonLink, formatDuration, lessonAriaLabel, typeMeta } from "./lesson-outline.shared";
import type { LessonOutlineLesson, LessonOutlineModule } from "./lesson-outline.types";
import styles from "./lesson-outline.module.css";

export type { LessonOutlineLesson, LessonOutlineLessonType, LessonOutlineModule } from "./lesson-outline.types";

export type LessonOutlineProps = {
  modules: LessonOutlineModule[];
  "aria-label"?: string;
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
    "aria-current"?: "page" | boolean | undefined;
    "aria-label"?: string;
  }>;
  /** Used when a lesson has no `href` (e.g. client-side only navigation). */
  onLessonActivate?: (lesson: LessonOutlineLesson) => void;
};

export function LessonOutline({
  modules,
  "aria-label": ariaLabel = "Lesson outline",
  LinkComponent,
  onLessonActivate,
}: LessonOutlineProps): ReactElement {
  const L = LinkComponent ?? DefaultLessonLink;

  return (
    <nav aria-label={ariaLabel} className={styles.root}>
      <ul className={styles.moduleList}>
        {modules.map((mod) => {
          const hasCurrent = mod.lessons.some((l) => l.current);
          const defaultOpen = hasCurrent || mod.defaultOpen === true;
          return (
            <li key={mod.id}>
              <details
                className={styles.module}
                // React supports `defaultOpen` on `<details>`; some @types versions omit it from `DetailsHTMLAttributes`.
                {...{ defaultOpen }}
              >
                <summary className={styles.moduleSummary}>
                  <span>
                    {mod.title}
                    <span className={styles.moduleMeta}>
                      {" "}
                      ({mod.lessons.length})
                    </span>
                  </span>
                </summary>
                <ul className={styles.lessonList}>
                  {mod.lessons.map((lesson) => {
                    const { glyph, label: typeLabel } = typeMeta(lesson.lessonType);
                    const durationLabel =
                      lesson.durationMinutes != null ? formatDuration(lesson.durationMinutes) : undefined;
                    const complete = lesson.completed === true;
                    const current = lesson.current === true;
                    const rowClass = cx(styles.lessonRow, current ? styles.lessonRowCurrent : undefined);
                    const mark = complete ? "✓" : "○";
                    const markClass = cx(styles.statusMark, complete ? styles.statusMarkDone : undefined);
                    const a11yLabel = lessonAriaLabel(lesson, typeLabel, durationLabel);
                    const inner = (
                      <>
                        <span className={styles.lessonTypeIcon} title={typeLabel} aria-hidden>
                          {glyph}
                        </span>
                        <span className={styles.lessonBody}>
                          <span className={styles.lessonTitle}>{lesson.title}</span>
                          {durationLabel ? (
                            <span className={styles.lessonMeta}>{durationLabel}</span>
                          ) : null}
                        </span>
                        <span className={markClass} aria-hidden="true">
                          {mark}
                        </span>
                      </>
                    );

                    if (lesson.href) {
                      return (
                        <li key={lesson.id}>
                          <L
                            href={lesson.href}
                            className={rowClass}
                            aria-current={current ? "page" : undefined}
                            aria-label={a11yLabel}
                          >
                            {inner}
                          </L>
                        </li>
                      );
                    }

                    if (onLessonActivate) {
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            className={rowClass}
                            aria-current={current ? "true" : undefined}
                            aria-label={a11yLabel}
                            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                              e.preventDefault();
                              onLessonActivate(lesson);
                            }}
                          >
                            {inner}
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li key={lesson.id}>
                        <div className={rowClass} role="group" aria-label={a11yLabel}>
                          {inner}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
