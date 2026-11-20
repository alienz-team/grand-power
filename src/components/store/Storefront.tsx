"use client";

import { useCallback, useMemo, useState } from "react";
import type { Product, StorefrontData } from "@/lib/types";
import { DEFAULT_FILTERS, StoreContext, type Filters } from "./store-context";
import { PromoBanner } from "./PromoBanner";
import { Navbar } from "./Navbar";
import { HeroSlider } from "./HeroSlider";
import { FilterDock } from "./FilterDock";
import { CategoryShowcase } from "./CategoryShowcase";
import { FastDeals } from "./FastDeals";
import { Catalog } from "./Catalog";
import { ImportProcess } from "./ImportProcess";
import { ImportRequestForm } from "./ImportRequestForm";
import { About } from "./About";
import { Footer } from "./Footer";
import { MobileDock } from "./MobileDock";
import { QuickViewModal } from "./QuickViewModal";

export function Storefront({ data }: { data: StorefrontData }) {
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [quick, setQuick] = useState<Product | null>(null);

  const setFilters = useCallback((patch: Partial<Filters>) => setFiltersState((f) => ({ ...f, ...patch })), []);
  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);
  const goToCatalog = useCallback(
    (patch?: Partial<Filters>) => {
      if (patch) setFilters(patch);
      requestAnimationFrame(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
    [setFilters],
  );

  const ctx = useMemo(
    () => ({ settings: data.settings, filters, setFilters, resetFilters, openQuickView: setQuick, goToCatalog }),
    [data.settings, filters, setFilters, resetFilters, goToCatalog],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of data.products) c[p.category] = (c[p.category] || 0) + 1;
    return c;
  }, [data.products]);

  return (
    <StoreContext.Provider value={ctx}>
      <PromoBanner />
      <Navbar />
      <main id="top">
        <HeroSlider slides={data.slides} />
        <FilterDock products={data.products} />
        <CategoryShowcase categories={data.categories} counts={counts} />
        <FastDeals products={data.products.filter((p) => p.isFastDeal)} />
        <Catalog products={data.products} />
        <ImportProcess />
        <ImportRequestForm />
        <About />
      </main>
      <Footer />
      <MobileDock />
      <QuickViewModal product={quick} onClose={() => setQuick(null)} />
    </StoreContext.Provider>
  );
}
