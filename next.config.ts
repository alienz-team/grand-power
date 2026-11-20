import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "";
  } catch {
    return "";
  }
})();

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; eval only needed for dev HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://images.cdn-files-a.com https://*.supabase.co",
  `connect-src 'self' https://*.supabase.co${supabaseHost ? ` https://${supabaseHost}` : ""}${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: csp },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Prisma must stay external so OpenNext/workerd resolves its wasm query engine for Cloudflare.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.cdn-files-a.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

// Exposes Cloudflare bindings (env, IMAGES, …) to `next dev` only — starting it during `next build`
// spins up a local workerd per build worker, and they contend for the same SQLite state.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (isDev) initOpenNextCloudflareForDev();
