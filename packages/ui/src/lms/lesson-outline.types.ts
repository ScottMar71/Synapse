export type LessonOutlineLessonType =
  | "video"
  | "reading"
  | "quiz"
  | "assignment"
  | "scorm"
  | "mixed";

export type LessonOutlineLesson = {
  id: string;
  title: string;
  lessonType: LessonOutlineLessonType;
  durationMinutes?: number;
  completed?: boolean;
  current?: boolean;
  href?: string;
};

export type LessonOutlineModule = {
  id: string;
  title: string;
  lessons: LessonOutlineLesson[];
  /** Expanded on first paint when no lesson in the module is `current` and this is true. */
  defaultOpen?: boolean;
};
