"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  assertAdmin,
  clearFailures,
  createSession,
  destroySession,
  hashPassword,
  isThrottled,
  recordFailure,
  verifyAdminCredentials,
} from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { isStorageConfigured, uploadProductImages } from "@/lib/storage";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SETTINGS, SEED_SLIDES } from "@/lib/data/seed-data";
import { isAllowedImageUrl } from "@/lib/images";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/auth-token";
import { AVAILABILITIES, CATEGORY_KEYS, CONDITIONS, REQUEST_STATUSES, type ActionResult } from "@/lib/types";

const NO_DB: ActionResult = {
  ok: false,
  message: "Database not connected — add DATABASE_URL to .env to enable editing. / قاعدة البيانات غير متصلة.",
};

function refreshStorefront(...extra: string[]) {
  revalidatePath("/", "layout");
  for (const p of extra) revalidatePath(p);
}

function fail(err: unknown): ActionResult {
  if (err instanceof z.ZodError) return { ok: false, message: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ") };
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
    return { ok: false, message: `Duplicate value: ${(err.meta?.target as string[] | undefined)?.join(", ") ?? "unique field"}` };
  console.error("[admin action]", err);
  return { ok: false, message: (err as Error)?.message || "Unexpected error" };
}

const url = z
  .string()
  .trim()
  .url()
  .refine((u) => u.startsWith("https://"), "Must be https");

const imageUrl = z
  .string()
  .trim()
  .refine(isAllowedImageUrl, "Image host must be images.unsplash.com, images.cdn-files-a.com or *.supabase.co");

// ── Auth ────────────────────────────────────────────────────────────────────

export async function loginAction(_prev: (ActionResult & { email?: string }) | null, formData: FormData): Promise<ActionResult & { email?: string }> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const h = await headers();
  const key = `${h.get("x-forwarded-for")?.split(",")[0] || "local"}:${email.toLowerCase()}`;

  if (isThrottled(key)) return { ok: false, email, message: "Too many attempts. Try again in 15 minutes." };
  if (!email || !password || !(await verifyAdminCredentials(email, password))) {
    recordFailure(key);
    return { ok: false, email, message: "Invalid credentials / بيانات الدخول غير صحيحة" };
  }
  clearFailures(key);
  await createSession(email.trim().toLowerCase());
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

// ── Products ────────────────────────────────────────────────────────────────

const productSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9-]+$/),
  titleAr: z.string().trim().min(2).max(160),
  titleEn: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  descriptionAr: z.string().max(4000).default(""),
  descriptionEn: z.string().max(4000).default(""),
  price: z.coerce.number().int().min(0),
  compareAtPrice: z.coerce.number().int().min(0).nullable().optional(),
  category: z.enum(CATEGORY_KEYS),
  availability: z.enum(AVAILABILITIES),
  engineSpec: z.string().trim().max(40).default(""),
  powerHp: z.coerce.number().int().min(0).nullable().optional(),
  year: z.coerce.number().int().min(1950).max(2100).nullable().optional(),
  mileage: z.coerce.number().int().min(0).nullable().optional(),
  condition: z.enum(CONDITIONS).default("NEW"),
  images: z.array(imageUrl).min(1).max(12),
  specs: z.record(z.string(), z.string().max(200)).default({}),
  isFastDeal: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    const { id, ...data } = productSchema.parse(input);
    const payload = { ...data, compareAtPrice: data.compareAtPrice ?? null, powerHp: data.powerHp ?? null, year: data.year ?? null, mileage: data.mileage ?? null };
    const row = id
      ? await prisma.vehicleProduct.update({ where: { id }, data: payload })
      : await prisma.vehicleProduct.create({ data: payload });
    refreshStorefront("/admin/products", "/admin");
    return { ok: true, id: row.id, message: "Saved / تم الحفظ" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    await prisma.vehicleProduct.delete({ where: { id: z.string().min(1).parse(id) } });
    refreshStorefront("/admin/products", "/admin");
    return { ok: true, message: "Deleted / تم الحذف" };
  } catch (e) {
    return fail(e);
  }
}

const toggleFields = ["isFastDeal", "isNew", "isActive"] as const;

export async function toggleProduct(id: string, field: (typeof toggleFields)[number] | "availability"): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    const current = await prisma.vehicleProduct.findUniqueOrThrow({ where: { id } });
    let data: Prisma.VehicleProductUpdateInput;
    if (field === "availability") {
      data = { availability: current.availability === "IN_LIBYA" ? "IMPORT" : "IN_LIBYA" };
    } else {
      const f = z.enum(toggleFields).parse(field);
      data = { [f]: !current[f] };
    }
    await prisma.vehicleProduct.update({ where: { id }, data });
    refreshStorefront("/admin/products", "/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function uploadImagesAction(formData: FormData): Promise<ActionResult & { urls?: string[] }> {
  await assertAdmin();
  if (!isStorageConfigured())
    return { ok: false, message: "Supabase Storage not configured (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). Paste image URLs instead." };
  try {
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return { ok: false, message: "No files" };
    if (files.length > 10) return { ok: false, message: "Max 10 files per upload" };
    const folder = String(formData.get("folder") || "products").replace(/[^a-z0-9-]/gi, "");
    const urls = await uploadProductImages(files, folder || "products");
    return { ok: true, urls };
  } catch (e) {
    return fail(e);
  }
}

// ── Categories ──────────────────────────────────────────────────────────────

