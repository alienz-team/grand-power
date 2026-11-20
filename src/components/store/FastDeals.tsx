"use client";

import { Zap } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function FastDeals({ products }: { products: Product[] }) {
  const { t } = usePrefs();
  if (!products.length) return null;

  return (
    <section id="deals" className="relative overflow-hidden py-20 md:py-28" aria-labelledby="deals-h">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(215,25,47,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 flex flex-col items-center text-center md:mb-14">
          <span className="animate-voltage mb-5 inline-flex items-center gap-2 rounded-full bg-crimson px-4 py-2 text-xs font-black tracking-widest text-white">
            <Zap size={14} className="fill-current" />
            {t.deals.kicker}
          </span>
          <h2 id="deals-h" className="font-display text-5xl md:text-7xl">
            <span className="text-crimson">⚡</span> {t.deals.title}
          </h2>
          <div className="metal-line mt-5 w-40" />
          <p className="mt-5 max-w-2xl text-muted md:text-lg">{t.deals.subtitle}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
