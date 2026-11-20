"use client";

import { useMemo } from "react";
import { ArrowDownUp, Gauge, Search, SlidersHorizontal, X } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { CATEGORY_KEYS, type Product } from "@/lib/types";
import { applyFilters, ENGINE_FILTERS, useStore, type Filters, type SortKey } from "./store-context";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold whitespace-nowrap transition md:text-sm ${
        active ? "border-crimson bg-crimson text-white" : "border-line bg-surface/60 text-fg/80 hover:border-gold hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterDock({ products }: { products: Product[] }) {
  const { t } = usePrefs();
  const { filters, setFilters, resetFilters, goToCatalog } = useStore();
  const resultCount = useMemo(() => applyFilters(products, filters).length, [products, filters]);
  const dirty = filters.q || filters.category !== "ALL" || filters.availability !== "ALL" || filters.engine !== "ALL" || filters.sort !== "featured";

  const set = (patch: Partial<Filters>) => setFilters(patch);

  return (
    <section aria-label={t.filter.title} className="relative z-20 mx-auto -mt-20 max-w-6xl px-3 md:-mt-24 md:px-6">
      <div className="glass rounded-3xl p-4 shadow-lux md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold md:text-base">
            <SlidersHorizontal size={18} className="text-crimson" />
            {t.filter.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>
              <b className="text-fg">{resultCount}</b> {t.filter.results}
            </span>
            {dirty && (
              <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 font-semibold hover:text-crimson">
                <X size={12} />
                {t.filter.reset}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">{t.filter.search}</span>
            <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && goToCatalog()}
              placeholder={t.filter.search}
              className="h-12 w-full rounded-2xl border border-line bg-surface/70 ps-11 pe-4 text-sm outline-none placeholder:text-muted focus:border-gold"
            />
          </label>
          <label className="relative flex h-12 items-center gap-2 rounded-2xl border border-line bg-surface/70 px-4">
            <ArrowDownUp size={16} className="text-muted" />
            <span className="sr-only">{t.filter.sort}</span>
            <select
              value={filters.sort}
              onChange={(e) => set({ sort: e.target.value as SortKey })}
              className="h-full bg-transparent pe-2 text-sm font-semibold outline-none"
            >
              <option value="featured">{t.filter.sortFeatured}</option>
              <option value="price-asc">{t.filter.sortPriceAsc}</option>
              <option value="price-desc">{t.filter.sortPriceDesc}</option>
              <option value="newest">{t.filter.sortNewest}</option>
            </select>
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <span className="w-20 shrink-0 text-[11px] font-bold text-muted uppercase">{t.filter.category}</span>
            <Chip active={filters.category === "ALL"} onClick={() => set({ category: "ALL" })}>
              {t.filter.all}
            </Chip>
            {CATEGORY_KEYS.map((k) => (
              <Chip key={k} active={filters.category === k} onClick={() => set({ category: k })}>
                {t.categories[k]}
              </Chip>
            ))}
          </div>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <span className="w-20 shrink-0 text-[11px] font-bold text-muted uppercase">{t.filter.availability}</span>
            <Chip active={filters.availability === "ALL"} onClick={() => set({ availability: "ALL" })}>
              {t.filter.all}
            </Chip>
            <Chip active={filters.availability === "IN_LIBYA"} onClick={() => set({ availability: "IN_LIBYA" })}>
              {t.availabilityLong.IN_LIBYA}
            </Chip>
            <Chip active={filters.availability === "IMPORT"} onClick={() => set({ availability: "IMPORT" })}>
              {t.availabilityLong.IMPORT}
            </Chip>
          </div>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <span className="flex w-20 shrink-0 items-center gap-1 text-[11px] font-bold text-muted uppercase">
              <Gauge size={12} />
              {t.filter.engine}
            </span>
            <Chip active={filters.engine === "ALL"} onClick={() => set({ engine: "ALL" })}>
              {t.filter.anyEngine}
            </Chip>
            {ENGINE_FILTERS.map((e) => (
              <Chip key={e} active={filters.engine === e} onClick={() => set({ engine: e })}>
                <span dir="ltr">{e}</span>
              </Chip>
            ))}
          </div>
        </div>

        <button
          onClick={() => goToCatalog()}
          className="mt-4 w-full rounded-2xl bg-fg py-3 text-sm font-extrabold text-bg transition hover:opacity-90 md:hidden"
        >
          {t.store.browse} ({resultCount})
        </button>
      </div>
    </section>
  );
}
