"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { IMPORT_TYPES } from "@/lib/types";

const schema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[+\d\s()-]+$/),
  customerCity: z.string().trim().max(60).default(""),
  vehicleType: z.enum(IMPORT_TYPES),
  brandModel: z.string().trim().min(2).max(120),
  targetSpec: z.string().trim().max(200).default(""),
  budget: z.coerce.number().int().min(0).max(100_000_000).optional(),
  currency: z.enum(["LYD", "USD"]).default("LYD"),
  notes: z.string().trim().max(1000).default(""),
  productCode: z.string().trim().max(40).optional(),
  website: z.string().max(0).optional(), // honeypot — must stay empty
});

export type ImportRequestInput = z.input<typeof schema>;
export interface ImportRequestResult {
  ok: boolean;
  saved: boolean;
  error?: "validation" | "rate" | "server";
}

const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 5;
}

export async function submitImportRequest(input: ImportRequestInput): Promise<ImportRequestResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, saved: false, error: "validation" };
  const d = parsed.data;
  if (d.website) return { ok: true, saved: false }; // silently drop bots

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
  if (rateLimited(ip)) return { ok: false, saved: false, error: "rate" };

  const prisma = getPrisma();
  // No DB yet → client falls back to WhatsApp hand-off; still a success from the customer's view.
  if (!prisma) return { ok: true, saved: false };

  try {
    await prisma.customImportRequest.create({
      data: {
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        customerCity: d.customerCity,
        vehicleType: d.vehicleType,
        brandModel: d.brandModel,
        targetSpec: d.targetSpec,
        budgetLyd: d.currency === "LYD" ? (d.budget ?? null) : null,
        budgetUsd: d.currency === "USD" ? (d.budget ?? null) : null,
        notes: d.notes,
        productCode: d.productCode || null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return { ok: true, saved: true };
  } catch (err) {
    console.error("[import-request] insert failed:", (err as Error).message);
    return { ok: false, saved: false, error: "server" };
  }
}
