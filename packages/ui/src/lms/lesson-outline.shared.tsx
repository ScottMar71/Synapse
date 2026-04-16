import type { ReactElement, ReactNode } from "react";

import type { LessonOutlineLesson, LessonOutlineLessonType } from "./lesson-outline.types";

export function typeMeta(type: LessonOutlineLessonType): { glyph: string; label: string } {
  switch (type) {
    case "video":
      return { glyph: "▶", label: "Video" };
    case "reading":
      return { glyph: "¶", label: "Reading" };
    case "quiz":
      return { glyph: "?", label: "Quiz" };
    case "assignment":
      return { glyph: "✎", label: "Assignment" };
    case "scorm":
      return { glyph: "⬡", label: "SCORM" };
    case "mixed":
      return { glyph: "◆", label: "Mixed content" };
    default:
      return { glyph: "•", label: "Lesson" };
  }
}

export function DefaultLessonLink({
  href,
  className,
  children,
  "aria-current": ariaCurrent,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | boolean | undefined;
  "aria-label"?: string;
}): ReactElement {
  return (
    <a href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

export function lessonAriaLabel(
  lesson: LessonOutlineLesson,
  typeLabel: string,
  durationLabel: string | undefined,
): string {
  return [lesson.title, typeLabel, durationLabel, lesson.completed ? "Completed" : "Not completed"]
    .filter(Boolean)
    .join(". ");
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
