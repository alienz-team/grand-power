"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarCheck, Droplets, Sparkles, Wrench } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { featureDictionaries } from "@/lib/i18n/features";
import { SERVICE_TYPES, SERVICES, type ServiceType } from "@/lib/services";
import { useStore } from "./store-context";

const ICONS: Record<ServiceType, typeof Wrench> = { MOBILE_WORKSHOP: Wrench, CAR_WASH: Droplets, CAR_EDITING: Sparkles };

/** Three on-site services: mobile workshop, mobile car wash, car editing. */
export function Services() {
  const { lang } = usePrefs();
  const f = featureDictionaries[lang].services;

  return (
    <section id="services" className="bg-bg-2 py-20 md:py-28" aria-labelledby="services-h">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-crimson uppercase">{f.kicker}</p>
          <h2 id="services-h" className="font-display text-3xl leading-tight md:text-5xl">
            {f.title}
          </h2>
          <div className="metal-line mt-5 w-32" />
          <p className="mt-5 text-muted md:text-lg">{f.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {SERVICE_TYPES.map((type, i) => (
            <ServiceCard key={type} type={type} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ type, index }: { type: ServiceType; index: number }) {
  const { lang } = usePrefs();
  const { bookService } = useStore();
  const f = featureDictionaries[lang].services;
  const s = SERVICES[type];
  const Icon = ICONS[type];
  const [img, setImg] = useState(0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lux"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {s.images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? s[lang] : ""}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className={`object-cover transition duration-700 ${i === img ? "opacity-100 group-hover:scale-105" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
        <span className="absolute start-4 top-4 grid h-12 w-12 place-items-center rounded-2xl bg-crimson text-white shadow-lg">
          <Icon size={22} />
        </span>
        <div className="absolute inset-x-4 bottom-3 flex gap-1.5">
          {s.images.map((src, i) => (
            <button
              key={src}
              onClick={() => setImg(i)}
              aria-label={`${i + 1}`}
              className={`h-1.5 flex-1 rounded-full transition ${i === img ? "bg-white" : "bg-white/35 hover:bg-white/60"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <h3 className="text-2xl font-black">{s[lang]}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{lang === "ar" ? s.taglineAr : s.taglineEn}</p>

        <p className="mt-5 mb-2 text-xs font-black tracking-widest text-gold uppercase">{f.includes}</p>
        <ul className="mb-6 flex flex-wrap gap-2">
          {s.options.map((o) => (
            <li key={o.key}>
              <button
                onClick={() => bookService(type, o.key)}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-bold transition hover:border-gold hover:text-gold"
              >
                {o[lang]}
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => bookService(type)}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-crimson py-3.5 text-sm font-black text-white transition hover:bg-crimson-hi"
        >
          <CalendarCheck size={17} />
          {f.book}
        </button>
      </div>
    </motion.article>
  );
}
