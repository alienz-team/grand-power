import type { Metadata } from "next";
import { assertAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await assertAdmin();
  let pending = 0;
  const prisma = getPrisma();
  if (prisma) {
    try {
      pending = await prisma.customImportRequest.count({ where: { status: "PENDING" } });
    } catch {
      /* DB unreachable — badge just hides */
    }
  }
  return (
    <AdminShell email={session.sub} pending={pending}>
      {children}
    </AdminShell>
  );
}
