import type { ComponentType, ReactElement, ReactNode } from "react";

import navStyles from "./patterns-nav.module.css";

export type BreadcrumbItem =
  | { label: string; href: string }
  | { label: string; current: true };

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  "aria-label"?: string;
  separator?: ReactNode;
  LinkComponent?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
};

function DefaultCrumbLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function Breadcrumb({
  items,
  "aria-label": ariaLabel = "Breadcrumb",
  separator = "/",
  LinkComponent,
}: BreadcrumbProps): ReactElement {
  const L = LinkComponent ?? DefaultCrumbLink;
  return (
    <nav aria-label={ariaLabel} className={navStyles.breadcrumbNav}>
      <ol className={navStyles.breadcrumbList}>
        {items.map((item, index) => (
          <li key={`${index}-${"href" in item ? item.href : item.label}`} className={navStyles.breadcrumbItem}>
            {index > 0 ? (
              <span className={navStyles.breadcrumbSep} aria-hidden="true">
                {separator}
              </span>
            ) : null}
            {"href" in item ? (
              <L href={item.href} className={navStyles.breadcrumbLink}>
                {item.label}
              </L>
            ) : (
              <span className={navStyles.breadcrumbCurrent} aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
