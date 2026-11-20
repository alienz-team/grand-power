"use client";

import { usePrefs } from "@/components/providers/PreferencesProvider";
import { useStore } from "./store-context";

export function PromoBanner() {
  const { lang } = usePrefs();
  const { settings } = useStore();
  const text = lang === "ar" ? settings.promoBannerAr : settings.promoBannerEn;
  if (!settings.isPromoActive || !text) return null;
  const items = Array.from({ length: 6 }, () => text);
  return (
    <div className="relative z-50 overflow-hidden bg-crimson py-2 text-xs font-bold text-white md:text-sm" role="region" aria-label="promo">
      <div dir="ltr" className="animate-marquee flex w-max gap-16 whitespace-nowrap">
        {[...items, ...items].map((s, i) => (
          <span key={i} dir="auto" aria-hidden={i > 0}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
