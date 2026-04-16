import type { ReactElement, ReactNode } from "react";

import { AdminWorkspaceShell } from "./admin-workspace-shell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps): ReactElement {
  return <AdminWorkspaceShell>{children}</AdminWorkspaceShell>;
}
