// Custom next/image loader — no /_next/image optimiser at runtime, so images work on Cloudflare Workers
// (OpenNext) without an Images binding. Unsplash's CDN resizes/encodes on its side via w/q/auto=format;
// every other allowed host (cdn-files-a logo, Supabase Storage) is served as-is.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 80));
    if (!url.searchParams.has("auto")) url.searchParams.set("auto", "format");
    if (!url.searchParams.has("fit")) url.searchParams.set("fit", "crop");
    return url.toString();
  }
  return src;
}
