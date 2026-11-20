import type { Lang, Theme } from "@/lib/types";

export const LANG_COOKIE = "gp_lang";
export const THEME_COOKIE = "gp_theme";

export const parseLang = (v: string | undefined | null): Lang => (v === "en" ? "en" : "ar");
export const parseTheme = (v: string | undefined | null): Theme => (v === "light" ? "light" : "dark");
