"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Languages, Moon, Sun } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { Logo } from "@/components/ui/Logo";
import { featureDictionaries } from "@/lib/i18n/features";

/** Minimal chrome for /account pages: brand, back-to-store, language + theme toggles. */
export function AccountShell({ children }: { children: ReactNode }) {
  const { lang, theme, dir, t, toggleLang, toggleTheme } = usePrefs();
  const f = featureDictionaries[lang].account;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const pill =
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold text-fg/90 transition hover:border-gold hover:text-gold";

  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30">
        <nav className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 md:px-6" aria-label="account">
          <Link href="/" className="flex items-center gap-3" aria-label="GRAND POWER">
            <Logo size={46} />
            <span className="hidden leading-tight sm:block">
              <span className="block font-[family-name:var(--font-michroma)] text-sm tracking-widest">GRAND POWER</span>
              <span className="block text-xs font-bold text-gold">قراند باور</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className={pill}>
              <Back size={15} />
              <span className="hidden sm:inline">{f.backToStore}</span>
            </Link>
            <button onClick={toggleLang} className={pill} aria-label={t.toggles.lang}>
              <Languages size={16} />
              {lang === "ar" ? "EN" : "ع"}
            </button>
            <button onClick={toggleTheme} className={`${pill} w-10 justify-center px-0`} aria-label={theme === "dark" ? t.toggles.light : t.toggles.dark}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">{children}</main>
    </div>
  );
}
