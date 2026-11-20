import type { Metadata, Viewport } from "next";
import { Cairo, Michroma } from "next/font/google";
import { cookies } from "next/headers";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { LOGO_URL, SITE_URL } from "@/lib/config/contact";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, THEME_COOKIE, parseLang, parseTheme } from "@/lib/prefs";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-cairo", display: "swap" });
const michroma = Michroma({ subsets: ["latin"], weight: "400", variable: "--font-michroma", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const lang = parseLang((await cookies()).get(LANG_COOKIE)?.value);
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.title, template: "%s | GRAND POWER" },
    description: t.meta.description,
    applicationName: "GRAND POWER | قراند باور",
    keywords: ["GRAND POWER", "قراند باور", "gpower", "سيارات ليبيا", "موطوات ليبيا", "دراجات", "كماليات", "استيراد سيارات ليبيا", "600cc", "ATV"],
    icons: { icon: LOGO_URL, apple: LOGO_URL },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: "GRAND POWER | قراند باور",
      title: t.meta.title,
      description: t.meta.description,
      locale: lang === "ar" ? "ar_LY" : "en_US",
      images: [{ url: LOGO_URL, width: 400, height: 400, alt: "GRAND POWER" }],
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description, images: [LOGO_URL] },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08080A" },
    { media: "(prefers-color-scheme: light)", color: "#F8F9FA" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const lang = parseLang(jar.get(LANG_COOKIE)?.value);
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`${cairo.variable} ${michroma.variable} ${theme === "dark" ? "dark" : ""}`}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-bg text-fg">
        <PreferencesProvider initialLang={lang} initialTheme={theme}>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
