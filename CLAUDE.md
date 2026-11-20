# GRAND POWER | قراند باور — gpower.store

Bilingual (AR RTL / EN LTR), dark/light automotive super-app: Cars · Motors · Bicycles · Accessories,
each available **في ليبيا (IN_LIBYA)** or **استيراد (IMPORT)**, plus a 6-module super-admin CMS at `/admin`.

## Stack
- Next.js 15 (App Router, TypeScript, Server Actions) · React 19 · Tailwind CSS v4 · Framer Motion · Lucide
- Prisma 6 → Neon PostgreSQL via `@prisma/adapter-neon` (`src/lib/db.ts`) · Supabase Storage (`product-images` bucket, optional) · jose (JWT sessions) · zod
- Deploy: Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`, `wrangler.jsonc`, `open-next.config.ts`, `nodejs_compat`);
  `postinstall: prisma generate`. `vercel.json` is legacy.

## Commands
```
npm run dev          # local dev
npm run build        # must pass with zero TS / ESLint / Next errors
npm run lint
npm run db:push      # create schema on the DB (uses DIRECT_URL)
npm run db:seed      # idempotent seed (catalogue, slides, categories, settings, admin user; needs ADMIN_PASSWORD)
npm run cf:build     # OpenNext Cloudflare build → .open-next/
npm run preview      # build + run locally in workerd (reads .dev.vars — copy of .env)
npm run deploy       # build + wrangler deploy
```

## Layout
- `src/lib/data/seed-data.ts` — rich fallback catalogue (also used by the seeder)
- `src/lib/repo.ts` — all reads. Batches use `prisma.$transaction([...])`, fall back to seed data on any error
- `src/lib/config/contact.ts` — single source for WhatsApp/phone/social defaults
- `src/lib/i18n/dictionaries.ts` — AR/EN copy. WhatsApp inquiry text is always Arabic
- `src/components/store/*` — storefront · `src/components/admin/*` — CMS · `src/app/admin/actions.ts` — all mutations
- Language/theme persist in cookies `gp_lang` / `gp_theme` (read server-side in `app/layout.tsx`, so no flash)

## Rules (do not break)
1. **Zero-human photography.** Only machines: cars, motorcycles, ATVs, bicycles, engines, parts, interiors, studios.
   No people, faces, riders, drivers or hands. Curated, vetted IDs live in `src/lib/images.ts` — vet any new photo visually.
   Unsplash URLs use `?auto=format&fit=crop&w=1800&q=85`.
2. **Never alter the logo**: `https://images.cdn-files-a.com/uploads/9200547/400_filter_nobg_663181fded339.png`.
3. **DB.** `DATABASE_URL` = Neon pooled endpoint (`-pooler` host), used at runtime through the Neon adapter;
   `DIRECT_URL` is for `db push`/migrations only. The Prisma client is request-scoped (React `cache`) — Workers cannot
   share I/O across requests, so never cache it in a global. Batch reads with `prisma.$transaction([...])` — never
   `Promise.all` of queries. Every read must degrade gracefully to seed data.
4. **Admin security.** Every `/admin` page and every server action calls `assertAdmin()` (middleware is only the first layer).
   Validate all input with zod. Image URLs are restricted to `images.unsplash.com`, `images.cdn-files-a.com`, `*.supabase.co`
   (keep `isAllowedImageUrl` in sync with `next.config.ts` `images.remotePatterns` and the CSP `img-src`).
5. **Security headers** live in `next.config.ts` (X-Frame-Options DENY, nosniff, Referrer-Policy, HSTS, CSP, Permissions-Policy;
   `poweredByHeader: false`).
6. After CMS mutations call `revalidatePath('/', 'layout')` so the storefront updates.

## Admin credentials
- Set via env only: `ADMIN_EMAIL`, `ADMIN_PASSWORD` (no hardcoded default password — the repo is public), and
  `ADMIN_SESSION_SECRET` (32+ chars). The seeder also creates a scrypt-hashed ADMIN user in the `User` table.
- Secrets live only in `.env` / `.dev.vars` (both git-ignored) and in the Cloudflare dashboard. Never commit them.

## Contact
- WhatsApp/phone default: `218915229703` (+218-91-5229703) — editable at `/admin/settings`
- Facebook: https://m.facebook.com/groups/149394612485159/ · Instagram: https://www.instagram.com/gpower_ly
