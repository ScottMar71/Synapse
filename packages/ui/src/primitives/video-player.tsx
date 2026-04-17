"use client";

import type { ReactNode, SyntheticEvent, VideoHTMLAttributes } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { cx } from "../internal/cx";
import { Spinner } from "./spinner";
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

/**
 * Caption track aligned with `lessonVideoCaptionTrackSchema` in `@conductor/contracts` (props-only; no I/O).
 */
export type VideoCaptionTrack = {
  src: string;
  label: string;
  srclang: string;
  isDefault?: boolean;
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
  /** WebVTT (or other) tracks rendered as `<track kind="subtitles" />` children. */
  captions?: VideoCaptionTrack[];
  /**
   * When `playedRatio` reaches this value (0–1), `onWatchedThresholdReached` fires once per `src` until the source changes.
   * Default 0.8 (80%).
   */
  watchedThreshold?: number;
  /** Fires once per `src` when the viewer reaches `watchedThreshold` of the duration. */
  onWatchedThresholdReached?: () => void;
  /** Optional copy for the inline error overlay (defaults to a generic unavailable message). */
  unavailableMessage?: string;
  /** Replace the default error overlay (still sets `role="alert"` on the wrapper when default is used). */
  renderError?: (ctx: { onRetry: () => void }) => ReactNode;
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
    onWaiting,
    onPlaying,
    onCanPlay,
    onError,
    captions,
    watchedThreshold: watchedThresholdProp = 0.8,
    onWatchedThresholdReached,
    unavailableMessage = "Video unavailable. Try again later.",
    renderError,
    ...rest
  },
  ref,
) {
  const watchedThreshold = clamp01(watchedThresholdProp);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastProgressEmitRef = useRef(0);
  const lastWatchTickRef = useRef<number | null>(null);
  const watchedThresholdFiredRef = useRef(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
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
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const currentTime = video.currentTime;
      const playedRatio = duration > 0 ? clamp01(currentTime / duration) : 0;

      if (onWatchedThresholdReached && !watchedThresholdFiredRef.current && playedRatio >= watchedThreshold) {
        watchedThresholdFiredRef.current = true;
        onWatchedThresholdReached();
      }

      if (!onProgress) {
        return;
      }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (!force && now - lastProgressEmitRef.current < progressThrottleMs) {
        return;
      }
      lastProgressEmitRef.current = now;
      onProgress({ currentTime, duration, playedRatio });
    },
    [onProgress, progressThrottleMs, onWatchedThresholdReached, watchedThreshold],
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
    watchedThresholdFiredRef.current = false;
    setLoadFailed(false);
  }, [rest.src]);

  const handleRetry = useCallback(() => {
    setLoadFailed(false);
    const el = videoRef.current;
    el?.load();
  }, []);

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

  const handleWaiting = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      setIsBuffering(true);
      onWaiting?.(e);
    },
    [onWaiting],
  );

  const handlePlaying = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      setIsBuffering(false);
      onPlaying?.(e);
    },
    [onPlaying],
  );

  const handleCanPlay = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      setIsBuffering(false);
      onCanPlay?.(e);
    },
    [onCanPlay],
  );

  const handleError = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      setLoadFailed(true);
      setIsBuffering(false);
      onError?.(e);
    },
    [onError],
  );

  const errorOverlay =
    loadFailed &&
    (renderError ? (
      renderError({ onRetry: handleRetry })
    ) : (
      <div className={styles.errorOverlay} role="alert">
        <p className={styles.errorText}>{unavailableMessage}</p>
        <button type="button" className={styles.retryButton} onClick={handleRetry}>
          Retry
        </button>
      </div>
    ));

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
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onCanPlay={handleCanPlay}
        onError={handleError}
      >
        {captions?.map((c, i) => (
          <track
            key={`${c.srclang}-${c.src}-${i}`}
            kind="subtitles"
            src={c.src}
            label={c.label}
            srcLang={c.srclang}
            default={c.isDefault}
          />
        ))}
      </video>
      {isBuffering && !loadFailed ? (
        <div className={styles.bufferingOverlay} aria-hidden="true">
          <Spinner label="Buffering video" size="sm" />
        </div>
      ) : null}
      {errorOverlay}
    </div>
  );
});
