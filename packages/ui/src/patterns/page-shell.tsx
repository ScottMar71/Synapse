import type { ReactNode } from "react";

import { cx } from "../internal/cx";
import shellStyles from "./patterns-shell.module.css";
import { SkipLink } from "./skip-link";

export type PageShellProps = {
  children: ReactNode;
  /** `id` on `<main>` for skip-link targets and landmarks. */
  mainId: string;
  header: ReactNode;
  sidebar?: ReactNode;
  /** Override default `#{mainId}` skip target. */
  skipLinkHref?: string;
  skipLinkLabel?: ReactNode;
  /** Replace built-in skip link entirely. */
  skipLink?: ReactNode;
  /** Applied to `<main>` inner wrapper (default matches app `page-container`). */
  contentClassName?: string;
};

export function PageShell({
  children,
  mainId,
  header,
  sidebar,
  skipLinkHref,
  skipLinkLabel,
  skipLink,
  contentClassName,
}: PageShellProps) {
  const target = skipLinkHref ?? `#${mainId}`;
  return (
    <div className={shellStyles.shellRoot}>
      {skipLink ?? <SkipLink href={target}>{skipLinkLabel}</SkipLink>}
      <div className={shellStyles.shellBody}>
        {sidebar ? <aside className={shellStyles.sidebarRail}>{sidebar}</aside> : null}
        <div className={shellStyles.contentColumn}>
          {header}
          <main id={mainId} className={shellStyles.main}>
            <div className={cx("page-container", contentClassName)}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
