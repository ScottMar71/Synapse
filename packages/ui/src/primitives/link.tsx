import type { AnchorHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { cx } from "../internal/cx";
import styles from "./link.module.css";

export type LinkVariant = "default" | "subtle";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: LinkVariant;
  external?: boolean;
  externalIcon?: ReactNode;
};

function defaultExternalIcon(): ReactNode {
  return (
    <span className={styles.externalIcon} aria-hidden>
      ↗
    </span>
  );
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { variant = "default", external = false, externalIcon, className, children, rel, target, ...rest },
  ref,
) {
  const resolvedTarget = external ? target ?? "_blank" : target;
  const resolvedRel = external ? cx(rel, "noopener noreferrer") : rel;

  return (
    <a
      ref={ref}
      className={cx(
        styles.link,
        variant === "default" ? styles.defaultUnderline : styles.subtle,
        className,
      )}
      {...rest}
      rel={resolvedRel}
      target={resolvedTarget}
    >
      {children}
      {external ? (externalIcon ?? defaultExternalIcon()) : null}
    </a>
  );
});
