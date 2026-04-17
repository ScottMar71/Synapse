"use client";

import { LessonViewerReadingMeasure } from "@conductor/ui";
import type { ReactElement } from "react";

import { LearnerLessonVideoStage } from "./learner-lesson-video-stage";
import { MixedLessonSegments } from "./mixed-lesson-segments";
import type { ReadyMixed, ReadyReading, ReadyVideo } from "./learner-lesson-types";
import styles from "./reading-lesson-view.module.css";

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
    return (
      <LessonViewerReadingMeasure>
        {state.html ? (
          <div className={styles.readingHtml} dangerouslySetInnerHTML={{ __html: state.html }} />
        ) : (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            No reading content has been published for this lesson yet.
          </p>
        )}
      </LessonViewerReadingMeasure>
    );
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
