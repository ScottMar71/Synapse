"use client";

import type { SyntheticEvent, VideoHTMLAttributes } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { cx } from "../internal/cx";
import styles from "./video-player.module.css";

/** Playback position; not the native media `progress` (buffering) event. */
export type VideoProgressInfo = {
  currentTime: number;
  duration: number;
  /** 0–1 when duration is known and positive; otherwise 0. */
  playedRatio: number;
};

/** Cumulative session stats for analytics or completion gates. */
export type VideoPlayTracking = {
  /** Times playback started from idle (playCount increments on each `play` after pause or end). */
  playCount: number;
  hasStarted: boolean;
  /** Approximate seconds watched while the element was playing (not wall-clock). */
  watchedSeconds: number;
  completed: boolean;
};

export type VideoPlayerProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "onProgress"> & {
  /**
   * Fires during playback with throttled time updates (see `progressThrottleMs`).
   * Replaces the native `progress` (buffering) callback; use a ref + `addEventListener('progress', …)` if you need buffer events.
   */
  onProgress?: (info: VideoProgressInfo) => void;
  /** Called when play tracking fields change (play count, watched time, completion). */
  onPlayTrackingChange?: (tracking: VideoPlayTracking) => void;
  /** Minimum interval between `onProgress` calls while playing, in ms. Default 250. */
  progressThrottleMs?: number;
  wrapClassName?: string;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(1, Math.max(0, n));
}

export type VideoPlayerHandle = {
  getVideoElement: () => HTMLVideoElement | null;
  getPlayTracking: () => VideoPlayTracking;
};

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  {
    className,
    wrapClassName,
    onPlayTrackingChange,
    onProgress,
    progressThrottleMs = 250,
    onPlay,
    onPause,
    onEnded,
    onSeeking,
    onSeeked,
    onTimeUpdate,
    ...rest
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastProgressEmitRef = useRef(0);
  const lastWatchTickRef = useRef<number | null>(null);
  const [tracking, setTracking] = useState<VideoPlayTracking>({
    playCount: 0,
    hasStarted: false,
    watchedSeconds: 0,
    completed: false,
  });

  const trackingRef = useRef(tracking);
  trackingRef.current = tracking;

  const emitTracking = useCallback((updater: (prev: VideoPlayTracking) => VideoPlayTracking) => {
    setTracking(updater);
  }, []);

  const prevTrackingRef = useRef<VideoPlayTracking>(tracking);
  const watchedDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPlayTracking = useCallback(() => {
    if (!onPlayTrackingChange) {
      return;
    }
    if (watchedDebounceTimerRef.current) {
      clearTimeout(watchedDebounceTimerRef.current);
      watchedDebounceTimerRef.current = null;
    }
    onPlayTrackingChange(trackingRef.current);
  }, [onPlayTrackingChange]);

  useEffect(() => {
    if (!onPlayTrackingChange) {
      prevTrackingRef.current = tracking;
      return () => {
        if (watchedDebounceTimerRef.current) {
          clearTimeout(watchedDebounceTimerRef.current);
          watchedDebounceTimerRef.current = null;
        }
      };
    }
    const prev = prevTrackingRef.current;
    const discreteChanged =
      prev.playCount !== tracking.playCount ||
      prev.hasStarted !== tracking.hasStarted ||
      prev.completed !== tracking.completed;
    prevTrackingRef.current = tracking;

    if (discreteChanged) {
      if (watchedDebounceTimerRef.current) {
        clearTimeout(watchedDebounceTimerRef.current);
        watchedDebounceTimerRef.current = null;
      }
      onPlayTrackingChange(tracking);
      return () => {
        if (watchedDebounceTimerRef.current) {
          clearTimeout(watchedDebounceTimerRef.current);
          watchedDebounceTimerRef.current = null;
        }
      };
    }

    if (prev.watchedSeconds === tracking.watchedSeconds) {
      return () => {
        if (watchedDebounceTimerRef.current) {
          clearTimeout(watchedDebounceTimerRef.current);
          watchedDebounceTimerRef.current = null;
        }
      };
    }

    if (watchedDebounceTimerRef.current) {
      clearTimeout(watchedDebounceTimerRef.current);
    }
    watchedDebounceTimerRef.current = setTimeout(() => {
      watchedDebounceTimerRef.current = null;
      onPlayTrackingChange(trackingRef.current);
    }, 750);

    return () => {
      if (watchedDebounceTimerRef.current) {
        clearTimeout(watchedDebounceTimerRef.current);
        watchedDebounceTimerRef.current = null;
      }
    };
  }, [tracking, onPlayTrackingChange]);

  const emitProgress = useCallback(
    (video: HTMLVideoElement, force = false) => {
      if (!onProgress) {
        return;
      }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (!force && now - lastProgressEmitRef.current < progressThrottleMs) {
        return;
      }
      lastProgressEmitRef.current = now;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const currentTime = video.currentTime;
      const playedRatio = duration > 0 ? clamp01(currentTime / duration) : 0;
      onProgress({ currentTime, duration, playedRatio });
    },
    [onProgress, progressThrottleMs],
  );

  useImperativeHandle(
    ref,
    () => ({
      getVideoElement: () => videoRef.current,
      getPlayTracking: () => tracking,
    }),
    [tracking],
  );

  useEffect(() => {
    lastWatchTickRef.current = null;
  }, [rest.src]);

  const handlePlay = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      lastWatchTickRef.current = video.currentTime;
      emitTracking((prev) => ({
        ...prev,
        playCount: prev.playCount + 1,
        hasStarted: true,
        completed: false,
      }));
      onPlay?.(e);
    },
    [emitTracking, onPlay],
  );

  const handlePause = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      lastWatchTickRef.current = null;
      flushPlayTracking();
      onPause?.(e);
    },
    [flushPlayTracking, onPause],
  );

  const handleEnded = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      lastWatchTickRef.current = null;
      const video = e.currentTarget;
      emitProgress(video, true);
      emitTracking((prev) => ({
        ...prev,
        completed: true,
      }));
      onEnded?.(e);
    },
    [emitProgress, emitTracking, onEnded],
  );

  const handleSeeking = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      lastWatchTickRef.current = e.currentTarget.currentTime;
      onSeeking?.(e);
    },
    [onSeeking],
  );

  const handleSeeked = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      lastWatchTickRef.current = e.currentTarget.currentTime;
      onSeeked?.(e);
    },
    [onSeeked],
  );

  const handleTimeUpdate = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      onTimeUpdate?.(e);

      if (!video.paused && !video.seeking && lastWatchTickRef.current !== null) {
        const delta = Math.max(0, video.currentTime - lastWatchTickRef.current);
        if (delta > 0) {
          emitTracking((prev) => {
            const nextWatched = prev.watchedSeconds + delta;
            const duration = video.duration;
            const capped =
              Number.isFinite(duration) && duration > 0 ? Math.min(duration, nextWatched) : nextWatched;
            return { ...prev, watchedSeconds: capped };
          });
        }
      }
      lastWatchTickRef.current = video.currentTime;

      emitProgress(video);
    },
    [emitProgress, emitTracking, onTimeUpdate],
  );

  return (
    <div className={cx(styles.wrap, wrapClassName)}>
      <video
        ref={videoRef}
        className={cx(styles.video, className)}
        {...rest}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
});
