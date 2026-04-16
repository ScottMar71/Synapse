import type { ReactElement } from "react";
import { Suspense } from "react";

import { CategoriesAdminDashboard } from "./categories-admin-dashboard";

export default function AdminCategoriesPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="page-container">
          <p aria-busy="true">Loading…</p>
        </div>
      }
    >
      <CategoriesAdminDashboard initialCategoryId={null} />
    </Suspense>
  );
}
