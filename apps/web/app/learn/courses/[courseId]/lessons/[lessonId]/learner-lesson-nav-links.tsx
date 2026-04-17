import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

export function NextLessonLink({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function NextOutlineLink({
  href,
  className,
  children,
  "aria-current": ariaCurrent,
  "aria-label": ariaLabel
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | boolean | undefined;
  "aria-label"?: string;
}): ReactElement {
  return (
    <Link href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
