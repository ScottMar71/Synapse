import type { ReactElement } from "react";
import { Suspense } from "react";

import { LearnersAdminDashboard } from "./learners-admin-dashboard";

export default function AdminLearnersPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <main className="page-container">
          <p aria-busy="true">Loading…</p>
        </main>
      }
    >
      <LearnersAdminDashboard />
    </Suspense>
  );
}
