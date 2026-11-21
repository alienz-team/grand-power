import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ServiceBooking as DbBooking } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { CUSTOMER_COOKIE, CUSTOMER_TTL_SECONDS, signCustomerSession, verifyCustomerSession } from "@/lib/auth-token";
import type { CustomerProfile, ServiceBooking } from "@/lib/types";

export async function createCustomerSession(userId: string, email: string): Promise<void> {
  const token = await signCustomerSession(userId, email);
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // lax so the session survives arriving from WhatsApp / social links
    path: "/",
    maxAge: CUSTOMER_TTL_SECONDS,
  });
}

export async function destroyCustomerSession(): Promise<void> {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

/**
 * The signed-in customer, re-loaded from the DB on every request (so a deleted or demoted account
 * loses access immediately). Null when signed out, the DB is not configured, or anything fails.
 */
export const getCustomer = cache(async (): Promise<CustomerProfile | null> => {
  const session = await verifyCustomerSession((await cookies()).get(CUSTOMER_COOKIE)?.value);
  if (!session) return null;
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const u = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, name: true, phone: true, city: true, role: true },
    });
    if (!u || u.role !== "CUSTOMER") return null;
    return { id: u.id, email: u.email, name: u.name, phone: u.phone, city: u.city };
  } catch (err) {
    console.error("[customer] session lookup failed:", (err as Error).message);
    return null;
  }
});

/** Guard for /account pages. Redirects to sign-in (and back) when signed out. */
export async function requireCustomer(next = "/account"): Promise<CustomerProfile> {
  const c = await getCustomer();
  if (!c) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return c;
}

/** Only allow same-site relative redirect targets (blocks `//evil.com` and absolute URLs). */
export function safeNext(next: unknown, fallback = "/account"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

export function mapBooking(b: DbBooking): ServiceBooking {
  return {
    id: b.id,
    serviceType: b.serviceType,
    serviceOption: b.serviceOption,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerCity: b.customerCity,
    address: b.address,
    vehicle: b.vehicle,
    preferredDate: b.preferredDate ? b.preferredDate.toISOString().slice(0, 10) : null,
    preferredTime: b.preferredTime,
    notes: b.notes,
    status: b.status,
    adminNotes: b.adminNotes,
    hasAccount: !!b.userId,
    createdAt: b.createdAt.toISOString(),
  };
}

/** Product codes the customer has saved (empty on any failure). */
export async function getSavedCodes(userId: string): Promise<string[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    const rows = await prisma.savedVehicle.findMany({ where: { userId }, select: { productCode: true }, orderBy: { createdAt: "desc" } });
    return rows.map((r) => r.productCode);
  } catch {
    return [];
  }
}
