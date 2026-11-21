"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { clearFailures, hashPassword, isThrottled, recordFailure, verifyHash } from "@/lib/auth";
import { createCustomerSession, destroyCustomerSession, getCustomer, safeNext } from "@/lib/customer";
import { getPrisma } from "@/lib/db";

export type AccountError = "validation" | "mismatch" | "exists" | "invalid" | "throttled" | "nodb" | "server";
export interface AccountFormState {
  ok: boolean;
  error?: AccountError;
  /** Echoed back so the form keeps what the user typed (never the password). */
  values?: Record<string, string>;
}

const phone = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^[+\d\s()-]+$/);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  phone,
  city: z.string().trim().max(60).default(""),
  password: z.string().min(8).max(128),
  confirm: z.string(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(128),
});

async function clientKey(scope: string, id: string): Promise<string> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${scope}:${ip}:${id}`;
}

// ── Register ────────────────────────────────────────────────────────────────

export async function registerCustomer(_prev: AccountFormState | null, formData: FormData): Promise<AccountFormState> {
  const raw = Object.fromEntries(["name", "email", "phone", "city", "password", "confirm", "next"].map((k) => [k, String(formData.get(k) ?? "")]));
  const values = { name: raw.name, email: raw.email, phone: raw.phone, city: raw.city };
  if (String(formData.get("website") ?? "")) return { ok: false, error: "validation", values }; // honeypot

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "validation", values };
  const d = parsed.data;
  if (d.password !== d.confirm) return { ok: false, error: "mismatch", values };

  const key = await clientKey("register", "any");
  if (isThrottled(key)) return { ok: false, error: "throttled", values };

  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "nodb", values };

  let user: { id: string; email: string };
  try {
    user = await prisma.user.create({
      data: { name: d.name, email: d.email, phone: d.phone, city: d.city, role: "CUSTOMER", passwordHash: hashPassword(d.password) },
      select: { id: true, email: true },
    });
  } catch (err) {
    recordFailure(key); // also slows down e-mail enumeration by repeated sign-ups
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { ok: false, error: "exists", values };
    console.error("[account] register failed:", (err as Error).message);
    return { ok: false, error: "server", values };
  }
  await createCustomerSession(user.id, user.email);
  redirect(safeNext(raw.next));
}

// ── Sign in / out ───────────────────────────────────────────────────────────

export async function loginCustomer(_prev: AccountFormState | null, formData: FormData): Promise<AccountFormState> {
  const email = String(formData.get("email") ?? "");
  const values = { email };
  const parsed = loginSchema.safeParse({ email, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { ok: false, error: "validation", values };

  const key = await clientKey("customer-login", parsed.data.email);
  if (isThrottled(key)) return { ok: false, error: "throttled", values };

  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "nodb", values };

  let user: { id: string; email: string; role: string; passwordHash: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, role: true, passwordHash: true },
    });
  } catch (err) {
    console.error("[account] login lookup failed:", (err as Error).message);
    return { ok: false, error: "server", values };
  }
  // Staff accounts sign in at /admin/login only — the storefront never issues sessions for them.
  const ok = !!user && user.role === "CUSTOMER" && verifyHash(parsed.data.password, user.passwordHash);
  if (!ok || !user) {
    recordFailure(key);
    return { ok: false, error: "invalid", values };
  }
  clearFailures(key);
  await createCustomerSession(user.id, user.email);
  redirect(safeNext(formData.get("next")));
}

export async function logoutCustomer(): Promise<void> {
  await destroyCustomerSession();
  revalidatePath("/", "layout");
  redirect("/");
}

// ── Profile ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone,
  city: z.string().trim().max(60).default(""),
});

export async function updateProfile(input: z.input<typeof profileSchema>): Promise<{ ok: boolean; error?: AccountError }> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "invalid" };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "nodb" };
  try {
    await prisma.user.update({ where: { id: me.id }, data: parsed.data });
    revalidatePath("/account");
    return { ok: true };
  } catch (err) {
    console.error("[account] profile update failed:", (err as Error).message);
    return { ok: false, error: "server" };
  }
}

const passwordSchema = z.object({ current: z.string().min(1).max(128), next: z.string().min(8).max(128) });

export async function changePassword(input: z.input<typeof passwordSchema>): Promise<{ ok: boolean; error?: AccountError }> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "invalid" };
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "nodb" };
  const key = await clientKey("customer-password", me.id);
  if (isThrottled(key)) return { ok: false, error: "throttled" };
  try {
    const u = await prisma.user.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
    if (!u || !verifyHash(parsed.data.current, u.passwordHash)) {
      recordFailure(key);
      return { ok: false, error: "invalid" };
    }
    await prisma.user.update({ where: { id: me.id }, data: { passwordHash: hashPassword(parsed.data.next) } });
    clearFailures(key);
    return { ok: true };
  } catch (err) {
    console.error("[account] password change failed:", (err as Error).message);
    return { ok: false, error: "server" };
  }
}

// ── Saved vehicles ──────────────────────────────────────────────────────────

const codeSchema = z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9-]+$/);

/** Toggles a catalog vehicle in the customer's saved list. `needsLogin` tells the UI to send them to sign-in. */
export async function toggleSavedVehicle(code: string): Promise<{ ok: boolean; saved?: boolean; needsLogin?: boolean; error?: AccountError }> {
  const me = await getCustomer();
  if (!me) return { ok: false, needsLogin: true };
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) return { ok: false, error: "validation" };
  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "nodb" };
  try {
    const where = { userId_productCode: { userId: me.id, productCode: parsed.data } };
    const existing = await prisma.savedVehicle.findUnique({ where, select: { id: true } });
    if (existing) {
      await prisma.savedVehicle.delete({ where });
    } else {
      await prisma.savedVehicle.create({ data: { userId: me.id, productCode: parsed.data } });
    }
    revalidatePath("/account");
    return { ok: true, saved: !existing };
  } catch (err) {
    console.error("[account] toggle saved failed:", (err as Error).message);
    return { ok: false, error: "server" };
  }
}

// ── Bookings ────────────────────────────────────────────────────────────────

/** Customers may cancel their own booking while it is still pending review. */
export async function cancelMyBooking(id: string): Promise<{ ok: boolean; error?: AccountError }> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "invalid" };
  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "nodb" };
  try {
    const res = await prisma.serviceBooking.updateMany({
      where: { id: z.string().min(1).max(40).parse(id), userId: me.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (res.count === 0) return { ok: false, error: "invalid" };
    revalidatePath("/account");
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (err) {
    console.error("[account] cancel booking failed:", (err as Error).message);
    return { ok: false, error: "server" };
  }
}
