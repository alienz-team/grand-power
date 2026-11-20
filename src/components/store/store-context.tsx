"use client";

import { createContext, useContext } from "react";
import type { Availability, CategoryKey, Product, SiteSettings } from "@/lib/types";

export const ENGINE_FILTERS = ["150cc", "200cc", "300cc", "600cc", "Electric", "V8/SUV"] as const;
export type EngineFilter = (typeof ENGINE_FILTERS)[number];
export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

export interface Filters {
  q: string;
  category: "ALL" | CategoryKey;
  availability: "ALL" | Availability;
  engine: "ALL" | EngineFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = { q: "", category: "ALL", availability: "ALL", engine: "ALL", sort: "featured" };

export function matchEngine(spec: string, f: Filters["engine"]): boolean {
  if (f === "ALL") return true;
  if (f === "V8/SUV") return /v8|v10|v12|suv/i.test(spec);
  return spec.toLowerCase() === f.toLowerCase();
}

export function applyFilters(products: Product[], f: Filters): Product[] {
  const q = f.q.trim().toLowerCase();
  const out = products.filter(
    (p) =>
      (f.category === "ALL" || p.category === f.category) &&
      (f.availability === "ALL" || p.availability === f.availability) &&
      matchEngine(p.engineSpec, f.engine) &&
      (!q || `${p.titleAr} ${p.titleEn} ${p.code} ${p.engineSpec}`.toLowerCase().includes(q)),
  );
  switch (f.sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "newest":
      return out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    default:
      return out.sort((a, b) => Number(b.isFastDeal) - Number(a.isFastDeal) || a.sortOrder - b.sortOrder);
  }
}

interface StoreCtx {
  settings: SiteSettings;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  openQuickView: (p: Product) => void;
  goToCatalog: (patch?: Partial<Filters>) => void;
}

export const StoreContext = createContext<StoreCtx | null>(null);

export function useStore(): StoreCtx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <Storefront>");
  return ctx;
}
