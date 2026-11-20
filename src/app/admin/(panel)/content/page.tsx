import { assertAdmin } from "@/lib/auth";
import { getAdminContent } from "@/lib/repo";
import { ContentManager } from "@/components/admin/ContentManager";

export default async function AdminContentPage() {
  await assertAdmin();
  const { slides, settings, source } = await getAdminContent();
  return <ContentManager slides={slides} settings={settings} source={source} />;
}
