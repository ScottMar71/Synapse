"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import editorStyles from "../course-wireframe.module.css";
import styles from "./course-player-wireframe.module.css";

type Lesson = {
  id: string;
  title: string;
  durationMin: number;
  contentKind: "video" | "reading" | "scorm" | "mixed";
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

const DEMO_COURSE_TITLE = "Sample course (wireframe data)";

const DEMO_OUTLINE: Module[] = [
  {
    id: "mod-orientation",
    title: "Module 1 — Orientation",
    lessons: [
      { id: "les-welcome", title: "Welcome and objectives", durationMin: 8, contentKind: "video" },
      { id: "les-safety", title: "Safety overview", durationMin: 12, contentKind: "reading" },
      { id: "les-tour", title: "Platform tour", durationMin: 6, contentKind: "scorm" }
    ]
  },
  {
    id: "mod-practice",
    title: "Module 2 — Guided practice",
    lessons: [
      { id: "les-scenario", title: "Scenario walkthrough", durationMin: 15, contentKind: "mixed" },
      { id: "les-exercise", title: "Practice exercise", durationMin: 20, contentKind: "reading" }
    ]
  },
  {
    id: "mod-checkpoint",
    title: "Module 3 — Checkpoint",
    lessons: [
      { id: "les-quiz", title: "Knowledge check", durationMin: 10, contentKind: "mixed" }
    ]
  }
];

function flattenLessons(modules: Module[]): Lesson[] {
  return modules.flatMap((m) => m.lessons);
}

function contentKindLabel(kind: Lesson["contentKind"]): string {
  switch (kind) {
    case "video":
      return "Video block";
    case "reading":
      return "Reading / article";
    case "scorm":
      return "SCORM package";
    case "mixed":
      return "Mixed content";
    default:
      return "Content";
  }
}

type CoursePlayerWireframeProps = {
  courseId: string;
};

export function CoursePlayerWireframe({ courseId }: CoursePlayerWireframeProps): ReactElement {
  const flatLessons = useMemo(() => flattenLessons(DEMO_OUTLINE), []);
  const [activeLessonId, setActiveLessonId] = useState<string>(flatLessons[0]?.id ?? "");
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());

  const activeIndex = flatLessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = activeIndex >= 0 ? flatLessons[activeIndex] : undefined;
  const total = flatLessons.length;
  const position = activeIndex >= 0 ? activeIndex + 1 : 0;
  const percentComplete =
    total === 0 ? 0 : Math.round((completedIds.size / total) * 100);
  const progressFillPercent = total === 0 ? 0 : Math.round((position / total) * 100);

  const toggleComplete = useCallback(() => {
    if (!activeLesson) {
      return;
    }
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(activeLesson.id)) {
        next.delete(activeLesson.id);
      } else {
        next.add(activeLesson.id);
      }
      return next;
    });
  }, [activeLesson]);

  const goPrev = useCallback(() => {
    if (activeIndex <= 0) {
      return;
    }
    setActiveLessonId(flatLessons[activeIndex - 1].id);
  }, [activeIndex, flatLessons]);

  const goNext = useCallback(() => {
    if (activeIndex < 0 || activeIndex >= flatLessons.length - 1) {
      return;
    }
    setActiveLessonId(flatLessons[activeIndex + 1].id);
  }, [activeIndex, flatLessons]);

  const isComplete = activeLesson ? completedIds.has(activeLesson.id) : false;

  return (
    <div className={styles.playerShell}>
      <div className={styles.topBar}>
        <div className={styles.titleBlock}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Learning experience (preview)
          </p>
          <h2 style={{ margin: "var(--space-2) 0 0", fontSize: "1.35rem", lineHeight: 1.25 }}>
            {DEMO_COURSE_TITLE}
          </h2>
          <div className={styles.metaRow}>
            <span>
              Lesson {position} of {total}
            </span>
            <span aria-hidden>·</span>
            <span>{percentComplete}% lessons marked complete</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progressFillPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Position in course outline"
          >
            <div className={styles.progressFill} style={{ width: `${progressFillPercent}%` }} />
          </div>
        </div>
        <Link className={`${editorStyles.secondaryBtn} ${styles.editorLink}`} href={`/admin/courses/${courseId}`}>
          Back to course editor
        </Link>
      </div>

      <div className={styles.layout}>
        <nav className={styles.outline} aria-label="Course outline">
          <h3 className={styles.outlineTitle}>Outline</h3>
          {DEMO_OUTLINE.map((mod) => (
            <div key={mod.id} className={styles.moduleBlock}>
              <p className={styles.moduleName}>{mod.title}</p>
              <ul className={styles.lessonList}>
                {mod.lessons.map((les) => {
                  const isActive = les.id === activeLessonId;
                  const done = completedIds.has(les.id);
                  return (
                    <li key={les.id}>
                      <button
                        type="button"
                        className={`${styles.lessonBtn} ${isActive ? styles.lessonBtnActive : ""} ${
                          done ? styles.lessonBtnComplete : ""
                        }`}
                        aria-current={isActive ? "true" : undefined}
                        aria-label={`${les.title}, ${les.durationMin} minutes`}
                        onClick={() => {
                          setActiveLessonId(les.id);
                        }}
                      >
                        <span className={`${styles.checkIcon} ${done ? styles.checkIconDone : ""}`} aria-hidden>
                          {done ? "✓" : "○"}
                        </span>
                        <span aria-hidden>{les.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <main className={styles.stage} aria-labelledby="wireframe-lesson-title">
          {activeLesson ? (
            <>
              <h2 id="wireframe-lesson-title" className={styles.lessonHeader}>
                {activeLesson.title}
              </h2>
              <section className={styles.contentFrame} aria-label="Lesson content placeholder">
                <p className={styles.contentLabel}>{contentKindLabel(activeLesson.contentKind)}</p>
                <p className={styles.contentHint}>
                  Wireframe only. The production player will render video, SCORM, documents, or HTML lessons from course
                  structure and tenant storage.
                </p>
                <div className={styles.pillRow} aria-hidden>
                  <span className={styles.pill}>Learner shell</span>
                  <span className={styles.pill}>Progress sync</span>
                  <span className={styles.pill}>Resume</span>
                </div>
              </section>

              <div className={styles.sidePanels}>
                <section className={styles.panelMini} aria-labelledby="resources-heading">
                  <h3 id="resources-heading">Resources</h3>
                  <p>Downloadable files, links, and glossary entries will list here.</p>
                </section>
                <section className={styles.panelMini} aria-labelledby="notes-heading">
                  <h3 id="notes-heading">Notes</h3>
                  <p>Optional learner notes and bookmarks for this lesson.</p>
                </section>
              </div>

              <div className={styles.footerBar}>
                <label className={styles.completeLabel}>
                  <input
                    type="checkbox"
                    checked={isComplete}
                    onChange={() => {
                      toggleComplete();
                    }}
                  />
                  Mark lesson complete
                </label>
                <div className={styles.footerActions}>
                  <div className={styles.navCluster}>
                    <button
                      type="button"
                      className={editorStyles.secondaryBtn}
                      disabled={activeIndex <= 0}
                      onClick={() => {
                        goPrev();
                      }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className={editorStyles.primaryBtn}
                      disabled={activeIndex < 0 || activeIndex >= flatLessons.length - 1}
                      onClick={() => {
                        goNext();
                      }}
                    >
                      Next lesson
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p role="status">Select a lesson from the outline.</p>
          )}
        </main>
      </div>
    </div>
  );
}
