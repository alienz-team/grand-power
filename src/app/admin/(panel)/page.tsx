import { assertAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/repo";
import { isDbConfigured } from "@/lib/db";
import { isStorageConfigured } from "@/lib/storage";
import { Dashboard } from "@/components/admin/Dashboard";

export default async function AdminDashboardPage() {
  await assertAdmin();
  const overview = await getAdminOverview();
  return (
    <Dashboard
      overview={overview}
      env={{ db: isDbConfigured(), storage: isStorageConfigured(), authSecret: (process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || "").length >= 32 }}
    />
  );
}
