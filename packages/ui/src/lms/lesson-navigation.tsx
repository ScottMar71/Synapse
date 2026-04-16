import type { ComponentType, ReactElement, ReactNode } from "react";

import { cx } from "../internal/cx";
import styles from "./lesson-navigation.module.css";

/** Module + lessons as returned from the API (or mapped for the outline). */
export type LessonNavigationModule = {
  id: string;
  sortOrder: number;
  lessons: Array<{
    id: string;
    sortOrder: number;
    title: string;
    href: string;
  }>;
};

export type LessonNavigationTarget = {
  id: string;
  title: string;
  href: string;
};

function compareBySortOrderThenId<T extends { sortOrder: number; id: string }>(a: T, b: T): number {
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }
  return a.id.localeCompare(b.id);
}

/**
 * Flattens lessons in **module order** (`module.sortOrder`), then **lesson order** within each module (`lesson.sortOrder`).
 * Returns the neighbours of `currentLessonId` in that sequence.
 */
export function getAdjacentLessonsByModuleOrder(
  modules: LessonNavigationModule[],
  currentLessonId: string
): { previous: LessonNavigationTarget | null; next: LessonNavigationTarget | null } {
  const orderedModules = [...modules].sort(compareBySortOrderThenId);
  const sequence: LessonNavigationTarget[] = orderedModules.flatMap((mod) =>
    [...mod.lessons].sort(compareBySortOrderThenId).map((l) => ({
      id: l.id,
      title: l.title,
      href: l.href
    }))
  );
  const index = sequence.findIndex((l) => l.id === currentLessonId);
  if (index < 0) {
    return { previous: null, next: null };
  }
  return {
    previous: index > 0 ? sequence[index - 1]! : null,
    next: index < sequence.length - 1 ? sequence[index + 1]! : null
  };
}

export type LessonNavigationProps = {
  previous?: LessonNavigationTarget | null;
  next?: LessonNavigationTarget | null;
  /** Landmark label for the `<nav>`. */
  "aria-label"?: string;
  previousDirectionLabel?: string;
  nextDirectionLabel?: string;
  className?: string;
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
    "aria-label"?: string;
  }>;
};

function DefaultLink({
  href,
  className,
  children,
  "aria-label": ariaLabel
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}): ReactElement {
  return (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

export function LessonNavigation({
  previous = null,
  next = null,
  "aria-label": ariaLabel = "Lesson navigation",
  previousDirectionLabel = "Previous lesson",
  nextDirectionLabel = "Next lesson",
  className,
  LinkComponent
}: LessonNavigationProps): ReactElement {
  const L = LinkComponent ?? DefaultLink;

  return (
    <nav aria-label={ariaLabel} className={cx(styles.root, className)}>
      <div className={styles.row}>
        <div className={styles.slotPrev}>
          {previous ? (
            <L
              href={previous.href}
              className={styles.link}
              aria-label={`${previousDirectionLabel}: ${previous.title}`}
            >
              <span className={styles.dir}>← {previousDirectionLabel}</span>
              <span className={styles.title}>{previous.title}</span>
            </L>
          ) : (
            <span className={styles.placeholder} aria-hidden />
          )}
        </div>
        <div className={styles.slotNext}>
          {next ? (
            <L
              href={next.href}
              className={styles.linkNext}
              aria-label={`${nextDirectionLabel}: ${next.title}`}
            >
              <span className={styles.dir}>{nextDirectionLabel} →</span>
              <span className={styles.title}>{next.title}</span>
            </L>
          ) : (
            <span className={styles.placeholder} aria-hidden />
          )}
        </div>
      </div>
    </nav>
  );
}
