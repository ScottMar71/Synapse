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

type LmsInstructorShellProps = {
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

export function LmsInstructorShell({ children }: LmsInstructorShellProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const signOut = useCallback(() => {
    clearSession();
    router.replace("/sign-in");
  }, [router]);

  const navItems = useMemo(() => {
    const onReports = pathname.startsWith("/instructor/reports");
    return [
      {
        href: "/instructor",
        label: "Overview",
        active: !onReports && isNavigationActive(pathname, "/instructor"),
      },
      { href: "/instructor/reports", label: "Reports", active: onReports },
      { href: "/", label: "Home", active: pathname === "/" },
    ];
  }, [pathname]);

  return (
    <PageShell
      mainId="instructor-main"
      sidebar={
        <CollapsibleSidebarNav
          aria-label="Instructor sections"
          items={navItems}
          LinkComponent={NextNavLink}
        />
      }
      header={
        <AppHeader title="Instructor" description="Learners and catalog overview">
          <>
            <ResponsiveNav
              aria-label="Instructor navigation"
              drawerTitle="Instructor"
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
