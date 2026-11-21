// On-site services catalogue — single source for storefront cards, booking form, account page, admin and validation.
import { IMG } from "@/lib/images";

export const SERVICE_TYPES = ["MOBILE_WORKSHOP", "CAR_WASH", "CAR_EDITING"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const TIME_SLOTS = ["MORNING", "AFTERNOON", "EVENING"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export interface ServiceOption {
  key: string;
  ar: string;
  en: string;
}

export interface ServiceDef {
  type: ServiceType;
  ar: string;
  en: string;
  taglineAr: string;
  taglineEn: string;
  images: string[];
  options: ServiceOption[];
}

export const SERVICES: Record<ServiceType, ServiceDef> = {
  MOBILE_WORKSHOP: {
    type: "MOBILE_WORKSHOP",
    ar: "ورش متنقلة وصيانة",
    en: "Mobile Workshop & Maintenance",
    taglineAr: "فنيّ مجهّز يصل إلى بيتك أو عملك: صيانة دورية، زيت وفلاتر، وكشف أعطال بالكمبيوتر.",
    taglineEn: "A fully-equipped technician comes to your home or work: servicing, oil & filters and computer diagnostics.",
    images: [IMG.engineBayClean, IMG.toolboxWorkshop, IMG.dashDiagnostics, IMG.toolsWrenches],
    options: [
      { key: "ON_SITE", ar: "صيانة في الموقع (منزل / عمل)", en: "On-site / home maintenance" },
      { key: "OIL_FILTER", ar: "تغيير زيت وفلاتر", en: "Oil & filter change" },
      { key: "DIAGNOSTICS", ar: "كشف الأعطال بالكمبيوتر", en: "Diagnostics & fault inspection" },
      { key: "BATTERY_ELECTRIC", ar: "بطارية وكهرباء", en: "Battery & electrical" },
    ],
  },
  CAR_WASH: {
    type: "CAR_WASH",
    ar: "غسيل متنقل",
    en: "Mobile Car Wash",
    taglineAr: "غسيل احترافي بالرغوة أينما كانت سيارتك — خارجي، داخلي، أو تلميع كامل.",
    taglineEn: "Professional foam wash wherever your car is parked — exterior, interior or full detailing.",
    images: [IMG.washFoamGrey, IMG.washFoamFront, IMG.washFoamBlack, IMG.washFoamWheel],
    options: [
      { key: "EXTERIOR", ar: "غسيل خارجي", en: "Exterior wash" },
      { key: "FULL", ar: "غسيل داخلي وخارجي", en: "Interior + exterior" },
      { key: "DETAILING", ar: "تلميع وتنظيف عميق", en: "Detailing & polish" },
      { key: "ENGINE", ar: "غسيل المحرك", en: "Engine bay wash" },
    ],
  },
  CAR_EDITING: {
    type: "CAR_EDITING",
    ar: "تعديل السيارات",
    en: "Car Editing",
    taglineAr: "تعديل الأداء والشكل: برمجة، بودي كيت، جنوط، ومقصورة داخلية حسب ذوقك.",
    taglineEn: "Performance and styling builds: tuning, body kits, wheels and custom interiors.",
    images: [IMG.tunedWidebody, IMG.engineBayV8, IMG.washFoamWheel, IMG.interior],
    options: [
      { key: "TUNING", ar: "برمجة وتعديل الأداء", en: "Performance tuning" },
      { key: "STYLING", ar: "تعديل خارجي وبودي كيت", en: "Styling & body kit" },
      { key: "INTERIOR", ar: "تعديل المقصورة الداخلية", en: "Interior modifications" },
      { key: "WHEELS", ar: "جنوط وتنزيل", en: "Wheels & suspension" },
      { key: "CUSTOM", ar: "مشروع تعديل خاص", en: "Custom build request" },
    ],
  },
};

export const TIME_SLOT_LABELS: Record<TimeSlot, { ar: string; en: string }> = {
  MORNING: { ar: "صباحاً (8 – 12)", en: "Morning (8–12)" },
  AFTERNOON: { ar: "ظهراً (12 – 4)", en: "Afternoon (12–4)" },
  EVENING: { ar: "مساءً (4 – 9)", en: "Evening (4–9)" },
};

export function isValidOption(type: ServiceType, option: string): boolean {
  return SERVICES[type].options.some((o) => o.key === option);
}

export function optionLabel(type: ServiceType, option: string, lang: "ar" | "en"): string {
  const o = SERVICES[type].options.find((x) => x.key === option);
  return o ? o[lang] : option;
}
