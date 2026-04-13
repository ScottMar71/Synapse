import type { ReactElement } from "react";

import { CategoriesWireframeDashboard } from "./categories-wireframe-dashboard";
import { DEFAULT_CATEGORY_WIREFRAME_ID } from "./demo-category-data";

export default function CategoriesWireframePage(): ReactElement {
  return <CategoriesWireframeDashboard initialCategoryId={DEFAULT_CATEGORY_WIREFRAME_ID} />;
}
