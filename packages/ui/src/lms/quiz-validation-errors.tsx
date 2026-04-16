import type { ReactElement } from "react";

import { cx } from "../internal/cx";
import styles from "./quiz-shell.module.css";

export type QuizValidationErrorsProps = {
  errors: string[];
  id?: string;
  className?: string;
};

/** Surface field-level issues with icon + text (not color-only). */
export function QuizValidationErrors({ errors, id, className }: QuizValidationErrorsProps): ReactElement | null {
  if (errors.length === 0) {
    return null;
  }
  return (
    <ul id={id} className={cx(styles.validation, className)} role="list">
      {errors.map((msg, i) => (
        <li key={`${String(i)}-${msg}`} className={styles.validationItem}>
          <span className={styles.validationIcon} aria-hidden>
            !
          </span>
          <span>{msg}</span>
        </li>
      ))}
    </ul>
  );
}
