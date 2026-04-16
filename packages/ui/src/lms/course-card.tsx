import type { HTMLAttributes, ReactNode } from "react";
import { useId } from "react";

import { cx } from "../internal/cx";
import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";
import { Card } from "../primitives/card";
import buttonStyles from "../primitives/button.module.css";
import type { ProgressTrackerChecklistItem, ProgressTrackerVariant } from "./progress-tracker";
import { ProgressTracker } from "./progress-tracker";
import styles from "./course-card.module.css";

export type CourseCardContext = "catalog" | "dashboard";

export type CourseCardPrimaryAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type CourseCardProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  meta?: ReactNode;
  badges?: ReactNode;
  context?: CourseCardContext;
  progress?: {
    completed: number;
    total: number;
    trackerVariant?: ProgressTrackerVariant;
    checklistItems?: ProgressTrackerChecklistItem[];
  } | null;
  primaryAction: CourseCardPrimaryAction;
  locked?: boolean;
  lockReason?: string;
};

function PrimaryCta({
  action,
  disabled,
  busy,
}: {
  action: CourseCardPrimaryAction;
  disabled: boolean;
  busy: boolean;
}): ReactNode {
  const { label, href, onClick } = action;
  if (disabled) {
    return (
      <Button variant="primary" size="md" type="button" disabled>
        {label}
      </Button>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        className={cx(buttonStyles.button, buttonStyles.primary, buttonStyles.md)}
        aria-busy={busy || undefined}
      >
        {label}
      </a>
    );
  }
  return (
    <Button variant="primary" size="md" type="button" onClick={onClick} loading={busy}>
      {label}
    </Button>
  );
}

export function CourseCard({
  title,
  thumbnailSrc,
  thumbnailAlt = "",
  meta,
  badges,
  context = "catalog",
  progress = null,
  primaryAction,
  locked = false,
  lockReason,
  className,
  ...rest
}: CourseCardProps): ReactNode {
  const titleId = useId();
  const showProgress = Boolean(progress) && !locked && progress !== null;
  const trackerVariant = progress?.trackerVariant ?? (context === "dashboard" ? "ring" : "bar");
  const resolvedVariant =
    trackerVariant === "checklist" && (progress?.checklistItems?.length ?? 0) === 0 ? "bar" : trackerVariant;
  const { "aria-busy": ariaBusy, ...cardProps } = rest;

  return (
    <Card variant="elevated" className={cx(styles.shell, className)} aria-busy={ariaBusy} {...cardProps}>
      <div className={styles.media}>
        {thumbnailSrc ? (
          <img className={styles.thumb} src={thumbnailSrc} alt={thumbnailAlt || title} />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden />
        )}
        {locked ? (
          <div className={styles.lockOverlay}>
            <span className={styles.lockBadge}>
              <Badge variant="warning">Locked</Badge>
            </span>
          </div>
        ) : null}
      </div>

      <div className={styles.body}>
        {badges ? <div className={styles.badges}>{badges}</div> : null}

        <h3 id={titleId} className={styles.title}>
          {title}
        </h3>

        {meta ? <div className={styles.meta}>{meta}</div> : null}

        {locked && lockReason ? (
          <p className={styles.lockReason} role="status">
            {lockReason}
          </p>
        ) : null}

        {showProgress && progress ? (
          <div className={styles.progress}>
            <ProgressTracker
              variant={resolvedVariant}
              completed={progress.completed}
              total={progress.total}
              items={progress.checklistItems}
            />
          </div>
        ) : null}

        <div className={styles.footer}>
          <PrimaryCta action={primaryAction} disabled={locked} busy={Boolean(ariaBusy)} />
        </div>
      </div>
    </Card>
  );
}
