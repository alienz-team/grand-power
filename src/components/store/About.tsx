"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { Logo } from "@/components/ui/Logo";
import { IMG } from "@/lib/images";
import { useStore } from "./store-context";

export function About() {
  const { t, lang } = usePrefs();
  const { settings } = useStore();
  const about = lang === "ar" ? settings.aboutTextAr : settings.aboutTextEn;
  const slogan = lang === "ar" ? settings.sloganAr : settings.sloganEn;

  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28" aria-labelledby="about-h">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: lang === "ar" ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-black sm:aspect-[4/3] lg:aspect-[4/5]"
        >
          <Image src={IMG.gClass} alt="GRAND POWER showroom" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute start-5 bottom-5 flex items-center gap-3 rounded-2xl bg-black/50 p-3 pe-5 backdrop-blur-md">
            <Logo size={56} />
            <div className="text-white">
              <p className="font-[family-name:var(--font-michroma)] text-sm tracking-widest">GRAND POWER</p>
              <p className="text-xs text-gold">gpower.store</p>
            </div>
          </div>
        </motion.div>

        <div>
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-crimson uppercase">{t.about.kicker}</p>
          <h2 id="about-h" className="font-display text-3xl leading-tight md:text-5xl">
            {t.about.title}
          </h2>
          <div className="metal-line mt-5 w-32" />
          <p className="mt-6 text-lg leading-relaxed text-muted">{about}</p>
          <p className="mt-4 text-xl font-black text-gold-gradient">{slogan}</p>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {t.about.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-2xl text-crimson" dir="ltr">
                  {s.value}
                </dd>
                <dd className="mt-1 text-xs text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
