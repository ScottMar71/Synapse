import type { CSSProperties, ReactElement } from "react";

import { cx } from "../internal/cx";
import styles from "./skeleton.module.css";

export type SkeletonProps = {
  /** Rough visual variant */
  variant?: "line" | "block" | "circle";
  className?: string;
  style?: CSSProperties;
};

/**
 * Indeterminate loading shape. Parent should set `aria-busy` and an accessible label (e.g. `aria-label`).
 */
export function Skeleton({ variant = "line", className, style }: SkeletonProps): ReactElement {
  return (
    <span
      className={cx(
        styles.root,
        variant === "line" && styles.line,
        variant === "block" && styles.block,
        variant === "circle" && styles.circle,
        className,
      )}
      style={style}
      aria-hidden="true"
    />
  );
}
