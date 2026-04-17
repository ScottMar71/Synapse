"use client";

import type { LessonMixedBlockLearner } from "@conductor/contracts";
import { LessonViewerReadingMeasure, VideoPlayer } from "@conductor/ui";
import { Component, type ReactElement, type ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

import styles from "./reading-lesson-view.module.css";

type SegmentBoundaryProps = { children: ReactNode; segmentLabel: string };
type SegmentBoundaryState = { hasError: boolean };

class MixedSegmentErrorBoundary extends Component<SegmentBoundaryProps, SegmentBoundaryState> {
  public state: SegmentBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): SegmentBoundaryState {
    return { hasError: true };
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" className={styles.segmentError}>
          {this.props.segmentLabel}: this segment could not be displayed. You can still continue
          with the rest of the lesson.
        </div>
      );
    }
    return this.props.children;
  }
}

export type MixedLessonSegmentsProps = {
  blocks: LessonMixedBlockLearner[];
  onAllVideoThresholdsMetChange: (met: boolean) => void;
};

export function MixedLessonSegments({
  blocks,
  onAllVideoThresholdsMetChange
}: MixedLessonSegmentsProps): ReactElement {
  const videoDoneRef = useRef<Set<string>>(new Set());

  const recomputeVideoMet = useCallback(() => {
    const videoIds = blocks.filter((b) => b.blockType === "VIDEO").map((b) => b.id);
    if (videoIds.length === 0) {
      onAllVideoThresholdsMetChange(true);
      return;
    }
    const met = videoIds.every((id) => videoDoneRef.current.has(id));
    onAllVideoThresholdsMetChange(met);
  }, [blocks, onAllVideoThresholdsMetChange]);

  useEffect(() => {
    videoDoneRef.current = new Set();
    recomputeVideoMet();
  }, [blocks, recomputeVideoMet]);

  const onVideoThresholdReached = useCallback(
    (blockId: string) => {
      videoDoneRef.current.add(blockId);
      recomputeVideoMet();
    },
    [recomputeVideoMet]
  );

  return (
    <div>
      {blocks.map((block, index) => {
        const label = `Segment ${index + 1}`;
        if (block.blockType === "READING") {
          return (
            <section
              key={block.id}
              className={styles.mixedSegment}
              aria-label={label}
            >
              <MixedSegmentErrorBoundary segmentLabel={label}>
                <LessonViewerReadingMeasure>
                  {block.html ? (
                    <div
                      className={styles.readingHtml}
                      dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                  ) : (
                    <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                      No reading content has been added for this segment yet.
                    </p>
                  )}
                </LessonViewerReadingMeasure>
              </MixedSegmentErrorBoundary>
            </section>
          );
        }

        return (
          <section key={block.id} className={styles.mixedSegment} aria-label={label}>
            <MixedSegmentErrorBoundary segmentLabel={label}>
              <VideoPlayer
                src={block.video.src}
                poster={block.video.poster ?? undefined}
                captions={block.video.captions}
                controls
                playsInline
                aria-label={`Video segment ${index + 1}`}
                onWatchedThresholdReached={() => {
                  onVideoThresholdReached(block.id);
                }}
              />
            </MixedSegmentErrorBoundary>
          </section>
        );
      })}
    </div>
  );
}
