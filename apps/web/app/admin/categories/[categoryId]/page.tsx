import type { ReactElement } from "react";

import { CategoriesAdminDashboard } from "../categories-admin-dashboard";

type PageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function AdminCategoryDetailPage(props: PageProps): Promise<ReactElement> {
  const { categoryId } = await props.params;
  return <CategoriesAdminDashboard initialCategoryId={categoryId} />;
}
