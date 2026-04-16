import type { ReactElement } from "react";

import { cx } from "../internal/cx";
import { Button } from "../primitives/button";
import styles from "./quiz-shell.module.css";

export type QuizActionBarProps = {
  onSaveDraft?: () => void;
  saveDraftLabel?: string;
  onSubmit?: () => void;
  submitLabel?: string;
  onReview?: () => void;
  reviewLabel?: string;
  busy?: boolean;
  className?: string;
};

export function QuizActionBar({
  onSaveDraft,
  saveDraftLabel = "Save draft",
  onSubmit,
  submitLabel = "Submit attempt",
  onReview,
  reviewLabel = "Review answers",
  busy = false,
  className,
}: QuizActionBarProps): ReactElement {
  return (
    <div className={cx(styles.actionRow, className)}>
      {onSaveDraft ? (
        <Button type="button" variant="secondary" size="md" onClick={onSaveDraft} disabled={busy}>
          {saveDraftLabel}
        </Button>
      ) : null}
      {onReview ? (
        <Button type="button" variant="tertiary" size="md" onClick={onReview} disabled={busy}>
          {reviewLabel}
        </Button>
      ) : null}
      {onSubmit ? (
        <Button type="button" variant="primary" size="md" onClick={onSubmit} loading={busy}>
          {submitLabel}
        </Button>
      ) : null}
    </div>
  );
}
