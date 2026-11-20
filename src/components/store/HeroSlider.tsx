"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { waLink } from "@/lib/config/contact";
import type { HeroSlide } from "@/lib/types";
import { useStore } from "./store-context";

const DURATION = 6500;

/** Split into animated chunks; consecutive Latin words stay in one chunk so RTL bidi ordering stays correct. */
function chunks(text: string): string[] {
  const out: string[] = [];
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const latin = /^[A-Za-z0-9&.\-]+$/.test(w);
    const prev = out[out.length - 1];
    if (latin && prev && /^[A-Za-z0-9&.\- ]+$/.test(prev)) out[out.length - 1] = `${prev} ${w}`;
    else out.push(w);
  }
  return out;
}

function Words({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {chunks(text).map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}
          {" "}
        </motion.span>
      ))}
    </span>
  );
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { t, lang, dir } = usePrefs();
  const { settings } = useStore();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setTimeout(() => go(index + 1), DURATION);
    return () => clearTimeout(id);
  }, [index, paused, count, go]);

  if (!count) return null;
  const s = slides[index];
  const title = lang === "ar" ? s.titleAr : s.titleEn;
  const subtitle = lang === "ar" ? s.subtitleAr : s.subtitleEn;
  const cta = lang === "ar" ? s.ctaTextAr : s.ctaTextEn;
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <section
      className="relative -mt-[72px] h-[100svh] max-h-[1100px] min-h-[620px] w-full overflow-hidden bg-black"
      aria-roledescription="carousel"
      aria-label="GRAND POWER showcase"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={s.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <div className="absolute inset-0" style={{ animation: `kenburns ${DURATION + 1500}ms ease-out forwards` }}>
            <Image src={s.imageUrl} alt={title} fill priority={index === 0} sizes="100vw" className="object-cover" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Cinematic grading */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-36 md:px-6 md:pb-44">
        <motion.p
          key={`k-${s.id}`}
          initial={{ opacity: 0, x: dir === "rtl" ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 flex items-center gap-3 text-xs font-bold tracking-[0.35em] text-gold uppercase"
        >
          <span className="h-px w-10 bg-gold" />
          GRAND POWER · {String(index + 1).padStart(2, "0")}/{String(count).padStart(2, "0")}
        </motion.p>

        <h1 key={`t-${s.id}-${lang}`} className="font-display max-w-4xl text-5xl leading-[1.05] text-white sm:text-6xl md:text-8xl">
          <Words text={title} />
        </h1>
        <p key={`s-${s.id}-${lang}`} className="mt-5 max-w-2xl text-lg text-white/80 md:text-2xl">
          <Words text={subtitle} delay={0.35} />
        </p>

        <motion.div
          key={`c-${s.id}`}
          className="mt-8 flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <a href={s.ctaLink || "#store"} className="rounded-full bg-crimson px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_40px_-10px] shadow-crimson transition hover:bg-crimson-hi">
            {cta}
          </a>
          <a
            href={waLink(settings.whatsappNumber, t.whatsapp.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <WhatsAppIcon size={18} />
            {t.hero.whatsapp}
          </a>
        </motion.div>
      </div>

      {/* Controls + indicators */}
      <div className="absolute inset-x-0 bottom-24 z-10 md:bottom-28">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex flex-1 gap-2" role="tablist">
            {slides.map((sl, i) => (
              <button
                key={sl.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`${t.hero.slide} ${i + 1}`}
                onClick={() => go(i)}
                className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              >
                {i === index && (
                  <motion.span
                    key={`${sl.id}-${paused}`}
                    className="absolute inset-y-0 start-0 bg-gold"
                    initial={{ width: paused ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }}
                  />
                )}
                {i < index && <span className="absolute inset-0 bg-white/60" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(index - 1)} aria-label={t.hero.prev} className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white backdrop-blur-md hover:bg-white/15">
              <PrevIcon size={18} />
            </button>
            <button onClick={() => setPaused((p) => !p)} aria-label={paused ? t.hero.play : t.hero.pause} className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white backdrop-blur-md hover:bg-white/15">
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button onClick={() => go(index + 1)} aria-label={t.hero.next} className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white backdrop-blur-md hover:bg-white/15">
              <NextIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
