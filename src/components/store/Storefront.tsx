"use client";

import { useCallback, useMemo, useState } from "react";
import { toggleSavedVehicle } from "@/app/account/actions";
import type { ServiceType } from "@/lib/services";
import { SERVICES } from "@/lib/services";
import type { CustomerProfile, Product, StorefrontData } from "@/lib/types";
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
import { Showroom } from "./Showroom";
import { Services } from "./Services";
import { ServiceBookingForm } from "./ServiceBookingForm";

export function Storefront({
  data,
  customer = null,
  savedCodes = [],
}: {
  data: StorefrontData;
  customer?: CustomerProfile | null;
  savedCodes?: string[];
}) {
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [quick, setQuick] = useState<Product | null>(null);
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set(savedCodes));
  const [booking, setBooking] = useState<{ type: ServiceType; option: string }>({
    type: "MOBILE_WORKSHOP",
    option: SERVICES.MOBILE_WORKSHOP.options[0].key,
  });

  const bookService = useCallback((type: ServiceType, option?: string) => {
    setBooking({ type, option: option ?? SERVICES[type].options[0].key });
    requestAnimationFrame(() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const toggleSave = useCallback(
    (code: string) => {
      if (!customer) {
        window.location.assign(`/account/login?next=${encodeURIComponent("/#catalog")}`);
        return;
      }
      const flip = (set: ReadonlySet<string>) => {
        const next = new Set(set);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      };
      setSaved(flip); // optimistic
      toggleSavedVehicle(code)
        .then((res) => {
          if (res.needsLogin) window.location.assign(`/account/login?next=${encodeURIComponent("/#catalog")}`);
          else if (!res.ok) setSaved(flip); // roll back
        })
        .catch(() => setSaved(flip));
    },
    [customer],
  );

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
    () => ({
      settings: data.settings,
      filters,
      setFilters,
      resetFilters,
      openQuickView: setQuick,
      goToCatalog,
      customer,
      saved,
      toggleSave,
      booking,
      bookService,
    }),
    [data.settings, filters, setFilters, resetFilters, goToCatalog, customer, saved, toggleSave, booking, bookService],
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
        <Showroom products={data.products} />
        <FastDeals products={data.products.filter((p) => p.isFastDeal)} />
        <Catalog products={data.products} />
        <Services />
        <ServiceBookingForm />
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
