"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Menu, Moon, Phone, Sun, X } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { telLink, waLink } from "@/lib/config/contact";
import { useStore } from "./store-context";

export function Navbar() {
  const { t, lang, theme, toggleLang, toggleTheme } = usePrefs();
  const { settings } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#store", label: t.nav.store },
    { href: "#deals", label: t.nav.deals },
    { href: "#catalog", label: t.catalog.kicker },
    { href: "#process", label: t.nav.process },
    { href: "#import", label: t.nav.import },
    { href: "#about", label: t.nav.about },
  ];

  const iconBtn =
    "grid h-10 w-10 place-items-center rounded-full border border-line text-fg/90 transition hover:border-gold hover:text-gold";

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "glass shadow-lux" : "bg-transparent"}`}
    >
      <nav
        className={`mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 md:px-6 ${
          scrolled ? "" : "[--fg:#f4f4f6] [--line:rgba(255,255,255,0.22)] [--surface-2:rgba(255,255,255,0.1)] text-fg"
        }`}
        aria-label="main"
      >
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="GRAND POWER">
          <Logo size={52} priority />
          <span className="hidden leading-tight sm:block">
            <span className="block font-[family-name:var(--font-michroma)] text-sm tracking-widest">GRAND POWER</span>
            <span className="block text-xs font-bold text-gold">قراند باور</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3 py-2 text-sm font-semibold text-fg/80 transition hover:bg-surface-2 hover:text-fg">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold text-fg/90 transition hover:border-gold hover:text-gold" aria-label={t.toggles.lang}>
            <Languages size={16} />
            <span>{lang === "ar" ? "EN" : "ع"}</span>
          </button>
          <button onClick={toggleTheme} className={iconBtn} aria-label={theme === "dark" ? t.toggles.light : t.toggles.dark}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a href={telLink(settings.phoneNumber)} className={`${iconBtn} hidden md:grid`} aria-label={t.dock.call}>
            <Phone size={17} />
          </a>
          <a
            href={waLink(settings.whatsappNumber, t.whatsapp.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 md:inline-flex"
          >
            <WhatsAppIcon size={18} />
            {t.hero.whatsapp}
          </a>
          <button onClick={() => setOpen(true)} className={`${iconBtn} lg:hidden`} aria-label={t.toggles.menu} aria-expanded={open}>
            <Menu size={18} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-[72px] items-center justify-between px-4">
              <Logo size={48} />
              <button onClick={() => setOpen(false)} className={iconBtn} aria-label={t.toggles.close}>
                <X size={18} />
              </button>
            </div>
            <ul className="mt-6 space-y-1 px-6">
              {links.map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                  <a href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-4 font-display text-2xl">
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
