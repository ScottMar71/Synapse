import { redirect } from "next/navigation";

/** @deprecated Old wireframe URL — use `/admin/learners/add`. */
export default function LegacyLearnersWireframeAddPage(): void {
  redirect("/admin/learners/add");
}
