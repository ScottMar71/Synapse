"use client";

import type { ReactElement, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

import drawerStyles from "./patterns-drawer.module.css";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

  useEffect(() => {
    if (!open) {
      return;
    }
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.requestAnimationFrame(() => {
      const root = panelRef.current;
      if (!root) {
        return;
      }
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      nodes[0]?.focus();
    });
    return () => {
      window.cancelAnimationFrame(id);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const root = panelRef.current;
      if (!root) {
        return;
      }
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) {
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (open) {
      return;
    }
    const t = window.setTimeout(() => {
      lastFocusRef.current?.focus?.();
    }, 0);
    return () => {
      window.clearTimeout(t);
    };
  }, [open]);

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
