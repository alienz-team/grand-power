"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Eye, Gauge, Zap } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { AvailabilityPill, DealBadge } from "@/components/ui/Pills";
import { formatPrice, productWhatsappLink } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useStore } from "./store-context";

export function ProductCard({ product: p, index = 0 }: { product: Product; index?: number }) {
  const { t, lang } = usePrefs();
  const { settings, openQuickView } = useStore();
  const name = lang === "ar" ? p.titleAr : p.titleEn;
  const saving = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice - p.price : 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.5 }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lux transition hover:-translate-y-1 hover:border-gold/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <Image
          src={p.images[0]}
          alt={name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        {p.images[1] && (
          <Image
            src={p.images[1]}
            alt=""
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover opacity-0 transition duration-700 group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <DealBadge fast={p.isFastDeal} isNew={p.isNew} />
          <AvailabilityPill value={p.availability} />
        </div>
        <button
          onClick={() => openQuickView(p)}
          className="absolute inset-x-3 bottom-3 inline-flex translate-y-2 items-center justify-center gap-2 rounded-full bg-black/70 py-2.5 text-sm font-bold text-white opacity-0 backdrop-blur-md transition group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 max-md:translate-y-0 max-md:opacity-100"
        >
          <Eye size={16} />
          {t.card.quickView}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>{t.categories[p.category]}</span>
          <span dir="ltr" className="font-mono">
            {p.code}
          </span>
        </div>
        <h3 className="line-clamp-1 text-lg font-extrabold">{name}</h3>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          {p.engineSpec && (
            <span className="inline-flex items-center gap-1">
              {p.engineSpec === "Electric" ? <Zap size={13} /> : <Gauge size={13} />}
              <span dir="ltr">{p.engineSpec}</span>
            </span>
          )}
          {p.powerHp ? (
            <span dir="ltr">
              {p.powerHp} {t.modal.hp}
            </span>
          ) : null}
          {p.year ? (
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} />
              {p.year}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              {saving > 0 && (
                <p className="text-xs text-muted line-through">{formatPrice(p.compareAtPrice!, lang)}</p>
              )}
              <p className="text-xl font-black text-gold-gradient">{formatPrice(p.price, lang)}</p>
            </div>
            {saving > 0 && (
              <span className="rounded-full bg-crimson/10 px-2 py-1 text-[11px] font-bold text-crimson">
                {t.card.save} {formatPrice(saving, lang)}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => openQuickView(p)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-xs font-bold transition hover:border-gold hover:text-gold"
            >
              <Eye size={14} />
              {t.card.quickView}
            </button>
            <a
              href={productWhatsappLink(p, settings.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-whatsapp py-2.5 text-xs font-bold text-white transition hover:brightness-110"
            >
              <WhatsAppIcon size={15} />
              {t.card.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
