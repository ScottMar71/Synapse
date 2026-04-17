import type { ProgressDto, StaffCourseLessonOutlineDto } from "@conductor/contracts";
import type { LessonNavigationModule } from "@conductor/ui";
import type { LessonOutlineModule } from "@conductor/ui";

function lessonPath(courseId: string, lessonId: string): string {
  return `/learn/courses/${courseId}/lessons/${lessonId}`;
}

export function mapOutlineForLearner(
  outline: StaffCourseLessonOutlineDto,
  courseId: string,
  options?: { currentLessonId?: string; progress?: ProgressDto[] }
): { lessonOutlineModules: LessonOutlineModule[]; navigationModules: LessonNavigationModule[] } {
  const completed = new Set(
    (options?.progress ?? [])
      .filter(
        (p) =>
          p.courseId === courseId && p.scope === "LESSON" && p.lessonId != null && p.percent >= 100
      )
      .map((p) => p.lessonId as string)
  );
  const currentLessonId = options?.currentLessonId;

  const lessonOutlineModules: LessonOutlineModule[] = outline.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    defaultOpen: true,
    lessons: mod.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      lessonType:
        l.contentKind === "VIDEO"
          ? ("video" as const)
          : l.contentKind === "MIXED"
            ? ("mixed" as const)
            : ("reading" as const),
      href: lessonPath(courseId, l.id),
      current: l.id === currentLessonId,
      completed: completed.has(l.id)
    }))
  }));

  const navigationModules: LessonNavigationModule[] = outline.modules.map((mod) => ({
    id: mod.id,
    sortOrder: mod.sortOrder,
    lessons: mod.lessons.map((l) => ({
      id: l.id,
      sortOrder: l.sortOrder,
      title: l.title,
      href: lessonPath(courseId, l.id)
    }))
  }));

  return { lessonOutlineModules, navigationModules };
}
