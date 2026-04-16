import type { ReactElement } from "react";
import { useId } from "react";

import { cx } from "../internal/cx";
import styles from "./progress-tracker.module.css";

export type ProgressTrackerVariant = "ring" | "bar" | "checklist";

export type ProgressTrackerChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ProgressTrackerProps = {
  variant: ProgressTrackerVariant;
  completed: number;
  total: number;
  label?: string;
  className?: string;
  items?: ProgressTrackerChecklistItem[];
};

const MAX_SEGMENTS = 24;

function clampProgress(completed: number, total: number): { completed: number; total: number } {
  const safeTotal = total > 0 ? total : 1;
  const safeDone = Math.min(safeTotal, Math.max(0, Number.isFinite(completed) ? completed : 0));
  return { completed: safeDone, total: safeTotal };
}

function defaultLabel(completed: number, total: number): string {
  return `${completed} of ${total} lessons`;
}

function RingTracker({
  completed,
  total,
  label,
  className,
}: {
  completed: number;
  total: number;
  label: string;
  className?: string;
}): ReactElement {
  const labelId = useId();
  const { completed: done, total: cap } = clampProgress(completed, total);
  const pct = cap > 0 ? done / cap : 0;
  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className={cx(styles.ringHost, className)}>
      <div className={styles.ringLabel} id={labelId}>
        {label}
      </div>
      <svg
        className={styles.ringSvg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={done}
        aria-labelledby={labelId}
      >
        <circle
          className={styles.ringTrack}
          strokeWidth={stroke}
          fill="none"
          r={r}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={styles.ringFill}
          strokeWidth={stroke}
          fill="none"
          r={r}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${String(size / 2)} ${String(size / 2)})`}
        />
      </svg>
    </div>
  );
}

function BarTracker({
  completed,
  total,
  label,
  className,
}: {
  completed: number;
  total: number;
  label: string;
  className?: string;
}): ReactElement {
  const labelId = useId();
  const { completed: done, total: cap } = clampProgress(completed, total);
  const segments = Math.min(cap, MAX_SEGMENTS);
  const filled =
    cap > 0
      ? Math.min(segments, Math.max(0, Math.round((done / cap) * segments)))
      : 0;

  return (
    <div className={cx(styles.barHost, className)}>
      <div className={styles.barLabel} id={labelId}>
        {label}
      </div>
      <div
        className={styles.segments}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={done}
        aria-labelledby={labelId}
      >
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={`segment-slot-${String(index)}`}
            className={cx(styles.segment, index < filled ? styles.segmentFilled : undefined)}
          />
        ))}
      </div>
    </div>
  );
}

function ChecklistTracker({
  items,
  label,
  className,
}: {
  items: ProgressTrackerChecklistItem[];
  label: string;
  className?: string;
}): ReactElement {
  const labelId = useId();
  return (
    <div className={cx(styles.checklistHost, className)}>
      <p className={styles.checklistLabel} id={labelId}>
        {label}
      </p>
      <ul className={styles.checklist} aria-labelledby={labelId}>
        {items.map((item) => (
          <li key={item.id} className={styles.checkItem}>
            <span className={cx(styles.checkMark, item.done ? styles.checkDone : styles.checkTodo)} aria-hidden>
              {item.done ? "✓" : "○"}
            </span>
            <span className={styles.checkText}>{item.label}</span>
            <span className={styles.srOnly}>{item.done ? "Completed" : "Not completed"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressTracker({
  variant,
  completed,
  total,
  label,
  className,
  items = [],
}: ProgressTrackerProps): ReactElement {
  const { completed: done, total: cap } = clampProgress(completed, total);
  const resolvedLabel = label ?? defaultLabel(done, cap);

  if (variant === "checklist") {
    return <ChecklistTracker items={items} label={resolvedLabel} className={className} />;
  }

  if (variant === "ring") {
    return <RingTracker completed={done} total={cap} label={resolvedLabel} className={className} />;
  }

  return <BarTracker completed={done} total={cap} label={resolvedLabel} className={className} />;
}