const categorySchema = z.object({
  id: z.string().min(1),
  nameAr: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().min(1).max(60),
  taglineAr: z.string().max(160).default(""),
  taglineEn: z.string().max(160).default(""),
  image: imageUrl,
  carouselImages: z.array(imageUrl).min(1).max(6),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    const { id, ...data } = categorySchema.parse(input);
    await prisma.category.update({ where: { id }, data });
    refreshStorefront("/admin/categories");
    return { ok: true, message: "Saved / تم الحفظ" };
  } catch (e) {
    return fail(e);
  }
}

// ── Hero slides & content ───────────────────────────────────────────────────

const slideSchema = z.object({
  id: z.string().optional(),
  titleAr: z.string().trim().min(1).max(80),
  titleEn: z.string().trim().min(1).max(80),
  subtitleAr: z.string().trim().max(200).default(""),
  subtitleEn: z.string().trim().max(200).default(""),
  imageUrl: imageUrl,
  ctaTextAr: z.string().trim().max(40).default("تسوّق الآن"),
  ctaTextEn: z.string().trim().max(40).default("Shop Now"),
  ctaLink: z
    .string()
    .trim()
    .max(200)
    .regex(/^(#[\w-]*|\/[\w\-/#?=&]*|https:\/\/\S+)$/, "Use #anchor, /path or https:// link")
    .default("#store"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type SlideInput = z.input<typeof slideSchema>;

export async function saveSlide(input: SlideInput): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    const { id, ...data } = slideSchema.parse(input);
    const row = id ? await prisma.heroSlide.update({ where: { id }, data }) : await prisma.heroSlide.create({ data });
    refreshStorefront("/admin/content");
    return { ok: true, id: row.id, message: "Saved / تم الحفظ" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSlide(id: string): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    await prisma.heroSlide.delete({ where: { id } });
    refreshStorefront("/admin/content");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderSlides(ids: string[]): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    const list = z.array(z.string().min(1)).max(50).parse(ids);
    await prisma.$transaction(list.map((id, i) => prisma.heroSlide.update({ where: { id }, data: { sortOrder: i } })));
    refreshStorefront("/admin/content");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ── Site settings (contact, about, promo) ───────────────────────────────────

const settingsSchema = z.object({
  brandNameAr: z.string().trim().min(1).max(60),
  brandNameEn: z.string().trim().min(1).max(60),
  sloganAr: z.string().trim().max(160),
  sloganEn: z.string().trim().max(160),
  aboutTextAr: z.string().max(4000),
  aboutTextEn: z.string().max(4000),
  whatsappNumber: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, ""))
    .pipe(z.string().min(8).max(15)),
  phoneNumber: z.string().trim().min(6).max(25).regex(/^[+\d\s()-]+$/),
  email: z.string().trim().email(),
  addressAr: z.string().trim().max(200),
  addressEn: z.string().trim().max(200),
  facebookUrl: url,
  instagramUrl: url,
  promoBannerAr: z.string().max(200),
  promoBannerEn: z.string().max(200),
  isPromoActive: z.boolean(),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export async function saveSettings(input: Partial<SettingsInput>): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    const current = (await prisma.siteSettings.findUnique({ where: { id: "singleton" } })) ?? SEED_SETTINGS;
    const data = settingsSchema.parse({ ...current, ...input });
    await prisma.siteSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...data }, update: data });
    refreshStorefront("/admin/settings", "/admin/content");
    return { ok: true, message: "Saved — storefront updated / تم الحفظ وتحديث الواجهة" };
  } catch (e) {
    return fail(e);
  }
}

// ── Orders / import requests ────────────────────────────────────────────────

export async function updateRequest(id: string, status: string, adminNotes?: string): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    await prisma.customImportRequest.update({
      where: { id },
      data: { status: z.enum(REQUEST_STATUSES).parse(status), ...(adminNotes !== undefined ? { adminNotes: adminNotes.slice(0, 2000) } : {}) },
    });
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteRequest(id: string): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    await prisma.customImportRequest.delete({ where: { id } });
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ── One-click database seeding ──────────────────────────────────────────────

export async function seedDatabaseAction(): Promise<ActionResult> {
  await assertAdmin();
  const prisma = getPrisma();
  if (!prisma) return NO_DB;
  try {
    await seedDatabase(prisma);
    refreshStorefront("/admin", "/admin/products", "/admin/categories", "/admin/content", "/admin/settings");
    return { ok: true, message: "Database seeded / تمت تعبئة قاعدة البيانات" };
  } catch (e) {
    return fail(e);
  }
}

async function seedDatabase(prisma: NonNullable<ReturnType<typeof getPrisma>>) {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  await prisma.$transaction([
    prisma.siteSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...SEED_SETTINGS }, update: {} }),
    ...SEED_CATEGORIES.map(({ id, ...c }) =>
      prisma.category.upsert({ where: { key: c.key }, create: { id, ...c }, update: {} }),
    ),
    ...SEED_SLIDES.map(({ id, ...s }) => prisma.heroSlide.upsert({ where: { id }, create: { id, ...s }, update: {} })),
    ...SEED_PRODUCTS.map(({ id, specs, ...p }) =>
      prisma.vehicleProduct.upsert({ where: { code: p.code }, create: { id, ...p, specs }, update: {} }),
    ),
    // The admin user is only created when ADMIN_PASSWORD is configured (no hardcoded default).
    ...(password
      ? [
          prisma.user.upsert({
            where: { email },
            create: { email, name: "GRAND POWER Admin", role: "ADMIN", passwordHash: hashPassword(password) },
            update: {},
          }),
        ]
      : []),
  ]);
}
