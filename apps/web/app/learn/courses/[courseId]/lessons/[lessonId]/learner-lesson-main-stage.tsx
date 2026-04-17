"use client";

import type { ReactElement } from "react";

import { LearnerLessonReadingStage } from "./learner-lesson-reading-stage";
import { LearnerLessonVideoStage } from "./learner-lesson-video-stage";
import { MixedLessonSegments } from "./mixed-lesson-segments";
import type { ReadyMixed, ReadyReading, ReadyVideo } from "./learner-lesson-types";

export type ReadyLessonState = ReadyReading | ReadyMixed | ReadyVideo;

export function LearnerLessonMainStage({
  state,
  courseId,
  lessonId,
  lessonComplete,
  setMixedVideosReady,
  refreshOutlineProgress
}: {
  state: ReadyLessonState;
  courseId: string;
  lessonId: string;
  lessonComplete: boolean;
  setMixedVideosReady: (value: boolean) => void;
  refreshOutlineProgress: () => Promise<void>;
}): ReactElement {
  if (state.variant === "reading") {
    return <LearnerLessonReadingStage html={state.html} />;
  }

  if (state.variant === "video") {
    return (
      <LearnerLessonVideoStage
        courseId={courseId}
        lessonId={lessonId}
        lessonTitle={state.lessonTitle}
        video={state.video}
        initialWatchState={state.initialWatchState}
        lessonComplete={lessonComplete}
        refreshOutlineProgress={refreshOutlineProgress}
      />
    );
  }

  if (state.blocks.length === 0) {
    return (
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
        This mixed lesson does not have any segments yet.
      </p>
    );
  }

  return (
    <MixedLessonSegments
      key={lessonId}
      blocks={state.blocks}
      onAllVideoThresholdsMetChange={setMixedVideosReady}
    />
  );
}
