"use client";

import type { ReactElement, ReactNode } from "react";
import { useId, useRef } from "react";

import { useBodyScrollLock } from "../internal/use-body-scroll-lock";
import { useOverlayFocus } from "../internal/use-overlay-focus";
import drawerStyles from "./patterns-drawer.module.css";

export type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** For `aria-controls` on the menu button. */
  panelId?: string;
  children: ReactNode;
};

export function MobileNavDrawer({ open, onClose, title, panelId, children }: MobileNavDrawerProps): ReactElement | null {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);
  useOverlayFocus({
    open,
    rootRef: panelRef,
    lastFocusRef,
    escapeDismisses: true,
    onEscape: onClose,
  });

  if (!open) {
    return null;
  }

  return (
    <>
      <div className={drawerStyles.drawerBackdrop} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={drawerStyles.drawerPanel}
        tabIndex={-1}
      >
        <div className={drawerStyles.drawerHeader}>
          <h2 id={titleId} className={drawerStyles.drawerTitle}>
            {title}
          </h2>
          <button type="button" className={drawerStyles.closeButton} onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
