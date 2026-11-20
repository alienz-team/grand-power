import "server-only";
import { cache } from "react";
import type {
  Category as DbCategory,
  CustomImportRequest as DbRequest,
  HeroSlide as DbSlide,
  SiteSettings as DbSettings,
  VehicleProduct as DbProduct,
} from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SETTINGS, SEED_SLIDES } from "@/lib/data/seed-data";
import type {
  CategoryInfo,
  HeroSlide,
  ImportRequest,
  Product,
  ProductSpecs,
  SiteSettings,
  StorefrontData,
} from "@/lib/types";

// ── Row mappers (Prisma → plain serialisable types) ─────────────────────────

function toSpecs(json: unknown): ProductSpecs {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const out: ProductSpecs = {};
  for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
    if (v !== null && v !== undefined) out[k] = String(v);
  }
  return out;
}

export function mapProduct(p: DbProduct): Product {
  return {
    id: p.id,
    code: p.code,
    titleAr: p.titleAr,
    titleEn: p.titleEn,
    slug: p.slug,
    descriptionAr: p.descriptionAr,
    descriptionEn: p.descriptionEn,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    category: p.category,
    availability: p.availability,
    engineSpec: p.engineSpec,
    powerHp: p.powerHp,
    year: p.year,
    mileage: p.mileage,
    condition: p.condition,
    images: p.images,
    specs: toSpecs(p.specs),
    isFastDeal: p.isFastDeal,
    isNew: p.isNew,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

function mapCategory(c: DbCategory): CategoryInfo {
  return {
    id: c.id,
    key: c.key,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    slug: c.slug,
    taglineAr: c.taglineAr,
    taglineEn: c.taglineEn,
    image: c.image,
    carouselImages: c.carouselImages,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
  };
}

function mapSlide(s: DbSlide): HeroSlide {
  return {
    id: s.id,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    subtitleAr: s.subtitleAr,
    subtitleEn: s.subtitleEn,
    imageUrl: s.imageUrl,
    ctaTextAr: s.ctaTextAr,
    ctaTextEn: s.ctaTextEn,
    ctaLink: s.ctaLink,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
  };
}

function mapSettings(s: DbSettings): SiteSettings {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, updatedAt, ...rest } = s;
  return rest;
}

export function mapRequest(r: DbRequest): ImportRequest {
  return {
    id: r.id,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerCity: r.customerCity,
    vehicleType: r.vehicleType,
    brandModel: r.brandModel,
    targetSpec: r.targetSpec,
    budgetLyd: r.budgetLyd,
    budgetUsd: r.budgetUsd,
    notes: r.notes,
    productCode: r.productCode,
    status: r.status,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
  };
}

const seedStorefront = (): StorefrontData => ({
  settings: SEED_SETTINGS,
  slides: SEED_SLIDES,
  categories: SEED_CATEGORIES,
  products: SEED_PRODUCTS,
  source: "seed",
});

// ── Storefront ──────────────────────────────────────────────────────────────

/**
 * One round-trip batch via $transaction (sequential on a single pooled connection —
 * never Promise.all, which starves small serverless pools). Any failure or empty table
 * falls back to the rich seed catalogue so the storefront always renders.
 */
export const getStorefrontData = cache(async (): Promise<StorefrontData> => {
  const prisma = getPrisma();
  if (!prisma) return seedStorefront();
  try {
    const [settings, slides, categories, products] = await prisma.$transaction([
      prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
      prisma.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.vehicleProduct.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    ]);
    return {
      settings: settings ? mapSettings(settings) : SEED_SETTINGS,
      slides: slides.length ? slides.map(mapSlide) : SEED_SLIDES,
      categories: categories.length ? categories.map(mapCategory) : SEED_CATEGORIES,
      products: products.length ? products.map(mapProduct) : SEED_PRODUCTS,
      source: "database",
    };
  } catch (err) {
    console.error("[repo] storefront query failed — serving seed data:", (err as Error).message);
    return seedStorefront();
  }
});

export const getSettings = cache(async (): Promise<SiteSettings> => (await getStorefrontData()).settings);

// ── Admin ───────────────────────────────────────────────────────────────────

export interface AdminOverview {
  total: number;
  inLibya: number;
  imports: number;
  fastDeals: number;
  pendingRequests: number;
  slides: number;
  byCategory: Record<string, number>;
  recentRequests: ImportRequest[];
  source: "database" | "seed";
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const prisma = getPrisma();
  const fromSeed = (): AdminOverview => ({
    total: SEED_PRODUCTS.length,
    inLibya: SEED_PRODUCTS.filter((p) => p.availability === "IN_LIBYA").length,
    imports: SEED_PRODUCTS.filter((p) => p.availability === "IMPORT").length,
    fastDeals: SEED_PRODUCTS.filter((p) => p.isFastDeal).length,
    pendingRequests: 0,
    slides: SEED_SLIDES.length,
    byCategory: SEED_PRODUCTS.reduce<Record<string, number>>((a, p) => ((a[p.category] = (a[p.category] || 0) + 1), a), {}),
    recentRequests: [],
    source: "seed",
  });
  if (!prisma) return fromSeed();
  try {
    const [total, inLibya, imports, fastDeals, pending, slides, cars, motors, bicycles, accessories, recent] =
      await prisma.$transaction([
        prisma.vehicleProduct.count(),
        prisma.vehicleProduct.count({ where: { availability: "IN_LIBYA" } }),
        prisma.vehicleProduct.count({ where: { availability: "IMPORT" } }),
        prisma.vehicleProduct.count({ where: { isFastDeal: true } }),
        prisma.customImportRequest.count({ where: { status: "PENDING" } }),
        prisma.heroSlide.count(),
        prisma.vehicleProduct.count({ where: { category: "CARS" } }),
        prisma.vehicleProduct.count({ where: { category: "MOTORS" } }),
        prisma.vehicleProduct.count({ where: { category: "BICYCLES" } }),
        prisma.vehicleProduct.count({ where: { category: "ACCESSORIES" } }),
        prisma.customImportRequest.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      ]);
    return {
      total,
      inLibya,
      imports,
      fastDeals,
      pendingRequests: pending,
      slides,
      byCategory: { CARS: cars, MOTORS: motors, BICYCLES: bicycles, ACCESSORIES: accessories },
      recentRequests: recent.map(mapRequest),
      source: "database",
    };
  } catch (err) {
    console.error("[repo] admin overview failed:", (err as Error).message);
    return fromSeed();
  }
}

export async function getAdminProducts(): Promise<{ products: Product[]; source: "database" | "seed" }> {
  const prisma = getPrisma();
  if (!prisma) return { products: SEED_PRODUCTS, source: "seed" };
  try {
    const rows = await prisma.vehicleProduct.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return { products: rows.map(mapProduct), source: "database" };
  } catch {
    return { products: SEED_PRODUCTS, source: "seed" };
  }
}

export async function getAdminContent(): Promise<{
  slides: HeroSlide[];
  categories: CategoryInfo[];
  settings: SiteSettings;
  source: "database" | "seed";
}> {
  const prisma = getPrisma();
  const seed = { slides: SEED_SLIDES, categories: SEED_CATEGORIES, settings: SEED_SETTINGS, source: "seed" as const };
  if (!prisma) return seed;
  try {
    const [slides, categories, settings] = await prisma.$transaction([
      prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    ]);
    return {
      slides: slides.length ? slides.map(mapSlide) : SEED_SLIDES,
      categories: categories.length ? categories.map(mapCategory) : SEED_CATEGORIES,
      settings: settings ? mapSettings(settings) : SEED_SETTINGS,
      source: "database",
    };
  } catch {
    return seed;
  }
}

export async function getImportRequests(): Promise<{ requests: ImportRequest[]; source: "database" | "seed" }> {
  const prisma = getPrisma();
  if (!prisma) return { requests: [], source: "seed" };
  try {
    const rows = await prisma.customImportRequest.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
    return { requests: rows.map(mapRequest), source: "database" };
  } catch {
    return { requests: [], source: "seed" };
  }
}
