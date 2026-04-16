import type { ReactElement, ReactNode } from "react";
import { useId } from "react";

import { cx } from "../internal/cx";
import { QuizValidationErrors } from "./quiz-validation-errors";
import styles from "./quiz-shell.module.css";

export type QuizShellProps = {
  title: string;
  description?: ReactNode;
  /** Optional timer node — use `QuizTimer` or pass `null` to omit. */
  timer?: ReactNode;
  /** Optional question navigation — use `QuizQuestionNav`. */
  questionNav?: ReactNode;
  children: ReactNode;
  validationErrors?: string[];
  actions?: ReactNode;
  statusMessage?: ReactNode;
  className?: string;
};

export function QuizShell({
  title,
  description,
  timer,
  questionNav,
  children,
  validationErrors = [],
  actions,
  statusMessage,
  className,
}: QuizShellProps): ReactElement {
  const errId = useId();
  const titleId = useId();

  return (
    <section className={cx(styles.root, className)} aria-labelledby={titleId}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {description ? <div className={styles.description}>{description}</div> : null}
        </div>
        {timer ?? null}
      </div>

      {questionNav ?? null}

      <QuizValidationErrors id={errId} errors={validationErrors} />

      <div
        className={styles.body}
        aria-invalid={validationErrors.length > 0 ? true : undefined}
        aria-describedby={validationErrors.length > 0 ? errId : undefined}
      >
        {children}
      </div>

      {actions ?? null}

      {statusMessage ? (
        <p className={styles.status} role="status">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
