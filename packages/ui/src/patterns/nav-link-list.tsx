import type { ComponentType, ReactNode } from "react";

import { cx } from "../internal/cx";
import navStyles from "./patterns-nav.module.css";

export type NavLinkItem = {
  href: string;
  label: string;
  active?: boolean;
};

export type NavLinkListProps = {
  items: NavLinkItem[];
  "aria-label": string;
  orientation?: "horizontal" | "vertical";
  /** Fires after a link is activated (e.g. close mobile drawer). */
  onNavigate?: () => void;
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
  }>;
};

function DefaultLink({
  href,
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  return (
    <a href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

export function NavLinkList({
  items,
  "aria-label": ariaLabel,
  orientation = "horizontal",
  onNavigate,
  LinkComponent,
}: NavLinkListProps) {
  const L = LinkComponent ?? DefaultLink;
  return (
    <nav aria-label={ariaLabel}>
      <ul
        className={cx(navStyles.navList, orientation === "vertical" ? navStyles.navListVertical : undefined)}
      >
        {items.map((item) => (
          <li key={item.href}>
            <L
              href={item.href}
              className={cx(navStyles.navLink, item.active ? navStyles.navLinkActive : undefined)}
              onClick={onNavigate}
            >
              {item.label}
            </L>
          </li>
        ))}
      </ul>
    </nav>
  );
}
