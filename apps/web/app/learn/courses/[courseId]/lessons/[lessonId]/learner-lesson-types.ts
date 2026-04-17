import type {
  LessonExternalLinkDto,
  LessonFileAttachmentDto,
  LessonGlossaryEntryDto,
  LessonMixedBlockLearner,
  LessonScormPackageDto,
  LessonScormSessionDto,
  LessonVideoPlaybackDto,
  LessonWatchStateDto
} from "@conductor/contracts";
import type { LessonNavigationModule, LessonOutlineModule } from "@conductor/ui";

export const READING_SCROLL_COMPLETE_RATIO = 0.9;

export type ReadyReading = {
  status: "ready";
  variant: "reading";
  courseTitle: string;
  lessonTitle: string;
  html: string | null;
  lessonFiles: LessonFileAttachmentDto[];
  lessonLinks: LessonExternalLinkDto[];
  lessonGlossary: LessonGlossaryEntryDto[];
  lessonOutlineModules: LessonOutlineModule[];
  navigationModules: LessonNavigationModule[];
};

export type ReadyMixed = {
  status: "ready";
  variant: "mixed";
  courseTitle: string;
  lessonTitle: string;
  blocks: LessonMixedBlockLearner[];
  lessonFiles: LessonFileAttachmentDto[];
  lessonLinks: LessonExternalLinkDto[];
  lessonGlossary: LessonGlossaryEntryDto[];
  lessonOutlineModules: LessonOutlineModule[];
  navigationModules: LessonNavigationModule[];
};

export type ReadyVideo = {
  status: "ready";
  variant: "video";
  courseTitle: string;
  lessonTitle: string;
  /** Present when playback API returned a playable asset; otherwise see `playbackUnavailableMessage`. */
  video: LessonVideoPlaybackDto | null;
  /** Shown in the main stage when `video` is null (missing asset, fetch error, etc.). */
  playbackUnavailableMessage: string | null;
  initialWatchState: LessonWatchStateDto | null;
  resumeLoadWarning: string | null;
  lessonFiles: LessonFileAttachmentDto[];
  lessonLinks: LessonExternalLinkDto[];
  lessonGlossary: LessonGlossaryEntryDto[];
  lessonOutlineModules: LessonOutlineModule[];
  navigationModules: LessonNavigationModule[];
};

export type ReadyScorm = {
  status: "ready";
  variant: "scorm";
  courseTitle: string;
  lessonTitle: string;
  pkg: LessonScormPackageDto | null;
  initialSession: LessonScormSessionDto | null;
  scormUnavailableMessage: string | null;
  sessionLoadWarning: string | null;
  lessonFiles: LessonFileAttachmentDto[];
  lessonLinks: LessonExternalLinkDto[];
  lessonGlossary: LessonGlossaryEntryDto[];
  lessonOutlineModules: LessonOutlineModule[];
  navigationModules: LessonNavigationModule[];
};

export type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ReadyReading
  | ReadyMixed
  | ReadyVideo
  | ReadyScorm;

export function sortLessonFiles(files: LessonFileAttachmentDto[]): LessonFileAttachmentDto[] {
  return [...files].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

export function sortLessonLinks(links: LessonExternalLinkDto[]): LessonExternalLinkDto[] {
  return [...links].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

export function sortGlossaryEntries(entries: LessonGlossaryEntryDto[]): LessonGlossaryEntryDto[] {
  return [...entries].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

export function mixedScrollGatesMet(
  blocks: LessonMixedBlockLearner[],
  scrollRatio: number,
  mixedVideosReady: boolean
): boolean {
  const hasReading = blocks.some((b) => b.blockType === "READING");
  const hasVideo = blocks.some((b) => b.blockType === "VIDEO");
  const scrollOk = !hasReading || scrollRatio >= READING_SCROLL_COMPLETE_RATIO;
  const videosOk = !hasVideo || mixedVideosReady;
  return scrollOk && videosOk;
}
