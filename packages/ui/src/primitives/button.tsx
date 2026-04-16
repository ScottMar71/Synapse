import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { cx } from "../internal/cx";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-busy"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  tertiary: styles.tertiary,
  destructive: styles.destructive,
};

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    className,
    type = "button",
    ...rest
  },
  ref,
) {
  const busy = Boolean(loading);
  return (
    <button
      ref={ref}
      type={type}
      className={cx(styles.button, variantClass[variant], sizeClass[size], className)}
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {busy ? <span className={styles.spinner} aria-hidden /> : null}
      {children}
    </button>
  );
});
