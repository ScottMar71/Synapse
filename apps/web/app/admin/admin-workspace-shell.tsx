"use client";

import {
  AppHeader,
  CollapsibleSidebarNav,
  isNavigationActive,
  PageShell,
  ResponsiveNav,
} from "@conductor/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useMemo } from "react";

type AdminWorkspaceShellProps = {
  children: ReactNode;
};

function NextNavLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function AdminWorkspaceShell({ children }: AdminWorkspaceShellProps): ReactElement {
  const pathname = usePathname() ?? "";

  const navItems = useMemo(
    () => [
      {
        href: "/admin/learners",
        label: "Learners",
        active: isNavigationActive(pathname, "/admin/learners"),
      },
      {
        href: "/admin/categories",
        label: "Categories",
        active: isNavigationActive(pathname, "/admin/categories"),
      },
      {
        href: "/admin/reports",
        label: "Reports",
        active: isNavigationActive(pathname, "/admin/reports"),
      },
    ],
    [pathname],
  );

  return (
    <PageShell
      mainId="admin-main"
      sidebar={<CollapsibleSidebarNav aria-label="Admin sections" items={navItems} LinkComponent={NextNavLink} />}
      header={
        <AppHeader title="Admin" description="Learners, catalog, and reports">
          <ResponsiveNav
            aria-label="Admin navigation"
            drawerTitle="Admin"
            items={navItems}
            mobileOnly
            LinkComponent={NextNavLink}
          />
        </AppHeader>
      }
    >
      {children}
    </PageShell>
  );
}
