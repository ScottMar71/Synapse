"use client";

import type { LessonVideoPlaybackDto, LessonWatchStateDto } from "@conductor/contracts";
import type { ReactElement } from "react";

import { getSession } from "../../../../../../lib/lms-session";
import { LearnerVideoPanel } from "./learner-video-panel";

export function LearnerLessonVideoStage({
  courseId,
  lessonId,
  lessonTitle,
  video,
  initialWatchState,
  lessonComplete,
  refreshOutlineProgress
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  video: LessonVideoPlaybackDto;
  initialWatchState: LessonWatchStateDto | null;
  lessonComplete: boolean;
  refreshOutlineProgress: () => Promise<void>;
}): ReactElement {
  const session = getSession();
  return session ? (
    <LearnerVideoPanel
      key={`${lessonId}-${initialWatchState?.id ?? "none"}`}
      session={session}
      courseId={courseId}
      lessonId={lessonId}
      video={video}
      initialWatchState={initialWatchState}
      lessonComplete={lessonComplete}
      lessonTitle={lessonTitle}
      onWatchPatchResult={async (applied) => {
        if (applied) {
          await refreshOutlineProgress();
        }
      }}
    />
  ) : (
    <p role="alert">Session missing. Sign in again.</p>
  );
}
