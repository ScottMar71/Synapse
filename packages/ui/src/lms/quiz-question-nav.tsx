import type { ReactElement } from "react";

import { cx } from "../internal/cx";
import { Button } from "../primitives/button";
import styles from "./quiz-shell.module.css";

export type QuizQuestionNavProps = {
  currentIndex: number;
  total: number;
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  flagged?: boolean;
  onFlagToggle?: () => void;
  flagLabel?: string;
  className?: string;
};

export function QuizQuestionNav({
  currentIndex,
  total,
  onPrevious,
  onNext,
  disablePrevious = false,
  disableNext = false,
  flagged = false,
  onFlagToggle,
  flagLabel = "Flag for review",
  className,
}: QuizQuestionNavProps): ReactElement {
  const safeTotal = Math.max(1, total);
  const idx = Math.min(safeTotal, Math.max(1, currentIndex));

  return (
    <div className={cx(styles.nav, className)}>
      <p className={styles.navMeta}>
        Question {String(idx)} of {String(safeTotal)}
      </p>
      <div className={styles.navActions}>
        {onFlagToggle ? (
          <Button
            type="button"
            variant={flagged ? "secondary" : "tertiary"}
            size="md"
            onClick={onFlagToggle}
            aria-pressed={flagged}
            aria-label={flagged ? `${flagLabel} — flagged` : flagLabel}
          >
            {flagged ? "Flagged" : flagLabel}
          </Button>
        ) : null}
        {onPrevious ? (
          <Button type="button" variant="secondary" size="md" onClick={onPrevious} disabled={disablePrevious}>
            Previous
          </Button>
        ) : null}
        {onNext ? (
          <Button type="button" variant="secondary" size="md" onClick={onNext} disabled={disableNext}>
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}
