"use client";

import {
  AppHeader,
  Button,
  CollapsibleSidebarNav,
  isNavigationActive,
  PageShell,
  ResponsiveNav,
} from "@conductor/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useCallback, useMemo } from "react";

import { clearSession } from "../../lib/lms-session";

type LmsLearnerShellProps = {
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

export function LmsLearnerShell({ children }: LmsLearnerShellProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const signOut = useCallback(() => {
    clearSession();
    router.replace("/sign-in");
  }, [router]);

  const navItems = useMemo(() => {
    const onCatalog = pathname.startsWith("/learn/catalog");
    return [
      {
        href: "/learn",
        label: "Dashboard",
        active: !onCatalog && isNavigationActive(pathname, "/learn"),
      },
      { href: "/learn/catalog", label: "Catalog", active: onCatalog },
      { href: "/", label: "Home", active: pathname === "/" },
    ];
  }, [pathname]);

  return (
    <PageShell
      mainId="learner-main"
      sidebar={
        <CollapsibleSidebarNav aria-label="Learner sections" items={navItems} LinkComponent={NextNavLink} />
      }
      header={
        <AppHeader title="Learner" description="Dashboard, catalog, and course study">
          <>
            <ResponsiveNav
              aria-label="Learner navigation"
              drawerTitle="Learner"
              items={navItems}
              mobileOnly
              LinkComponent={NextNavLink}
            />
            <Button type="button" variant="tertiary" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </>
        </AppHeader>
      }
    >
      {children}
    </PageShell>
  );
}
