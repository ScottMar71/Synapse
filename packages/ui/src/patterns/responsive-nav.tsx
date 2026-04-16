"use client";

import type { ComponentType, ReactElement, ReactNode } from "react";
import { useId, useState } from "react";

import drawerStyles from "./patterns-drawer.module.css";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { NavLinkList, type NavLinkItem } from "./nav-link-list";

export type ResponsiveNavProps = {
  items: NavLinkItem[];
  "aria-label": string;
  drawerTitle: string;
  menuButtonLabel?: string;
  /** When true, skip the horizontal nav (e.g. desktop sidebar already lists the same links). */
  mobileOnly?: boolean;
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
    onClick?: () => void;
  }>;
};

export function ResponsiveNav({
  items,
  "aria-label": ariaLabel,
  drawerTitle,
  menuButtonLabel = "Menu",
  mobileOnly = false,
  LinkComponent,
}: ResponsiveNavProps): ReactElement {
  const [open, setOpen] = useState(false);
  const drawerPanelId = useId();
  return (
    <>
      {mobileOnly ? null : (
        <div className={drawerStyles.desktopNav}>
          <NavLinkList items={items} aria-label={ariaLabel} orientation="horizontal" LinkComponent={LinkComponent} />
        </div>
      )}
      <div className={drawerStyles.mobileNav}>
        <button
          type="button"
          className={drawerStyles.menuButton}
          aria-expanded={open}
          aria-controls={drawerPanelId}
          onClick={() => {
            setOpen(true);
          }}
        >
          {menuButtonLabel}
        </button>
        <MobileNavDrawer
          panelId={drawerPanelId}
          open={open}
          onClose={() => setOpen(false)}
          title={drawerTitle}
        >
          <NavLinkList
            items={items}
            aria-label={ariaLabel}
            orientation="vertical"
            onNavigate={() => {
              setOpen(false);
            }}
            LinkComponent={LinkComponent}
          />
        </MobileNavDrawer>
      </div>
    </>
  );
}
