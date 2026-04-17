"use client";

import type { LessonScormPackageDto, LessonScormSessionDto } from "@conductor/contracts";
import { Button } from "@conductor/ui";
import type { ReactElement, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { buildScormAssetBrowserUrl } from "../../../../../../lib/scorm-launch-url";
import type { LmsApiSession } from "../../../../../../lib/lms-api-client";

import { attachScorm12ApiToWindow } from "./scorm-12-runtime";
import styles from "./learner-scorm-panel.module.css";

export type LearnerScormPanelProps = {
  session: LmsApiSession;
  courseId: string;
  lessonId: string;
  pkg: LessonScormPackageDto;
  initialSession: LessonScormSessionDto;
  onSessionPersisted: (session: LessonScormSessionDto) => void;
};

export function LearnerScormPanel({
  session,
  courseId,
  lessonId,
  pkg,
  initialSession,
  onSessionPersisted
}: LearnerScormPanelProps): ReactElement {
  const [frameBusy, setFrameBusy] = useState(true);
  const [frameError, setFrameError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const launchPath = pkg.launchPath?.trim() ?? "";
  const src =
    launchPath.length > 0
      ? buildScormAssetBrowserUrl(session.tenantId, courseId, lessonId, launchPath)
      : "";

  useEffect(() => {
    if (src.length === 0) {
      return;
    }
    const detach = attachScorm12ApiToWindow({
      session,
      courseId,
      lessonId,
      initialSession,
      onSessionPersisted: (next) => {
        onSessionPersisted(next);
      }
    });
    return () => {
      detach();
    };
  }, [session, courseId, lessonId, initialSession, onSessionPersisted, src]);

  const requestFullscreen = useCallback((): void => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const anyEl = el as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    if (typeof el.requestFullscreen === "function") {
      void el.requestFullscreen();
    } else if (typeof anyEl.webkitRequestFullscreen === "function") {
      void anyEl.webkitRequestFullscreen();
    }
  }, []);

  if (src.length === 0) {
    return (
      <div className={styles.shell} role="alert">
        <p className={styles.error}>This SCORM package does not have a launch file yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <Button type="button" variant="secondary" size="sm" onClick={requestFullscreen}>
          Fullscreen player
        </Button>
        {frameBusy ? (
          <p className={styles.statusLoading} role="status" aria-live="polite">
            Loading SCORM…
          </p>
        ) : null}
      </div>

      <div
        ref={containerRef as RefObject<HTMLDivElement | null>}
        className={`${styles.frameWrap} scorm-runtime-host`}
      >
        <iframe
          key={`${pkg.id}-${pkg.updatedAt}`}
          title="SCORM lesson"
          className={`${styles.frame} scorm-runtime-frame`}
          src={src}
          allow="fullscreen; autoplay; clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
          onLoad={() => {
            setFrameBusy(false);
            setFrameError(null);
          }}
          onError={() => {
            setFrameBusy(false);
            setFrameError("The SCORM player could not be loaded.");
          }}
        />
      </div>

      {frameError ? (
        <p className={styles.error} role="alert">
          {frameError}
        </p>
      ) : null}

      <details className={styles.details}>
        <summary>Browser and runtime notes</summary>
        <ul className={styles.hint}>
          <li>
            Only <strong>SCORM 1.2</strong> packages are supported. SCORM 2004 uploads are rejected
            during processing.
          </li>
          <li>
            The lesson player exposes a minimal SCORM 1.2 <code>API</code> on this page so content
            can save progress. Packages that need a full RTE or Flash will not work in modern
            browsers.
          </li>
          <li>
            The SCORM view is embedded in an iframe with <code>allow-same-origin</code> so relative
            assets load from the LMS. Third-party cookies are not required.
          </li>
        </ul>
      </details>
    </div>
  );
}
