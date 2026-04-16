import type { ReactElement } from "react";

import { cx } from "../internal/cx";
import styles from "./progress.module.css";

export type ProgressProps = {
  /** Current value (clamped to [0, max]). */
  value: number;
  max?: number;
  /** Visible label; also used for `aria-label` on the progressbar. */
  label: string;
  className?: string;
};

export function Progress({ value, max = 100, label, className }: ProgressProps): ReactElement {
  const safeMax = max > 0 ? max : 100;
  const pct = Math.round(Math.min(100, Math.max(0, (Number.isFinite(value) ? value : 0) / safeMax) * 100));
  const ariaNow = Math.min(safeMax, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <div className={cx(styles.wrap, className)}>
      <div className={styles.label}>{label}</div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={ariaNow}
        aria-label={label}
        className={styles.track}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
