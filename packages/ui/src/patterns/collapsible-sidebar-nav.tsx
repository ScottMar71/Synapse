"use client";

import type { ComponentType, ReactElement, ReactNode } from "react";
import { useId, useState } from "react";

import { cx } from "../internal/cx";
import { Button } from "../primitives/button";
import navStyles from "./patterns-nav.module.css";
import shellStyles from "./patterns-shell.module.css";

export type CollapsibleSidebarNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export type CollapsibleSidebarNavProps = {
  items: CollapsibleSidebarNavItem[];
  "aria-label": string;
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
    "aria-label"?: string;
  }>;
};

function DefaultSidebarLink({
  href,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

export function CollapsibleSidebarNav({
  items,
  "aria-label": ariaLabel,
  LinkComponent,
}: CollapsibleSidebarNavProps): ReactElement {
  const L = LinkComponent ?? DefaultSidebarLink;
  const [collapsed, setCollapsed] = useState(false);
  const navId = useId();
  const toggleId = `${navId}-toggle`;

  return (
    <nav
      aria-label={ariaLabel}
      className={cx(
        shellStyles.sidebarWidth,
        collapsed ? shellStyles.sidebarWidthCollapsed : undefined,
        navStyles.sidebarNav,
        collapsed ? navStyles.sidebarNavCollapsed : undefined,
      )}
    >
      <Button
        id={toggleId}
        type="button"
        variant="tertiary"
        size="sm"
        className={navStyles.sidebarToggle}
        aria-expanded={!collapsed}
        aria-controls={navId}
        onClick={() => {
          setCollapsed((c) => !c);
        }}
      >
        {collapsed ? "›" : "‹"}
      </Button>
      <ul id={navId} className={navStyles.sidebarLinkList}>
        {items.map((item) => (
          <li key={item.href}>
            <L
              href={item.href}
              className={cx(navStyles.sidebarLink, item.active ? navStyles.sidebarLinkActive : undefined)}
              aria-label={collapsed ? item.label : undefined}
            >
              {collapsed ? (
                <span className={navStyles.sidebarLabel} aria-hidden="true">
                  {item.label.slice(0, 1).toUpperCase()}
                </span>
              ) : (
                <span className={navStyles.sidebarLabel}>{item.label}</span>
              )}
            </L>
          </li>
        ))}
      </ul>
    </nav>
  );
}
