"use client";

import { useMemo } from "react";
import { PackageSearch } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { SectionHeading } from "@/components/ui/Pills";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { applyFilters, useStore } from "./store-context";

export function Catalog({ products }: { products: Product[] }) {
  const { t } = usePrefs();
  const { filters, resetFilters } = useStore();
  const results = useMemo(() => applyFilters(products, filters), [products, filters]);

  const active = [
    filters.category !== "ALL" && t.categories[filters.category],
    filters.availability !== "ALL" && t.availabilityLong[filters.availability],
    filters.engine !== "ALL" && filters.engine,
    filters.q && `“${filters.q}”`,
  ].filter(Boolean) as string[];

  return (
    <section id="catalog" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24" aria-labelledby="catalog-h">
      <SectionHeading id="catalog-h" kicker={t.catalog.kicker} title={t.catalog.title} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {active.map((a) => (
            <span key={a} className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
              {a}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted">
          <b className="text-fg">{results.length}</b> {t.filter.results}
        </p>
      </div>

      {results.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line py-16 text-center">
          <PackageSearch size={40} className="text-muted" />
          <p className="max-w-md text-muted">{t.filter.empty}</p>
          <div className="flex gap-2">
            <button onClick={resetFilters} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-gold">
              {t.filter.reset}
            </button>
            <a href="#import" className="rounded-full bg-crimson px-5 py-2.5 text-sm font-bold text-white">
              {t.nav.import}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
