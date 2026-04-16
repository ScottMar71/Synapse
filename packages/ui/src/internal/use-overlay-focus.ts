import type { MutableRefObject, RefObject } from "react";
import { useEffect } from "react";

import { OVERLAY_FOCUSABLE_SELECTOR } from "./focus-trap-constants";

type OverlayFocusOptions = {
  open: boolean;
  rootRef: RefObject<HTMLElement | null>;
  /** When true, Escape calls `onEscape` and default action is prevented. */
  escapeDismisses: boolean;
  onEscape: () => void;
  lastFocusRef: MutableRefObject<HTMLElement | null>;
};

/**
 * Focus first focusable when opening, trap Tab, optional Escape dismiss, restore focus when closed.
 */
export function useOverlayFocus({ open, rootRef, escapeDismisses, onEscape, lastFocusRef }: OverlayFocusOptions): void {
  useEffect(() => {
    if (!open) {
      return;
    }
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(OVERLAY_FOCUSABLE_SELECTOR));
      nodes[0]?.focus();
    });
    return () => {
      window.cancelAnimationFrame(id);
    };
  }, [open, lastFocusRef, rootRef]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }
      if (event.key === "Escape") {
        if (escapeDismisses) {
          event.preventDefault();
          onEscape();
        }
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(OVERLAY_FOCUSABLE_SELECTOR));
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
  }, [open, escapeDismisses, onEscape, rootRef]);

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
  }, [open, lastFocusRef]);
}
