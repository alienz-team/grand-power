import { assertAdmin } from "@/lib/auth";
import { getAdminContent } from "@/lib/repo";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  await assertAdmin();
  const { settings, source } = await getAdminContent();
  return <SettingsForm settings={settings} source={source} />;
}
