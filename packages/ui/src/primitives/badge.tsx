import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { cx } from "../internal/cx";
import styles from "./badge.module.css";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "error";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

const variantClass: Record<BadgeVariant, string> = {
  neutral: styles.neutral,
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx(styles.badge, variantClass[variant], className)} {...rest}>
      {children}
    </span>
  );
});
