import type { ReactElement, ReactNode } from "react";
import { useId } from "react";

import { cx } from "../internal/cx";
import { QuizValidationErrors } from "./quiz-validation-errors";
import styles from "./quiz-shell.module.css";

export type QuizShellProps = {
  title: string;
  /** Use `3` when the shell sits under a page-level `h2` (e.g. course view) to preserve heading order. */
  titleHeadingLevel?: 2 | 3;
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
  titleHeadingLevel = 2,
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
  const TitleTag = titleHeadingLevel === 3 ? "h3" : "h2";

  return (
    <section className={cx(styles.root, className)} aria-labelledby={titleId}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <TitleTag id={titleId} className={styles.title}>
            {title}
          </TitleTag>
          {description ? <div className={styles.description}>{description}</div> : null}
        </div>
        {timer ?? null}
      </div>

      {questionNav ?? null}

      <QuizValidationErrors id={errId} errors={validationErrors} />

      <div className={styles.body}>{children}</div>

      {actions ?? null}

      {statusMessage ? (
        <p className={styles.status} role="status">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
