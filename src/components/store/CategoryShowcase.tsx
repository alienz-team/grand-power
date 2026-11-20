"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { SectionHeading } from "@/components/ui/Pills";
import type { Availability, CategoryInfo } from "@/lib/types";
import { useStore } from "./store-context";

function RotatingImages({ images, alt, offset }: { images: string[]; alt: string; offset: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    // Stagger card start times so the four carousels don't flip in lockstep.
    const start = setTimeout(() => {
      interval = setInterval(() => setI((n) => (n + 1) % images.length), 3500);
    }, offset);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [images.length, offset]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync">
        <motion.div
          key={images[i]}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1 }, scale: { duration: 4.5, ease: "easeOut" } }}
        >
          <Image src={images[i]} alt={alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 start-4 z-10 flex gap-1.5">
        {images.map((src, n) => (
          <span key={src} className={`h-1 rounded-full transition-all ${n === i ? "w-6 bg-gold" : "w-2 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}

export function CategoryShowcase({ categories, counts }: { categories: CategoryInfo[]; counts: Record<string, number> }) {
  const { t, lang } = usePrefs();
  const { goToCatalog } = useStore();

  const open = (c: CategoryInfo, availability: "ALL" | Availability = "ALL") =>
    goToCatalog({ category: c.key, availability, engine: "ALL", q: "" });

  return (
    <section id="store" className="mx-auto max-w-7xl px-4 pt-24 pb-12 md:px-6 md:pt-32" aria-labelledby="store-h">
      <SectionHeading id="store-h" kicker={t.store.kicker} title={t.store.title} subtitle={t.store.subtitle} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c, idx) => {
          const images = c.carouselImages.length ? c.carouselImages : [c.image];
          const name = lang === "ar" ? c.nameAr : c.nameEn;
          return (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: idx * 0.08, duration: 0.6 }}
              className="group relative h-[440px] overflow-hidden rounded-3xl border border-line bg-black"
            >
              <RotatingImages images={images} alt={name} offset={idx * 700} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <button onClick={() => open(c)} className="absolute inset-0 z-10" aria-label={`${t.store.browse} ${name}`} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 pb-9 text-white">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-gold">
                    {String(idx + 1).padStart(2, "0")} · {counts[c.key] ?? 0} {t.store.items}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 backdrop-blur-md transition group-hover:bg-crimson">
                    <ArrowUpRight size={16} className="rtl:-scale-x-100" />
                  </span>
                </div>
                <h3 className="font-display text-3xl">{name}</h3>
                <p className="mt-1 text-sm text-white/70">{lang === "ar" ? c.taglineAr : c.taglineEn}</p>
                <div className="pointer-events-auto mt-4 flex gap-2">
                  <button onClick={() => open(c, "IN_LIBYA")} className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-[11px] font-bold hover:bg-emerald-500">
                    {t.availabilityLong.IN_LIBYA}
                  </button>
                  <button onClick={() => open(c, "IMPORT")} className="rounded-full bg-sky-600/90 px-3 py-1.5 text-[11px] font-bold hover:bg-sky-600">
                    {t.availabilityLong.IMPORT}
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
