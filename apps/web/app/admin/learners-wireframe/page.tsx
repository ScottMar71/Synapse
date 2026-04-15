import { redirect } from "next/navigation";

/** @deprecated Old wireframe URL — use `/admin/learners`. */
export default function LegacyLearnersWireframeIndexPage(): void {
  redirect("/admin/learners");
}
