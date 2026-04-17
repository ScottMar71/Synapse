import type {
  LessonScormSessionDto,
  LessonVideoPlaybackDto,
  LessonWatchStateDto,
  ProgressDto,
  StaffCourseLessonOutlineDto
} from "@conductor/contracts";

import {
  fetchCourse,
  fetchCourseLessonOutline,
  fetchLessonExternalLinks,
  fetchLessonFileAttachments,
  fetchLessonGlossaryEntries,
  fetchLessonMixedBlocks,
  fetchLessonPlayback,
  fetchLessonReading,
  fetchLessonScormPackage,
  fetchLessonScormSession,
  fetchLessonWatchState,
  fetchProgress
} from "../../../../../../lib/lms-api-client";
import type { LmsSession } from "../../../../../../lib/lms-session";
import { findOutlineLesson, mapOutlineForLearner } from "../../learner-outline-map";

import {
  sortLessonFiles,
  type LoadState,
  type ReadyMixed,
  type ReadyReading,
  type ReadyScorm,
  type ReadyVideo
} from "./learner-lesson-types";

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
  const [courseRes, outlineRes, progressRes, linksRes, filesRes, glossaryRes] = await Promise.all([
    fetchCourse(session, courseId),
    fetchCourseLessonOutline(session, courseId),
    fetchProgress(session, session.userId),
    fetchLessonExternalLinks(session, courseId, lessonId),
    fetchLessonFileAttachments(session, courseId, lessonId),
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
  if (!filesRes.ok) {
    return { ok: false, message: filesRes.error.message, clearOutline: false };
  }

  const lessonFiles = sortLessonFiles(filesRes.attachments);
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
    const playbackRes = await fetchLessonPlayback(session, courseId, lessonId);

    let video: LessonVideoPlaybackDto | null = null;
    let playbackUnavailableMessage: string | null = null;
    let lessonTitle = outlineLesson.title;
    let initialWatchState: LessonWatchStateDto | null = null;
    let resumeLoadWarning: string | null = null;

    if (!playbackRes.ok) {
      playbackUnavailableMessage = playbackRes.error.message;
    } else {
      lessonTitle = playbackRes.playback.lesson.title;
      if (!playbackRes.playback.video) {
        playbackUnavailableMessage =
          "This video lesson is not configured with a playable asset yet.";
      } else {
        video = playbackRes.playback.video;
        playbackUnavailableMessage = null;
        const watchRes = await fetchLessonWatchState(session, courseId, lessonId);
        if (!watchRes.ok && watchRes.error.status !== 400) {
          resumeLoadWarning = `Saved playback position could not be loaded (${watchRes.error.message}).`;
        }
        initialWatchState = watchRes.ok ? watchRes.watchState : null;
      }
    }

    const ready: ReadyVideo = {
      status: "ready",
      variant: "video",
      courseTitle: courseRes.course.title,
      lessonTitle,
      video,
      playbackUnavailableMessage,
      initialWatchState,
      resumeLoadWarning,
      lessonFiles,
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
      lessonFiles,
      lessonLinks: linksRes.links,
      lessonGlossary,
      lessonOutlineModules,
      navigationModules
    };
    return { ok: true, lessonPercent, outline: outlineRes.outline, state: ready };
  }

  if (outlineLesson.contentKind === "SCORM") {
    const pkgRes = await fetchLessonScormPackage(session, courseId, lessonId);
    if (!pkgRes.ok) {
      return { ok: false, message: pkgRes.error.message, clearOutline: false };
    }
    let initialSession: LessonScormSessionDto | null = null;
    let sessionLoadWarning: string | null = null;
    let scormUnavailableMessage: string | null = null;
    const p = pkgRes.pkg;

    if (!p) {
      scormUnavailableMessage = "No SCORM package has been uploaded for this lesson yet.";
    } else if (p.status === "FAILED") {
      scormUnavailableMessage = p.processingError ?? "SCORM package processing failed.";
    } else if (p.status !== "READY") {
      scormUnavailableMessage =
        p.status === "PROCESSING"
          ? "SCORM package is still processing. Try again shortly."
          : "SCORM package is not ready to launch yet.";
    } else {
      const sessRes = await fetchLessonScormSession(session, courseId, lessonId);
      if (!sessRes.ok) {
        sessionLoadWarning = `Saved SCORM progress could not be loaded (${sessRes.error.message}).`;
        initialSession = {
          tenantId: session.tenantId,
          userId: session.userId,
          lessonId,
          cmiState: {},
          updatedAt: new Date(0).toISOString()
        };
      } else {
        initialSession = sessRes.session;
      }
    }

    const ready: ReadyScorm = {
      status: "ready",
      variant: "scorm",
      courseTitle: courseRes.course.title,
      lessonTitle: outlineLesson.title,
      pkg: p,
      initialSession,
      scormUnavailableMessage,
      sessionLoadWarning,
      lessonFiles,
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
    lessonFiles,
    lessonLinks: linksRes.links,
    lessonGlossary,
    lessonOutlineModules,
    navigationModules
  };
  return { ok: true, lessonPercent, outline: outlineRes.outline, state: ready };
}
