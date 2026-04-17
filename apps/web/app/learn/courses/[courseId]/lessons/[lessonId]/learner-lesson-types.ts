import type {
  LessonExternalLinkDto,
  LessonGlossaryEntryDto,
  LessonMixedBlockLearner
} from "@conductor/contracts";
import type { LessonNavigationModule, LessonOutlineModule } from "@conductor/ui";

export const READING_SCROLL_COMPLETE_RATIO = 0.9;

export type ReadyReading = {
  status: "ready";
  variant: "reading";
  courseTitle: string;
  lessonTitle: string;
  html: string | null;
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
  lessonLinks: LessonExternalLinkDto[];
  lessonGlossary: LessonGlossaryEntryDto[];
  lessonOutlineModules: LessonOutlineModule[];
  navigationModules: LessonNavigationModule[];
};

export type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ReadyReading
  | ReadyMixed;

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
