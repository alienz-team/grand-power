import { AccountDashboard } from "@/components/account/AccountDashboard";
import { getPrisma } from "@/lib/db";
import { mapBooking, requireCustomer } from "@/lib/customer";
import { getStorefrontData, mapRequest } from "@/lib/repo";
import type { ImportRequest, Product, ServiceBooking } from "@/lib/types";

export default async function AccountPage() {
  const me = await requireCustomer("/account");
  const prisma = getPrisma();

  let bookings: ServiceBooking[] = [];
  let imports: ImportRequest[] = [];
  let savedCodes: string[] = [];
  if (prisma) {
    try {
      // One batch on one pooled connection — never Promise.all of queries.
      const [b, r, s] = await prisma.$transaction([
        prisma.serviceBooking.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.customImportRequest.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.savedVehicle.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, select: { productCode: true } }),
      ]);
      bookings = b.map(mapBooking);
      imports = r.map(mapRequest);
      savedCodes = s.map((x) => x.productCode);
    } catch (err) {
      console.error("[account] dashboard query failed:", (err as Error).message);
    }
  }

  const { products, settings } = await getStorefrontData();
  const byCode = new Map(products.map((p) => [p.code, p]));
  const saved: (Product | { code: string; missing: true })[] = savedCodes.map((code) => byCode.get(code) ?? { code, missing: true as const });

  return <AccountDashboard customer={me} bookings={bookings} imports={imports} saved={saved} whatsappNumber={settings.whatsappNumber} />;
}
