// Plain serialisable domain types shared by server + client.
// Kept independent from the generated Prisma client so the storefront works with or without a DB.

export const CATEGORY_KEYS = ["CARS", "MOTORS", "BICYCLES", "ACCESSORIES"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const AVAILABILITIES = ["IN_LIBYA", "IMPORT"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const CONDITIONS = ["NEW", "USED", "CERTIFIED"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const IMPORT_TYPES = ["CAR", "MOTOR", "BICYCLE", "ACCESSORY"] as const;
export type ImportVehicleType = (typeof IMPORT_TYPES)[number];

export const REQUEST_STATUSES = ["PENDING", "REVIEWING", "QUOTED", "APPROVED", "COMPLETED", "CANCELLED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type Lang = "ar" | "en";
export type Theme = "dark" | "light";

export type ProductSpecs = Record<string, string>;

export interface Product {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  compareAtPrice: number | null;
  category: CategoryKey;
  availability: Availability;
  engineSpec: string;
  powerHp: number | null;
  year: number | null;
  mileage: number | null;
  condition: Condition;
  images: string[];
  specs: ProductSpecs;
  isFastDeal: boolean;
  isNew: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryInfo {
  id: string;
  key: CategoryKey;
  nameAr: string;
  nameEn: string;
  slug: string;
  taglineAr: string;
  taglineEn: string;
  image: string;
  carouselImages: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface HeroSlide {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  imageUrl: string;
  ctaTextAr: string;
  ctaTextEn: string;
  ctaLink: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ImportRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  vehicleType: ImportVehicleType;
  brandModel: string;
  targetSpec: string;
  budgetLyd: number | null;
  budgetUsd: number | null;
  notes: string;
  productCode: string | null;
  status: RequestStatus;
  adminNotes: string;
  createdAt: string; // ISO
}

export interface SiteSettings {
  brandNameAr: string;
  brandNameEn: string;
  sloganAr: string;
  sloganEn: string;
  aboutTextAr: string;
  aboutTextEn: string;
  whatsappNumber: string;
  phoneNumber: string;
  email: string;
  addressAr: string;
  addressEn: string;
  facebookUrl: string;
  instagramUrl: string;
  promoBannerAr: string;
  promoBannerEn: string;
  isPromoActive: boolean;
}

export interface ServiceBooking {
  id: string;
  serviceType: "MOBILE_WORKSHOP" | "CAR_WASH" | "CAR_EDITING";
  serviceOption: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  address: string;
  vehicle: string;
  preferredDate: string | null; // YYYY-MM-DD
  preferredTime: string;
  notes: string;
  status: RequestStatus;
  adminNotes: string;
  hasAccount: boolean;
  createdAt: string; // ISO
}

/** Signed-in storefront customer (never includes the password hash). */
export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
}

export interface StorefrontData {
  settings: SiteSettings;
  slides: HeroSlide[];
  categories: CategoryInfo[];
  products: Product[];
  source: "database" | "seed";
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  id?: string;
}
