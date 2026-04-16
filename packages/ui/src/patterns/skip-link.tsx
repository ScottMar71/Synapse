import type { ReactNode } from "react";

import shellStyles from "./patterns-shell.module.css";

export type SkipLinkProps = {
  href: string;
  children?: ReactNode;
};

export function SkipLink({ href, children = "Skip to content" }: SkipLinkProps) {
  return (
    <a href={href} className={shellStyles.skipLink}>
      {children}
    </a>
  );
}
