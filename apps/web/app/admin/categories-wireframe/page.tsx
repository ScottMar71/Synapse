import { redirect } from "next/navigation";

/** @deprecated Old wireframe URL — use `/admin/categories`. */
export default function LegacyCategoriesWireframeIndexPage(): void {
  redirect("/admin/categories");
}
