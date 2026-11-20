"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Phone, Ship, X } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { AvailabilityPill, DealBadge } from "@/components/ui/Pills";
import { telLink } from "@/lib/config/contact";
import { formatNumber, formatPrice, productWhatsappLink } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useStore } from "./store-context";

export function QuickViewModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return <AnimatePresence>{product && <ModalBody key={product.id} p={product} onClose={onClose} />}</AnimatePresence>;
}

function ModalBody({ p, onClose }: { p: Product; onClose: () => void }) {
  const { t, lang, dir } = usePrefs();
  const { settings } = useStore();
  const [img, setImg] = useState(0);
  const name = lang === "ar" ? p.titleAr : p.titleEn;
  const total = p.images.length;
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setImg((i) => (i + (dir === "rtl" ? -1 + total : 1)) % total);
      if (e.key === "ArrowLeft") setImg((i) => (i + (dir === "rtl" ? 1 : total - 1)) % total);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, total, dir]);

  const rows: [string, string][] = [
    [t.modal.category, t.categories[p.category]],
    [t.modal.availability, t.availabilityLong[p.availability]],
    ...(p.engineSpec ? ([[t.modal.engine, p.engineSpec]] as [string, string][]) : []),
    ...(p.powerHp ? ([[t.modal.power, `${p.powerHp} ${t.modal.hp}`]] as [string, string][]) : []),
    ...(p.year ? ([[t.modal.year, String(p.year)]] as [string, string][]) : []),
    ...(p.mileage != null ? ([[t.modal.mileage, `${formatNumber(p.mileage, lang)} ${t.modal.km}`]] as [string, string][]) : []),
    [t.modal.condition, t.conditions[p.condition] ?? p.condition],
    ...Object.entries(p.specs).map(([k, v]) => [k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), v] as [string, string]),
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <motion.div
        className="relative grid max-h-[94dvh] w-full max-w-6xl overflow-y-auto rounded-t-3xl border border-line bg-surface md:grid-cols-[1.25fr_1fr] md:overflow-hidden md:rounded-3xl"
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t.modal.close}
          className="absolute end-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-crimson"
        >
          <X size={18} />
        </button>

        {/* Gallery */}
        <div className="bg-black">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-[62vh]">
            <AnimatePresence mode="sync">
              <motion.div key={p.images[img]} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <Image src={p.images[img]} alt={`${name} ${img + 1}`} fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" priority />
              </motion.div>
            </AnimatePresence>
            <div className="absolute start-3 top-3 flex gap-2">
              <DealBadge fast={p.isFastDeal} isNew={p.isNew} />
              <AvailabilityPill value={p.availability} />
            </div>
            {total > 1 && (
              <>
                <button onClick={() => setImg((img - 1 + total) % total)} aria-label="prev" className="absolute start-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80">
                  <PrevIcon size={18} />
                </button>
                <button onClick={() => setImg((img + 1) % total)} aria-label="next" className="absolute end-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80">
                  <NextIcon size={18} />
                </button>
                <span className="absolute end-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-xs text-white" dir="ltr">
                  {img + 1} / {total}
                </span>
              </>
            )}
          </div>
          {total > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto p-3">
              {p.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImg(i)}
                  aria-label={`${i + 1}`}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === img ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col p-5 md:max-h-[94dvh] md:overflow-y-auto md:p-7">
          <p className="pe-12 text-xs text-muted">
            {t.card.code}:{" "}
            <span className="font-mono" dir="ltr">
              {p.code}
            </span>
          </p>
          <h2 className="mt-1 text-2xl font-black md:text-3xl">{name}</h2>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-3xl font-black text-gold-gradient">{formatPrice(p.price, lang)}</p>
            {p.compareAtPrice && p.compareAtPrice > p.price && (
              <p className="pb-1 text-sm text-muted line-through">{formatPrice(p.compareAtPrice, lang)}</p>
            )}
          </div>
          <p className="mt-4 leading-relaxed text-muted">{lang === "ar" ? p.descriptionAr : p.descriptionEn}</p>

          <h3 className="mt-6 mb-2 text-xs font-black tracking-widest text-crimson uppercase">{t.modal.specs}</h3>
          <dl className="divide-y divide-line rounded-2xl border border-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="text-muted" dir="auto">
                  {k}
                </dt>
                <dd className="text-end font-bold" dir="auto">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-2 pb-2">
            <a
              href={productWhatsappLink(p, settings.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 text-sm font-black text-white hover:brightness-110"
            >
              <WhatsAppIcon size={18} />
              {t.modal.book}
            </a>
            <div className="grid grid-cols-2 gap-2">
              <a href={telLink(settings.phoneNumber)} className="inline-flex items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-bold hover:border-gold">
                <Phone size={16} />
                {t.modal.call}
              </a>
              <a href="#import" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-bold hover:border-gold">
                <Ship size={16} />
                {t.nav.import}
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
