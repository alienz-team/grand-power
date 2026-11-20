"use client";

import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import { Logo } from "@/components/ui/Logo";
import { SITE_URL, telLink, waLink } from "@/lib/config/contact";
import { useStore } from "./store-context";

export function Footer() {
  const { t, lang } = usePrefs();
  const { settings } = useStore();
  const year = new Date().getFullYear();

  const links = [
    { href: "#store", label: t.nav.store },
    { href: "#deals", label: t.nav.deals },
    { href: "#catalog", label: t.catalog.kicker },
    { href: "#process", label: t.nav.process },
    { href: "#import", label: t.nav.import },
    { href: "#about", label: t.nav.about },
  ];

  return (
    <footer id="contact" className="border-t border-line bg-bg-2 pb-28 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <Logo size={96} />
          <p className="mt-3 font-[family-name:var(--font-michroma)] tracking-widest">GRAND POWER</p>
          <p className="text-sm font-bold text-gold">قراند باور</p>
          <p className="mt-3 text-sm text-muted">{t.footer.tagline}</p>
        </div>

        <nav aria-label={t.footer.quick}>
          <h3 className="mb-4 text-sm font-black">{t.footer.quick}</h3>
          <ul className="space-y-2 text-sm text-muted">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-gold">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-4 text-sm font-black">{t.footer.contact}</h3>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <a href={telLink(settings.phoneNumber)} className="flex items-center gap-2 hover:text-gold" dir="ltr">
                <Phone size={16} /> {settings.phoneNumber}
              </a>
            </li>
            <li>
              <a href={waLink(settings.whatsappNumber, t.whatsapp.general)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold">
                <WhatsAppIcon size={16} /> WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-gold">
                <Mail size={16} /> {settings.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} /> {lang === "ar" ? settings.addressAr : settings.addressEn}
            </li>
            <li>
              <a href={SITE_URL} className="flex items-center gap-2 hover:text-gold">
                <Globe size={16} /> gpower.store
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-black">{t.footer.follow}</h3>
          <div className="flex flex-col gap-2">
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-2xl border border-line p-3 text-sm font-bold hover:border-[#1877F2] hover:text-[#1877F2]">
              <FacebookIcon size={20} /> {t.footer.facebook}
            </a>
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-2xl border border-line p-3 text-sm font-bold hover:border-[#E1306C] hover:text-[#E1306C]">
              <InstagramIcon size={20} /> {t.footer.instagram} <span className="text-muted" dir="ltr">@gpower_ly</span>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-muted md:px-6">
          © {year} GRAND POWER | قراند باور — {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
