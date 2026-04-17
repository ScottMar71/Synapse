import type { ProgressDto, StaffCourseLessonOutlineDto } from "@conductor/contracts";

import {
  fetchCourse,
  fetchCourseLessonOutline,
  fetchLessonExternalLinks,
  fetchLessonGlossaryEntries,
  fetchLessonMixedBlocks,
  fetchLessonPlayback,
  fetchLessonReading,
  fetchLessonWatchState,
  fetchProgress
} from "../../../../../../lib/lms-api-client";
import type { LmsSession } from "../../../../../../lib/lms-session";
import { findOutlineLesson, mapOutlineForLearner } from "../../learner-outline-map";

import type { LoadState, ReadyMixed, ReadyReading, ReadyVideo } from "./learner-lesson-types";

export type LessonLoadFailure = { ok: false; message: string; clearOutline: boolean };

export type LessonLoadSuccess = {
  ok: true;
  lessonPercent: number;
  outline: StaffCourseLessonOutlineDto;
  state: Extract<LoadState, { status: "ready" }>;
};

export type LessonLoadResult = LessonLoadFailure | LessonLoadSuccess;

export async function loadLearnerLessonPageState(
  session: Pick<LmsSession, "token" | "tenantId" | "userId">,
  courseId: string,
  lessonId: string
): Promise<LessonLoadResult> {
  const [courseRes, outlineRes, progressRes, linksRes, glossaryRes] = await Promise.all([
    fetchCourse(session, courseId),
    fetchCourseLessonOutline(session, courseId),
    fetchProgress(session, session.userId),
    fetchLessonExternalLinks(session, courseId, lessonId),
    fetchLessonGlossaryEntries(session, courseId, lessonId)
  ]);

  if (!courseRes.ok) {
    return { ok: false, message: courseRes.error.message, clearOutline: false };
  }
  if (!outlineRes.ok) {
    return { ok: false, message: outlineRes.error.message, clearOutline: true };
  }
  if (!progressRes.ok) {
    return { ok: false, message: progressRes.error.message, clearOutline: false };
  }
  if (!linksRes.ok) {
    return { ok: false, message: linksRes.error.message, clearOutline: false };
  }

  const lessonGlossary = glossaryRes.ok ? glossaryRes.entries : [];

  const outlineLesson = findOutlineLesson(outlineRes.outline, lessonId);
  if (!outlineLesson) {
    return {
      ok: false,
      message: "This lesson was not found in the course outline.",
      clearOutline: false
    };
  }

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
  const lessonPercent = row?.percent ?? 0;

  if (outlineLesson.contentKind === "VIDEO") {
    const [playbackRes, watchRes] = await Promise.all([
      fetchLessonPlayback(session, courseId, lessonId),
      fetchLessonWatchState(session, courseId, lessonId)
    ]);
    if (!playbackRes.ok) {
      return { ok: false, message: playbackRes.error.message, clearOutline: false };
    }
    if (!playbackRes.playback.video) {
      return {
        ok: false,
        message: "This video lesson is not configured with a playable asset yet.",
        clearOutline: false
      };
    }
    let resumeLoadWarning: string | null = null;
    if (!watchRes.ok && watchRes.error.status !== 400) {
      resumeLoadWarning = `Saved playback position could not be loaded (${watchRes.error.message}).`;
    }
    const initialWatchState = watchRes.ok ? watchRes.watchState : null;
    const ready: ReadyVideo = {
      status: "ready",
      variant: "video",
      courseTitle: courseRes.course.title,
      lessonTitle: playbackRes.playback.lesson.title,
      video: playbackRes.playback.video,
      initialWatchState,
      resumeLoadWarning,
      lessonLinks: linksRes.links,
      lessonGlossary,
      lessonOutlineModules,
      navigationModules
    };
    return { ok: true, lessonPercent, outline: outlineRes.outline, state: ready };
  }

  if (outlineLesson.contentKind === "MIXED") {
    const blocksRes = await fetchLessonMixedBlocks(session, courseId, lessonId);
    if (!blocksRes.ok) {
      return { ok: false, message: blocksRes.error.message, clearOutline: false };
    }
    const ready: ReadyMixed = {
      status: "ready",
      variant: "mixed",
      courseTitle: courseRes.course.title,
      lessonTitle: outlineLesson.title,
      blocks: blocksRes.blocks,
      lessonLinks: linksRes.links,
      lessonGlossary,
      lessonOutlineModules,
      navigationModules
    };
    return { ok: true, lessonPercent, outline: outlineRes.outline, state: ready };
  }

  const readingRes = await fetchLessonReading(session, courseId, lessonId);
  if (!readingRes.ok) {
    if (readingRes.error.status === 400) {
      return {
        ok: false,
        message:
          "This lesson type is not supported in this view yet. Use the course outline to pick another lesson.",
        clearOutline: false
      };
    }
    return { ok: false, message: readingRes.error.message, clearOutline: false };
  }

  const reading = readingRes.reading;
  const ready: ReadyReading = {
    status: "ready",
    variant: "reading",
    courseTitle: courseRes.course.title,
    lessonTitle: reading.title,
    html: reading.html,
    lessonLinks: linksRes.links,
    lessonGlossary,
    lessonOutlineModules,
    navigationModules
  };
  return { ok: true, lessonPercent, outline: outlineRes.outline, state: ready };
}
