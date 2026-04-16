import type { ReactNode } from "react";

import shellStyles from "./patterns-shell.module.css";

export type AppHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Primary navigation or actions (e.g. `ResponsiveNav`). */
  children?: ReactNode;
};

export function AppHeader({ title, description, children }: AppHeaderProps) {
  return (
    <header className={shellStyles.appHeader}>
      <div>
        <h1 className={shellStyles.appHeaderTitle}>{title}</h1>
        {description ? <p className={shellStyles.appHeaderDesc}>{description}</p> : null}
      </div>
      {children ? <div className={shellStyles.appHeaderActions}>{children}</div> : null}
    </header>
  );
}
