"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomer } from "@/lib/customer";
import { getPrisma } from "@/lib/db";
import { isValidOption, SERVICE_TYPES, TIME_SLOTS } from "@/lib/services";

const schema = z
  .object({
    serviceType: z.enum(SERVICE_TYPES),
    serviceOption: z.string().trim().min(2).max(40),
    customerName: z.string().trim().min(2).max(80),
    customerPhone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .regex(/^[+\d\s()-]+$/),
    customerCity: z.string().trim().max(60).default(""),
    address: z.string().trim().max(200).default(""),
    vehicle: z.string().trim().max(120).default(""),
    preferredDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    preferredTime: z.enum(TIME_SLOTS).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).default(""),
    website: z.string().max(0).optional(), // honeypot — must stay empty
  })
  .refine((d) => isValidOption(d.serviceType, d.serviceOption), { path: ["serviceOption"] });

export type ServiceBookingInput = z.input<typeof schema>;
export interface ServiceBookingResult {
  ok: boolean;
  saved: boolean;
  signedIn?: boolean;
  error?: "validation" | "date" | "rate" | "server";
}

const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 6;
}

/** Parses YYYY-MM-DD as a UTC date and rejects past dates or dates > 120 days ahead. */
function parseDate(s: string | undefined): Date | null | "invalid" {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "invalid";
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const max = new Date(today.getTime() + 120 * 86_400_000);
  return d < today || d > max ? "invalid" : d;
}

export async function submitServiceBooking(input: ServiceBookingInput): Promise<ServiceBookingResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, saved: false, error: "validation" };
  const d = parsed.data;
  if (d.website) return { ok: true, saved: false }; // silently drop bots

  const date = parseDate(d.preferredDate || undefined);
  if (date === "invalid") return { ok: false, saved: false, error: "date" };

  const h = await headers();
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
  if (rateLimited(ip)) return { ok: false, saved: false, error: "rate" };

  const prisma = getPrisma();
  // No DB → client hands the booking off via WhatsApp; still a success from the customer's view.
  if (!prisma) return { ok: true, saved: false };

  const me = await getCustomer();
  try {
    await prisma.serviceBooking.create({
      data: {
        serviceType: d.serviceType,
        serviceOption: d.serviceOption,
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        customerCity: d.customerCity,
        address: d.address,
        vehicle: d.vehicle,
        preferredDate: date,
        preferredTime: d.preferredTime || "",
        notes: d.notes,
        userId: me?.id ?? null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    if (me) revalidatePath("/account");
    return { ok: true, saved: true, signedIn: !!me };
  } catch (err) {
    console.error("[service-booking] insert failed:", (err as Error).message);
    return { ok: false, saved: false, error: "server" };
  }
}
