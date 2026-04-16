"use client";

import type { ReactElement, ReactNode } from "react";
import { useId, useRef } from "react";

import { cx } from "../internal/cx";
import { useBodyScrollLock } from "../internal/use-body-scroll-lock";
import { useOverlayFocus } from "../internal/use-overlay-focus";
import styles from "./modal.module.css";

export type ModalWidth = "sm" | "md" | "lg";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Dialog width; maps to `--size-modal-width-*` tokens. */
  width?: ModalWidth;
  /**
   * When false, backdrop clicks do nothing (use for confirmations where dismissal must be explicit).
   * For destructive flows, prefer `closeOnBackdropClick={false}` and require Cancel / primary actions.
   */
  closeOnBackdropClick?: boolean;
  /** When false, Escape does not close (pair with `closeOnBackdropClick` for strict confirmations). */
  closeOnEscape?: boolean;
  className?: string;
};

const widthClass: Record<ModalWidth, string> = {
  sm: styles.widthSm,
  md: styles.widthMd,
  lg: styles.widthLg,
};

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
}: ModalProps): ReactElement | null {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);

  useOverlayFocus({
    open,
    rootRef: panelRef,
    lastFocusRef,
    escapeDismisses: closeOnEscape,
    onEscape: onClose,
  });

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className={styles.backdrop}
        aria-hidden="true"
        onClick={() => {
          if (closeOnBackdropClick) {
            onClose();
          }
        }}
      />
      <div className={styles.dialogWrap} aria-hidden="false">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cx(styles.dialog, widthClass[width], className)}
          tabIndex={-1}
        >
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
              ×
            </button>
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </>
  );
}
