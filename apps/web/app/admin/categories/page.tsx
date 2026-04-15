import type { ReactElement } from "react";

import { CategoriesAdminDashboard } from "./categories-admin-dashboard";

export default function AdminCategoriesPage(): ReactElement {
  return <CategoriesAdminDashboard initialCategoryId={null} />;
}
