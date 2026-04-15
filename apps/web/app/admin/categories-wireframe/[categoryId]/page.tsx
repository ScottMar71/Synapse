import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ categoryId: string }>;
};

/** @deprecated Old wireframe URL — use `/admin/categories/:categoryId`. */
export default async function LegacyCategoriesWireframeDetailPage(props: PageProps): Promise<void> {
  const { categoryId } = await props.params;
  redirect(`/admin/categories/${encodeURIComponent(categoryId)}`);
}
