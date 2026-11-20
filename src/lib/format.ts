import type { Lang, Product } from "@/lib/types";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { waLink } from "@/lib/config/contact";

export function formatPrice(value: number, lang: Lang): string {
  const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  return lang === "ar" ? `${n} د.ل` : `${n} LYD`;
}

// Latin digits with comma grouping in both languages (ar-LY uses "." grouping, which reads like decimals).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatNumber(value: number, _lang: Lang): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export const title = (p: Pick<Product, "titleAr" | "titleEn">, lang: Lang) => (lang === "ar" ? p.titleAr : p.titleEn);

/**
 * Smart pre-filled WhatsApp message (always Arabic, per brand spec):
 * أهلاً قراند باور (GRAND POWER)، أنا مهتم بالاستفسار عن: [Title] - الفئة: [Category/Availability] (كود: [ID])
 */
export function productWhatsappMessage(p: Product): string {
  const d = dictionaries.ar;
  return `${d.whatsapp.greeting} ${p.titleAr} - ${d.whatsapp.category}: ${d.categories[p.category]} / ${d.availability[p.availability]} (${d.whatsapp.code}: ${p.code})`;
}

export function productWhatsappLink(p: Product, number: string): string {
  return waLink(number, productWhatsappMessage(p));
}

/** Indicative USD→LYD rate for the import calculator only. */
export const USD_TO_LYD = 5.45;
