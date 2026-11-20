"use client";

import { Ship, Zap } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import type { Availability } from "@/lib/types";

export function AvailabilityPill({ value, className = "" }: { value: Availability; className?: string }) {
  const { t } = usePrefs();
  const local = value === "IN_LIBYA";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${
        local ? "bg-emerald-500/90 text-white" : "bg-sky-600/90 text-white"
      } ${className}`}
    >
      {local ? <span aria-hidden>🇱🇾</span> : <Ship size={12} aria-hidden />}
      {t.availability[value]}
    </span>
  );
}

export function DealBadge({ fast, isNew }: { fast: boolean; isNew: boolean }) {
  const { t } = usePrefs();
  if (fast)
    return (
      <span className="animate-voltage inline-flex items-center gap-1 rounded-full bg-crimson px-2.5 py-1 text-[11px] font-extrabold text-white">
        <Zap size={12} className="fill-current" aria-hidden />
        {t.card.fastDeal}
      </span>
    );
  if (isNew)
    return (
      <span className="inline-flex items-center rounded-full bg-gold px-2.5 py-1 text-[11px] font-extrabold text-black">{t.card.new}</span>
    );
  return null;
}

export function SectionHeading({ kicker, title, subtitle, id }: { kicker: string; title: string; subtitle?: string; id?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
      <p className="mb-3 text-xs font-bold tracking-[0.3em] text-crimson uppercase">{kicker}</p>
      <h2 id={id} className="font-display text-3xl leading-tight md:text-5xl">
        {title}
      </h2>
      <div className="metal-line mx-auto mt-5 w-32" />
      {subtitle && <p className="mt-5 text-base text-muted md:text-lg">{subtitle}</p>}
    </div>
  );
}
