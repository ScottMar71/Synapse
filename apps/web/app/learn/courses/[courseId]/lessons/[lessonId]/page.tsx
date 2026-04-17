"use client";

import {
  Button,
  LessonNavigation,
  LessonOutline,
  LessonViewerLayout,
  getAdjacentLessonsByModuleOrder
} from "@conductor/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactElement } from "react";
import { useMemo } from "react";

import { getSession } from "../../../../../../lib/lms-session";
import { LearnerLessonMainStage } from "./learner-lesson-main-stage";
import { NextLessonLink, NextOutlineLink } from "./learner-lesson-nav-links";
import { LessonResourcesPanel } from "./lesson-resources-panel";
import styles from "./reading-lesson-view.module.css";
import { useLearnerLessonPage } from "./use-learner-lesson-page";

export default function LearnerLessonPage(): ReactElement {
  const params = useParams();
  const courseId = typeof params.courseId === "string" ? params.courseId : "";
  const lessonId = typeof params.lessonId === "string" ? params.lessonId : "";

  const {
    state,
    lessonPercent,
    completeMessage,
    completeError,
    markBusy,
    setMixedVideosReady,
    markComplete,
    refreshOutlineProgress
  } = useLearnerLessonPage(courseId, lessonId);

  const adjacent = useMemo(() => {
    if (state.status !== "ready") {
      return { previous: null, next: null };
    }
    return getAdjacentLessonsByModuleOrder(state.navigationModules, lessonId);
  }, [state, lessonId]);

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Loading lesson…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" style={{ padding: "var(--space-4)", maxWidth: "42rem" }}>
        <p style={{ margin: "0 0 var(--space-3)" }}>{state.message}</p>
        <Link href={`/learn/courses/${courseId}`}>Back to course</Link>
      </div>
    );
  }

  const lessonComplete = lessonPercent >= 100;
  const resourcesSession = getSession();
  const resourcesPanel =
    resourcesSession ? (
      <LessonResourcesPanel
        session={resourcesSession}
        courseId={courseId}
        lessonId={lessonId}
        lessonFiles={state.lessonFiles}
        lessonLinks={state.lessonLinks}
        lessonGlossary={state.lessonGlossary}
      />
    ) : null;

  const mainAriaLabel =
    state.variant === "mixed"
      ? "Mixed lesson segments"
      : state.variant === "video"
        ? "Lesson video"
        : "Lesson reading";

  const completionStatus = (() => {
    if (lessonComplete) {
      return (
        <p className={styles.status} role="status">
          You have completed this lesson.
        </p>
      );
    }
    if (state.variant === "video") {
      return (
        <p className={styles.status}>
          Watch most of the video to record completion automatically, or use the button below.
        </p>
      );
    }
    if (state.variant === "mixed") {
      return (
        <p className={styles.status}>
          Scroll through all segments. When the lesson includes video, each clip must reach the
          watch threshold before completion is recorded automatically. You can also mark the lesson
          complete manually.
        </p>
      );
    }
    return (
      <p className={styles.status}>
        Scroll through the lesson or use the button above to record completion.
      </p>
    );
  })();

  return (
    <LessonViewerLayout
      breadcrumbItems={[
        { label: "Learn", href: "/learn" },
        { label: state.courseTitle, href: `/learn/courses/${courseId}` },
        { label: state.lessonTitle, current: true }
      ]}
      breadcrumbProps={{ LinkComponent: NextLessonLink }}
      title={state.lessonTitle}
      titleId="lesson-title"
      outline={
        <LessonOutline
          modules={state.lessonOutlineModules}
          aria-label="Course lessons"
          LinkComponent={NextOutlineLink}
        />
      }
      outlineLabel="Course outline"
      LinkComponent={NextLessonLink}
      nextLesson={
        adjacent.next
          ? { label: `Next: ${adjacent.next.title}`, href: adjacent.next.href }
          : null
      }
      resources={resourcesPanel}
      mainAriaLabel={mainAriaLabel}
    >
      <LearnerLessonMainStage
        state={state}
        courseId={courseId}
        lessonId={lessonId}
        lessonComplete={lessonComplete}
        setMixedVideosReady={setMixedVideosReady}
        refreshOutlineProgress={refreshOutlineProgress}
      />

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={markBusy}
          disabled={lessonComplete || markBusy}
          onClick={() => {
            void markComplete();
          }}
        >
          {lessonComplete ? "Completed" : "Mark as complete"}
        </Button>
        {completionStatus}
      </div>
      {state.variant === "video" && state.resumeLoadWarning ? (
        <p className={styles.status} role="status">
          {state.resumeLoadWarning}
        </p>
      ) : null}
      {completeMessage ? (
        <p className={styles.status} role="status" aria-live="polite">
          {completeMessage}
        </p>
      ) : null}
      {completeError ? (
        <p className={styles.status} role="alert">
          {completeError}
        </p>
      ) : null}

      <LessonNavigation
        previous={adjacent.previous}
        next={adjacent.next}
        LinkComponent={NextLessonLink}
      />
    </LessonViewerLayout>
  );
}
