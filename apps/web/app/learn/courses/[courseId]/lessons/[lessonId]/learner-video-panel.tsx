"use client";

import type { LessonVideoPlaybackDto, LessonWatchStateDto } from "@conductor/contracts";
import { VideoPlayer, type VideoProgressInfo } from "@conductor/ui";
import type { ReactElement, SyntheticEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { patchLessonWatchState, type LmsApiSession } from "../../../../../../lib/lms-api-client";
import styles from "./reading-lesson-view.module.css";

const WATCH_PATCH_DEBOUNCE_MS = 1200;

type LearnerVideoPanelProps = {
  session: LmsApiSession;
  courseId: string;
  lessonId: string;
  video: LessonVideoPlaybackDto;
  initialWatchState: LessonWatchStateDto | null;
  lessonComplete: boolean;
  lessonTitle: string;
  onWatchPatchResult: (completionApplied: boolean) => void | Promise<void>;
};

export function LearnerVideoPanel({
  session,
  courseId,
  lessonId,
  video,
  initialWatchState,
  lessonComplete,
  lessonTitle,
  onWatchPatchResult
}: LearnerVideoPanelProps): ReactElement {
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastProgressRef = useRef<VideoProgressInfo | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patchGenerationRef = useRef(0);
  const resumeAppliedRef = useRef(false);

  useEffect(() => {
    resumeAppliedRef.current = false;
  }, [lessonId, video.src]);

  const clearDebounce = useCallback((): void => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushWatchPatch = useCallback(
    async (opts: { reason: "debounce" | "flush" }): Promise<void> => {
      const info = lastProgressRef.current;
      if (!info) {
        return;
      }
      if (opts.reason === "debounce" && info.duration <= 0) {
        return;
      }

      clearDebounce();
      const gen = ++patchGenerationRef.current;
      setSaveError(null);

      const result = await patchLessonWatchState(session, courseId, lessonId, {
        positionSec: info.currentTime,
        durationSec: info.duration > 0 ? info.duration : undefined,
        playedRatio: info.playedRatio
      });

      if (gen !== patchGenerationRef.current) {
        return;
      }

      if (!result.ok) {
        setSaveError(result.error.message);
        return;
      }

      if (result.completion.completionAppliedThisRequest) {
        await onWatchPatchResult(true);
      }
    },
    [session, courseId, lessonId, clearDebounce, onWatchPatchResult]
  );

  const scheduleWatchPatch = useCallback(() => {
    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void flushWatchPatch({ reason: "debounce" });
    }, WATCH_PATCH_DEBOUNCE_MS);
  }, [clearDebounce, flushWatchPatch]);

  const flushWatchPatchRef = useRef(flushWatchPatch);
  flushWatchPatchRef.current = flushWatchPatch;

  useEffect(() => {
    return () => {
      clearDebounce();
      void flushWatchPatchRef.current({ reason: "flush" });
    };
  }, [lessonId, clearDebounce]);

  const onProgress = useCallback(
    (info: VideoProgressInfo) => {
      lastProgressRef.current = info;
      scheduleWatchPatch();
    },
    [scheduleWatchPatch]
  );

  const onPauseFlush = useCallback(() => {
    void flushWatchPatch({ reason: "flush" });
  }, [flushWatchPatch]);

  const onLoadedMetadata = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      if (lessonComplete || resumeAppliedRef.current) {
        return;
      }
      const pos = initialWatchState?.positionSec;
      if (pos != null && pos > 0.5) {
        e.currentTarget.currentTime = pos;
      }
      resumeAppliedRef.current = true;
    },
    [lessonComplete, initialWatchState]
  );

  const captions =
    video.captions.length > 0
      ? video.captions.map((c) => ({
          src: c.src,
          label: c.label,
          srclang: c.srclang,
          isDefault: c.isDefault
        }))
      : undefined;

  return (
    <div className={styles.videoShell}>
      <VideoPlayer
        src={video.src}
        poster={video.poster ?? undefined}
        captions={captions}
        controls
        playsInline
        preload="metadata"
        progressThrottleMs={400}
        watchedThreshold={0.8}
        aria-label={`Video: ${lessonTitle}`}
        onProgress={onProgress}
        onPause={onPauseFlush}
        onEnded={onPauseFlush}
        onLoadedMetadata={onLoadedMetadata}
        onWatchedThresholdReached={() => {
          void flushWatchPatch({ reason: "flush" });
        }}
      />
      {saveError ? (
        <p className={styles.saveWarning} role="alert">
          Could not save playback progress: {saveError}
        </p>
      ) : null}
    </div>
  );
}
