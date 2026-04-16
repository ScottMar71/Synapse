"use client";

import type { ReactElement, ReactNode } from "react";
import { useId, useRef } from "react";

import { cx } from "../internal/cx";
import { useBodyScrollLock } from "../internal/use-body-scroll-lock";
import { useOverlayFocus } from "../internal/use-overlay-focus";
import styles from "./drawer.module.css";

export type DrawerPlacement = "bottom" | "end";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** `bottom`: filter sheet; `end`: trailing edge (e.g. RTL-aware via app layout). */
  placement?: DrawerPlacement;
  /** When false, backdrop clicks do not close. */
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  placement = "bottom",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
}: DrawerProps): ReactElement | null {
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
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(placement === "bottom" ? styles.panelBottom : styles.panelEnd, className)}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </>
  );
}
