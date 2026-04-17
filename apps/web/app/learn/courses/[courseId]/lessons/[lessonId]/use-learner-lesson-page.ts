import type { ProgressDto, StaffCourseLessonOutlineDto } from "@conductor/contracts";
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchProgress, putProgress } from "../../../../../../lib/lms-api-client";
import { getSession } from "../../../../../../lib/lms-session";
import { mapOutlineForLearner } from "../../learner-outline-map";

import { loadLearnerLessonPageState } from "./learner-lesson-load";
import {
  READING_SCROLL_COMPLETE_RATIO,
  type LoadState,
  mixedScrollGatesMet
} from "./learner-lesson-types";

export function useLearnerLessonPage(courseId: string, lessonId: string): {
  state: LoadState;
  lessonPercent: number;
  completeMessage: string | null;
  completeError: string | null;
  markBusy: boolean;
  setMixedVideosReady: (v: boolean) => void;
  markComplete: () => Promise<boolean>;
  refreshOutlineProgress: () => Promise<void>;
} {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [lessonPercent, setLessonPercent] = useState(0);
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [markBusy, setMarkBusy] = useState(false);
  const [mixedVideosReady, setMixedVideosReady] = useState(false);
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
    setMixedVideosReady(false);

    const result = await loadLearnerLessonPageState(session, courseId, lessonId);
    if (!result.ok) {
      if (result.clearOutline) {
        outlineDtoRef.current = null;
      }
      setState({ status: "error", message: result.message });
      return;
    }
    outlineDtoRef.current = result.outline;
    setLessonPercent(result.lessonPercent);
    setState(result.state);
  }, [courseId, lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshOutlineProgress = useCallback(async (): Promise<void> => {
    const session = getSession();
    const outlineDto = outlineDtoRef.current;
    if (!session || !outlineDto || !courseId || !lessonId) {
      return;
    }
    const progressRefresh = await fetchProgress(session, session.userId);
    if (!progressRefresh.ok) {
      return;
    }
    const row = progressRefresh.progress.find(
      (p: ProgressDto) =>
        p.courseId === courseId && p.scope === "LESSON" && p.lessonId === lessonId
    );
    setLessonPercent(row?.percent ?? 0);
    const { lessonOutlineModules, navigationModules } = mapOutlineForLearner(
      outlineDto,
      courseId,
      { currentLessonId: lessonId, progress: progressRefresh.progress }
    );
    setState((prev: LoadState) =>
      prev.status === "ready" ? { ...prev, lessonOutlineModules, navigationModules } : prev
    );
  }, [courseId, lessonId]);

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

      await refreshOutlineProgress();
      return true;
    } finally {
      markingRef.current = false;
      setMarkBusy(false);
    }
  }, [courseId, lessonId, refreshOutlineProgress]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }
    if (state.variant === "video") {
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

      if (state.variant === "reading") {
        if (ratio >= READING_SCROLL_COMPLETE_RATIO) {
          void markComplete();
        }
        return;
      }

      if (mixedScrollGatesMet(state.blocks, ratio, mixedVideosReady)) {
        void markComplete();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [state, lessonPercent, markComplete, mixedVideosReady]);

  return {
    state,
    lessonPercent,
    completeMessage,
    completeError,
    markBusy,
    setMixedVideosReady,
    markComplete,
    refreshOutlineProgress
  };
}
