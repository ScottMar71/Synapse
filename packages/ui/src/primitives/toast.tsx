"use client";

import type { ReactElement, ReactNode } from "react";

import { cx } from "../internal/cx";
import styles from "./toast.module.css";

export type ToastTone = "neutral" | "success" | "error";

export type ToastProps = {
  children: ReactNode;
  /**
   * `error` maps to `role="alert"` (assertive). Other tones use `role="status"` (polite).
   * @see lms-design-system §3.1 Toast
   */
  tone?: ToastTone;
  className?: string;
};

const toneClass: Record<ToastTone, string> = {
  neutral: styles.neutral,
  success: styles.success,
  error: styles.error,
};

export function Toast({ children, tone = "neutral", className }: ToastProps): ReactElement {
  const role = tone === "error" ? "alert" : "status";
  return (
    <div className={cx(styles.root, toneClass[tone], className)} role={role}>
      {children}
    </div>
  );
}
