"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { featureDictionaries } from "@/lib/i18n/features";
import { IMG } from "@/lib/images";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { useStore } from "./store-context";

type Tab = "ALL" | "NEW" | "USED";
const TABS: Tab[] = ["ALL", "NEW", "USED"];

/** معارض قراند باور — Libyan-market cars, split into showroom-new and used (incl. certified). */
export function Showroom({ products }: { products: Product[] }) {
  const { lang, dir } = usePrefs();
  const { goToCatalog } = useStore();
  const f = featureDictionaries[lang].showroom;
  const [tab, setTab] = useState<Tab>("ALL");

  const cars = useMemo(() => products.filter((p) => p.category === "CARS"), [products]);
  const counts = useMemo(
    () => ({ ALL: cars.length, NEW: cars.filter((p) => p.condition === "NEW").length, USED: cars.filter((p) => p.condition !== "NEW").length }),
    [cars],
  );
  const rows = useMemo(
    () => (tab === "ALL" ? cars : tab === "NEW" ? cars.filter((p) => p.condition === "NEW") : cars.filter((p) => p.condition !== "NEW")),
    [cars, tab],
  );
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  if (cars.length === 0) return null;

  return (
    <section id="showroom" className="py-20 md:py-28" aria-labelledby="showroom-h">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-line">
          <Image src={IMG.usedCarLot} alt="" fill sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
          <div className="relative p-6 text-white md:p-10">
            <p className="mb-3 text-xs font-bold tracking-[0.3em] text-gold uppercase">{f.kicker}</p>
            <h2 id="showroom-h" className="max-w-3xl font-display text-3xl leading-tight md:text-5xl">
              {f.title}
            </h2>
            <p className="mt-4 max-w-2xl text-white/80 md:text-lg">{f.subtitle}</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
              <ShieldCheck size={15} className="text-gold" />
              {f.inspected}
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={f.kicker} className="inline-flex rounded-full border border-line p-1">
            {TABS.map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${tab === k ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
              >
                {f.tabs[k]} <span className="opacity-60">({counts[k]})</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => goToCatalog({ category: "CARS" })}
            className="inline-flex items-center gap-2 text-sm font-bold text-gold hover:underline"
          >
            {f.browseAll}
            <Arrow size={16} />
          </button>
        </div>

        {rows.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{f.empty}</p>
        )}
      </div>
    </section>
  );
}
