import { assertAdmin } from "@/lib/auth";
import { getAdminContent } from "@/lib/repo";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export default async function AdminCategoriesPage() {
  await assertAdmin();
  const { categories, source } = await getAdminContent();
  return <CategoriesManager categories={categories} source={source} />;
}
