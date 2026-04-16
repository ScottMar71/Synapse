import type { ReactElement } from "react";
import { useId } from "react";

import { cx } from "../internal/cx";
import styles from "./quiz-shell.module.css";

export type QuizTimerProps = {
  /** Seconds left on the attempt clock (clamped to ≥ 0 in display). */
  secondsRemaining: number;
  /** When remaining time is at or below this, timer enters warning styling and live status text. */
  warnBelowSeconds?: number;
  className?: string;
};

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m)}:${String(r).padStart(2, "0")}`;
}

export function QuizTimer({
  secondsRemaining,
  warnBelowSeconds = 60,
  className,
}: QuizTimerProps): ReactElement {
  const safe = Math.max(0, secondsRemaining);
  const warn = safe > 0 && safe <= warnBelowSeconds;
  const labelId = useId();
  const ariaLabel = warn
    ? `Time remaining ${formatDuration(safe)}. Warning: ${String(warnBelowSeconds)} seconds or less.`
    : `Time remaining ${formatDuration(safe)}`;

  return (
    <div
      className={cx(styles.timer, warn ? styles.timerWarn : undefined, className)}
      role={warn ? "status" : undefined}
      aria-live={warn ? "polite" : undefined}
      aria-labelledby={labelId}
      aria-label={ariaLabel}
    >
      <span className={styles.timerLabel} id={labelId}>
        Time remaining
      </span>
      <span aria-hidden>{formatDuration(safe)}</span>
    </div>
  );
}
