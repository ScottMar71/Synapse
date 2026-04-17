"use client";

import {
  Button,
  LessonNavigation,
  LessonOutline,
  LessonViewerLayout,
  LessonViewerReadingMeasure,
  getAdjacentLessonsByModuleOrder
} from "@conductor/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ProgressDto, StaffCourseLessonOutlineDto } from "@conductor/contracts";

import {
  fetchCourse,
  fetchCourseLessonOutline,
  fetchLessonReading,
  fetchProgress,
  putProgress
} from "../../../../../../lib/lms-api-client";
import { getSession } from "../../../../../../lib/lms-session";
import { mapOutlineForLearner } from "../../learner-outline-map";
import styles from "./reading-lesson-view.module.css";

const READING_SCROLL_COMPLETE_RATIO = 0.9;

function NextLessonLink({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function NextOutlineLink({
  href,
  className,
  children,
  "aria-current": ariaCurrent,
  "aria-label": ariaLabel
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | boolean | undefined;
  "aria-label"?: string;
}): ReactElement {
  return (
    <Link href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      courseTitle: string;
      lessonTitle: string;
      html: string | null;
      lessonOutlineModules: ReturnType<typeof mapOutlineForLearner>["lessonOutlineModules"];
      navigationModules: ReturnType<typeof mapOutlineForLearner>["navigationModules"];
    };

export default function LearnerReadingLessonPage(): ReactElement {
  const params = useParams();
  const courseId = typeof params.courseId === "string" ? params.courseId : "";
  const lessonId = typeof params.lessonId === "string" ? params.lessonId : "";

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [lessonPercent, setLessonPercent] = useState(0);
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [markBusy, setMarkBusy] = useState(false);
  const markingRef = useRef(false);
  const outlineDtoRef = useRef<StaffCourseLessonOutlineDto | null>(null);

  const load = useCallback(async () => {
    if (!courseId || !lessonId) {
      setState({ status: "error", message: "Missing course or lesson." });
      return;
    }
    const session = getSession();
    if (!session) {
      setState({ status: "error", message: "No session. Sign in to continue." });
      return;
    }

    setState({ status: "loading" });
    setCompleteMessage(null);
    setCompleteError(null);

    const [courseRes, outlineRes, readingRes, progressRes] = await Promise.all([
      fetchCourse(session, courseId),
      fetchCourseLessonOutline(session, courseId),
      fetchLessonReading(session, courseId, lessonId),
      fetchProgress(session, session.userId)
    ]);

    if (!courseRes.ok) {
      setState({ status: "error", message: courseRes.error.message });
      return;
    }
    if (!outlineRes.ok) {
      outlineDtoRef.current = null;
      setState({ status: "error", message: outlineRes.error.message });
      return;
    }
    outlineDtoRef.current = outlineRes.outline;
    if (!progressRes.ok) {
      setState({ status: "error", message: progressRes.error.message });
      return;
    }
    if (!readingRes.ok) {
      if (readingRes.error.status === 400) {
        setState({
          status: "error",
          message:
            "This lesson is not a reading lesson (for example, it may be video). Use the outline from the course page when playback is available."
        });
        return;
      }
      setState({ status: "error", message: readingRes.error.message });
      return;
    }

    const reading = readingRes.reading;
    const { lessonOutlineModules, navigationModules } = mapOutlineForLearner(
      outlineRes.outline,
      courseId,
      {
        currentLessonId: lessonId,
        progress: progressRes.progress
      }
    );

    const row = progressRes.progress.find(
      (p: ProgressDto) =>
        p.courseId === courseId && p.scope === "LESSON" && p.lessonId === lessonId
    );
    const pct = row?.percent ?? 0;
    setLessonPercent(pct);

    setState({
      status: "ready",
      courseTitle: courseRes.course.title,
      lessonTitle: reading.title,
      html: reading.html,
      lessonOutlineModules,
      navigationModules
    });
  }, [courseId, lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  const markComplete = useCallback(async (): Promise<boolean> => {
    const session = getSession();
    if (!session || !courseId || !lessonId) {
      return false;
    }
    if (markingRef.current) {
      return false;
    }
    markingRef.current = true;
    setMarkBusy(true);
    setCompleteError(null);
    try {
      const result = await putProgress(session, {
        userId: session.userId,
        courseId,
        lessonId,
        scope: "LESSON",
        percent: 100
      });
      if (!result.ok) {
        setCompleteError(result.error.message);
        return false;
      }
      setLessonPercent(result.progress.percent);
      setCompleteMessage("Lesson marked complete.");

      const outlineDto = outlineDtoRef.current;
      if (outlineDto) {
        const progressRefresh = await fetchProgress(session, session.userId);
        if (progressRefresh.ok) {
          const { lessonOutlineModules, navigationModules } = mapOutlineForLearner(
            outlineDto,
            courseId,
            { currentLessonId: lessonId, progress: progressRefresh.progress }
          );
          setState((s) =>
            s.status === "ready" ? { ...s, lessonOutlineModules, navigationModules } : s
          );
        }
      }
      return true;
    } finally {
      markingRef.current = false;
      setMarkBusy(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }
    if (lessonPercent >= 100) {
      return;
    }

    const onScroll = (): void => {
      if (lessonPercent >= 100 || markingRef.current) {
        return;
      }
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      const ratio = scrollable <= 0 ? 1 : el.scrollTop / scrollable;
      if (ratio >= READING_SCROLL_COMPLETE_RATIO) {
        void markComplete();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [state.status, lessonPercent, markComplete]);

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
      mainAriaLabel="Lesson reading"
    >
      <LessonViewerReadingMeasure>
        {state.html ? (
          <div
            className={styles.readingHtml}
            dangerouslySetInnerHTML={{ __html: state.html }}
          />
        ) : (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            No reading content has been published for this lesson yet.
          </p>
        )}
      </LessonViewerReadingMeasure>

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
        {lessonComplete ? (
          <p className={styles.status} role="status">
            You have completed this lesson.
          </p>
        ) : (
          <p className={styles.status}>
            Scroll through the lesson or use the button above to record completion.
          </p>
        )}
      </div>
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
