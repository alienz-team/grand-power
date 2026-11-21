import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { LOGO_URL, SITE_URL } from "@/lib/config/contact";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, THEME_COOKIE, parseLang, parseTheme } from "@/lib/prefs";
import "./globals.css";

// Google Fonts via plain <link> tags (not next/font) so `next build` never fetches fonts at build time —
// next/font's build-time loader fails inside Cloudflare Workers Builds. Families map to --font-cairo /
// --font-michroma in globals.css; CSP already allows fonts.googleapis.com + fonts.gstatic.com.
const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Michroma&display=swap";

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
      className={theme === "dark" ? "dark" : undefined}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <PreferencesProvider initialLang={lang} initialTheme={theme}>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
