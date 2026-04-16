"use client";

import type { FocusEvent, PointerEvent, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, useId, useState } from "react";

import { cx } from "../internal/cx";
import styles from "./tooltip.module.css";

export type TooltipProps = {
  /** Supplementary description; never the only source of the control’s name. */
  content: string;
  children: ReactNode;
  className?: string;
};

type Extendable = {
  className?: string;
  "aria-describedby"?: string;
  onPointerEnter?: (e: PointerEvent) => void;
  onPointerLeave?: (e: PointerEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
};

/**
 * Hover/focus tooltip. **Supplementary only** — the child control must expose a visible label
 * (text or `aria-label`). Merges `aria-describedby` when the tip is shown.
 */
export function Tooltip({ content, children, className }: TooltipProps): ReactElement {
  const tipId = useId();
  const [visible, setVisible] = useState(false);
  const childEl = isValidElement(children) ? children : <span>{children}</span>;
  const p = childEl.props as Extendable;

  const trigger = cloneElement(childEl, {
    ...p,
    "aria-describedby": visible ? tipId : p["aria-describedby"],
    onPointerEnter: (e: PointerEvent) => {
      p.onPointerEnter?.(e);
      setVisible(true);
    },
    onPointerLeave: (e: PointerEvent) => {
      p.onPointerLeave?.(e);
      setVisible(false);
    },
    onFocus: (e: FocusEvent) => {
      p.onFocus?.(e);
      setVisible(true);
    },
    onBlur: (e: FocusEvent) => {
      p.onBlur?.(e);
      setVisible(false);
    },
  } satisfies Extendable);

  return (
    <span className={cx(styles.root, className)}>
      {trigger}
      <span
        id={tipId}
        role="tooltip"
        className={styles.tooltip}
        data-visible={visible}
        aria-hidden={!visible}
      >
        {content}
      </span>
    </span>
  );
}
