// Single source of truth for official contact defaults.
// Runtime values come from SiteSettings (editable at /admin/settings); these are the fallbacks.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gpower.store";

export const LOGO_URL = "https://images.cdn-files-a.com/uploads/9200547/400_filter_nobg_663181fded339.png";

/** Digits only, international format without "+" (wa.me format). */
export const DEFAULT_WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "218915229703").replace(/\D/g, "");

export const CONTACT = {
  whatsapp: DEFAULT_WHATSAPP,
  phone: `+${DEFAULT_WHATSAPP}`,
  phoneDisplay: "+218-91-5229703",
  email: "info@gpower.store",
  facebook: "https://m.facebook.com/groups/149394612485159/",
  instagram: "https://www.instagram.com/gpower_ly",
  domain: "gpower.store",
} as const;

export function digitsOnly(n: string): string {
  return (n || "").replace(/\D/g, "");
}

export function waLink(number: string, message?: string): string {
  const n = digitsOnly(number) || DEFAULT_WHATSAPP;
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function telLink(number: string): string {
  const n = digitsOnly(number) || DEFAULT_WHATSAPP;
  return `tel:+${n}`;
}
