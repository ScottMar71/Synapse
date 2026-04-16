import type { ReactElement } from "react";

import { cx } from "../internal/cx";
import styles from "./spinner.module.css";

export type SpinnerSize = "sm" | "md";

export type SpinnerProps = {
  /** Accessible name (e.g. "Loading"). Parent content regions should set `aria-busy="true"`. */
  label: string;
  size?: SpinnerSize;
  className?: string;
};

const sizeClass: Record<SpinnerSize, string> = {
  sm: styles.wrapSm,
  md: styles.wrapMd,
};

/**
 * Inline busy indicator. For page or section loads, also set `aria-busy="true"` on the
 * surrounding region (see design-system spec §4).
 */
export function Spinner({ label, size = "md", className }: SpinnerProps): ReactElement {
  return (
    <span className={cx(styles.wrap, sizeClass[size], className)} role="status" aria-live="polite">
      <span className={styles.srOnly}>{label}</span>
      <span className={styles.ring} aria-hidden="true" />
    </span>
  );
}
