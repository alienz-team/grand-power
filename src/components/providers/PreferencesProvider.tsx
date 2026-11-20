"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, THEME_COOKIE } from "@/lib/prefs";
import type { Lang, Theme } from "@/lib/types";

interface PrefsValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  theme: Theme;
  t: Dictionary;
  toggleLang: () => void;
  toggleTheme: () => void;
}

const PrefsContext = createContext<PrefsValue | null>(null);

function persist(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(name, value);
  } catch {
    /* storage unavailable (private mode) — cookie is the source of truth */
  }
}

export function PreferencesProvider({
  initialLang,
  initialTheme,
  children,
}: {
  initialLang: Lang;
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "ar" ? "en" : "ar";
      const html = document.documentElement;
      html.lang = next;
      html.dir = next === "ar" ? "rtl" : "ltr";
      persist(LANG_COOKIE, next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      const html = document.documentElement;
      html.classList.toggle("dark", next === "dark");
      html.style.colorScheme = next;
      persist(THEME_COOKIE, next);
      return next;
    });
  }, []);

  const value = useMemo<PrefsValue>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", theme, t: getDictionary(lang), toggleLang, toggleTheme }),
    [lang, theme, toggleLang, toggleTheme],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PreferencesProvider");
  return ctx;
}
