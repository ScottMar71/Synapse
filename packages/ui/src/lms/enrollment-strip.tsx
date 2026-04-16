import type { ReactElement, ReactNode } from "react";

import { cx } from "../internal/cx";
import { Button } from "../primitives/button";
import buttonStyles from "../primitives/button.module.css";
import styles from "./enrollment-strip.module.css";

export type EnrollmentStripProps = {
  enrollLabel?: string;
  enrollHref?: string;
  onEnroll?: () => void;
  previewLabel?: string;
  previewHref?: string;
  onPreviewSyllabus?: () => void;
  requirementsCaption?: ReactNode;
  className?: string;
  "aria-busy"?: boolean | "true" | "false";
};

function AnchorSecondary({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): ReactElement {
  return (
    <a href={href} className={cx(buttonStyles.button, buttonStyles.secondary, buttonStyles.md)}>
      {children}
    </a>
  );
}

export function EnrollmentStrip({
  enrollLabel = "Enroll",
  enrollHref,
  onEnroll,
  previewLabel = "Preview syllabus",
  previewHref,
  onPreviewSyllabus,
  requirementsCaption,
  className,
  "aria-busy": ariaBusy,
}: EnrollmentStripProps): ReactElement {
  const enrollBusy = ariaBusy === true || ariaBusy === "true";

  return (
    <section className={cx(styles.strip, className)} aria-label="Enrollment">
      <div className={styles.row}>
        {enrollHref ? (
          <a
            href={enrollHref}
            className={cx(buttonStyles.button, buttonStyles.primary, buttonStyles.md)}
            aria-busy={enrollBusy || undefined}
          >
            {enrollLabel}
          </a>
        ) : (
          <Button variant="primary" size="md" type="button" onClick={onEnroll} loading={enrollBusy}>
            {enrollLabel}
          </Button>
        )}

        {previewHref ? (
          <AnchorSecondary href={previewHref}>{previewLabel}</AnchorSecondary>
        ) : onPreviewSyllabus ? (
          <Button variant="secondary" size="md" type="button" onClick={onPreviewSyllabus}>
            {previewLabel}
          </Button>
        ) : null}
      </div>
      {requirementsCaption ? <p className={styles.caption}>{requirementsCaption}</p> : null}
    </section>
  );
}
