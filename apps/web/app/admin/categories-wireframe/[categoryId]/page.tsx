import type { ReactElement } from "react";
import { notFound } from "next/navigation";

import { CategoriesWireframeDashboard } from "../categories-wireframe-dashboard";
import { findDemoCategory } from "../demo-category-data";

type CategoryWireframePageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function CategoryWireframePage({
  params
}: CategoryWireframePageProps): Promise<ReactElement> {
  const { categoryId } = await params;
  if (!findDemoCategory(categoryId)) {
    notFound();
  }

  return <CategoriesWireframeDashboard initialCategoryId={categoryId} />;
}
