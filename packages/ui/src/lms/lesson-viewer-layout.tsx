import type { ComponentType, HTMLAttributes, ReactElement, ReactNode } from "react";

import { cx } from "../internal/cx";
import { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from "../patterns/breadcrumb";
import styles from "./lesson-viewer-layout.module.css";

export type LessonViewerLayoutProps = {
  breadcrumbProps?: Omit<BreadcrumbProps, "items">;
  breadcrumbItems: BreadcrumbItem[];
  title: string;
  /** Forwarded to `<h1>` for `aria-labelledby` targets. */
  titleId?: string;
  /** Renders in the sticky sidebar on large viewports; place the same outline in a drawer on small viewports at the route level when needed. */
  outline: ReactNode;
  /** Landmark label for the outline panel (desktop sidebar). */
  outlineLabel?: string;
  children: ReactNode;
  /** Shown prominently below the header on small viewports only. */
  nextLesson?: {
    label: string;
    href: string;
  } | null;
  LinkComponent?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
  /** `aria-label` on `<main>` when the page needs more than the heading for context. */
  mainAriaLabel?: string;
};

export type LessonViewerReadingMeasureProps = HTMLAttributes<HTMLDivElement>;

/** Wraps reading / prose blocks with the design-system ~65ch measure (video and other media can sit outside this wrapper). */
export function LessonViewerReadingMeasure({
  className,
  ...rest
}: LessonViewerReadingMeasureProps): ReactElement {
  return <div className={cx(styles.readingMeasure, className)} {...rest} />;
}

function DefaultNextLessonLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function LessonViewerLayout({
  breadcrumbProps,
  breadcrumbItems,
  title,
  titleId,
  outline,
  outlineLabel = "Course outline",
  children,
  nextLesson,
  LinkComponent,
  mainAriaLabel,
}: LessonViewerLayoutProps): ReactElement {
  const L = LinkComponent ?? DefaultNextLessonLink;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Breadcrumb items={breadcrumbItems} {...breadcrumbProps} />
        <h1 className={styles.title} id={titleId}>
          {title}
        </h1>
      </header>

      <div className={styles.body}>
        <aside className={styles.outlineAside} aria-label={outlineLabel}>
          {outline}
        </aside>

        <div className={styles.mainColumn}>
          {nextLesson ? (
            <div className={styles.nextLessonMobile}>
              <L href={nextLesson.href} className={styles.nextLessonLink}>
                {nextLesson.label}
              </L>
            </div>
          ) : null}

          <main className={styles.mainLandmark} aria-label={mainAriaLabel}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
