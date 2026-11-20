"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { deleteSlide, reorderSlides, saveSettings, saveSlide } from "@/app/admin/actions";
import type { HeroSlide, SiteSettings } from "@/lib/types";
import { Btn, Card, Drawer, Field, ImageListEditor, inputCls, PageHeader, SeedNotice, Switch, useToast, useTx } from "./ui";

type SlideDraft = Omit<HeroSlide, "id"> & { id?: string };

const emptySlide = (order: number): SlideDraft => ({
  titleAr: "",
  titleEn: "",
  subtitleAr: "",
  subtitleEn: "",
  imageUrl: "",
  ctaTextAr: "تسوّق الآن",
  ctaTextEn: "Shop Now",
  ctaLink: "#store",
  sortOrder: order,
  isActive: true,
});

export function ContentManager({ slides, settings, source }: { slides: HeroSlide[]; settings: SiteSettings; source: "database" | "seed" }) {
  const tx = useTx();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<SlideDraft | null>(null);
  const [about, setAbout] = useState({
    aboutTextAr: settings.aboutTextAr,
    aboutTextEn: settings.aboutTextEn,
    sloganAr: settings.sloganAr,
    sloganEn: settings.sloganEn,
    promoBannerAr: settings.promoBannerAr,
    promoBannerEn: settings.promoBannerEn,
    isPromoActive: settings.isPromoActive,
  });

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      toast(r.ok, r.message);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const ids = slides.map((s) => s.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    run(() => reorderSlides(ids));
  };

  const setD = <K extends keyof SlideDraft>(k: K, v: SlideDraft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <>
      <PageHeader
        title={tx("محرر محتوى الواجهة والهيرو", "Storefront & Hero CMS")}
        subtitle={tx("الشرائح السينمائية، نص من نحن، والشريط الترويجي", "Cinematic slides, About text and promo banner")}
        actions={
          <Btn onClick={() => setDraft(emptySlide(slides.length))}>
            <Plus size={16} /> {tx("شريحة جديدة", "New slide")}
          </Btn>
        }
      />
      <SeedNotice source={source} />

      <Card>
        <h2 className="mb-4 font-black">
          {tx("شرائح الهيرو", "Hero slides")} <span className="text-muted">({slides.length})</span>
        </h2>
        <ol className="space-y-2">
          {slides.map((s, i) => (
            <li key={s.id} className={`flex items-center gap-3 rounded-2xl border border-line p-2 ${s.isActive ? "" : "opacity-50"}`}>
              <span className="w-6 text-center font-mono text-xs text-muted">{i + 1}</span>
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {s.imageUrl && <Image src={s.imageUrl} alt="" fill sizes="96px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{s.titleAr}</p>
                <p className="truncate text-xs text-muted">{s.titleEn}</p>
              </div>
              <div className="flex gap-1">
                <button disabled={pending || i === 0} onClick={() => move(i, -1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line disabled:opacity-30" aria-label="up">
                  <ArrowUp size={14} />
                </button>
                <button disabled={pending || i === slides.length - 1} onClick={() => move(i, 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line disabled:opacity-30" aria-label="down">
                  <ArrowDown size={14} />
                </button>
                <button onClick={() => run(() => saveSlide({ ...s, isActive: !s.isActive }))} className="grid h-8 w-8 place-items-center rounded-lg border border-line" aria-label="toggle">
                  {s.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => setDraft(s)} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-gold" aria-label="edit">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => confirm(tx("حذف الشريحة؟", "Delete slide?")) && run(() => deleteSlide(s.id))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-crimson"
                  aria-label="delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 font-black">{tx("نص «من نحن» والشعار", "About text & slogan")}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={tx("الشعار بالعربية", "Arabic slogan")}>
            <input className={inputCls} dir="rtl" value={about.sloganAr} onChange={(e) => setAbout({ ...about, sloganAr: e.target.value })} />
          </Field>
          <Field label={tx("الشعار بالإنجليزية", "English slogan")}>
            <input className={inputCls} dir="ltr" value={about.sloganEn} onChange={(e) => setAbout({ ...about, sloganEn: e.target.value })} />
          </Field>
          <Field label={tx("من نحن بالعربية", "About (Arabic)")}>
            <textarea className={`${inputCls} h-36 py-2`} dir="rtl" value={about.aboutTextAr} onChange={(e) => setAbout({ ...about, aboutTextAr: e.target.value })} />
          </Field>
          <Field label={tx("من نحن بالإنجليزية", "About (English)")}>
            <textarea className={`${inputCls} h-36 py-2`} dir="ltr" value={about.aboutTextEn} onChange={(e) => setAbout({ ...about, aboutTextEn: e.target.value })} />
          </Field>
        </div>

        <h2 className="mt-6 mb-3 font-black">{tx("الشريط الترويجي", "Promo banner")}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={tx("النص بالعربية", "Arabic text")}>
            <input className={inputCls} dir="rtl" value={about.promoBannerAr} onChange={(e) => setAbout({ ...about, promoBannerAr: e.target.value })} />
          </Field>
          <Field label={tx("النص بالإنجليزية", "English text")}>
            <input className={inputCls} dir="ltr" value={about.promoBannerEn} onChange={(e) => setAbout({ ...about, promoBannerEn: e.target.value })} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Switch checked={about.isPromoActive} onChange={(v) => setAbout({ ...about, isPromoActive: v })} label={tx("إظهار الشريط", "Show banner")} />
          <Btn onClick={() => run(() => saveSettings(about))} disabled={pending}>
            <Save size={16} /> {tx("حفظ المحتوى", "Save content")}
          </Btn>
        </div>
      </Card>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? tx("تعديل الشريحة", "Edit slide") : tx("شريحة جديدة", "New slide")}
        footer={
          <Btn className="w-full" disabled={pending || !draft?.imageUrl} onClick={() => draft && run(() => saveSlide(draft), () => setDraft(null))}>
            <Save size={16} /> {tx("حفظ الشريحة", "Save slide")}
          </Btn>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-black">{tx("صورة الخلفية", "Background image")}</h3>
              <ImageListEditor value={draft.imageUrl ? [draft.imageUrl] : []} onChange={(v) => setD("imageUrl", v[v.length - 1] || "")} max={1} folder="hero" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={tx("العنوان بالعربية", "Arabic title")}>
                <input className={inputCls} dir="rtl" value={draft.titleAr} onChange={(e) => setD("titleAr", e.target.value)} />
              </Field>
              <Field label={tx("العنوان بالإنجليزية", "English title")}>
                <input className={inputCls} dir="ltr" value={draft.titleEn} onChange={(e) => setD("titleEn", e.target.value)} />
              </Field>
              <Field label={tx("العنوان الفرعي بالعربية", "Arabic subtitle")}>
                <input className={inputCls} dir="rtl" value={draft.subtitleAr} onChange={(e) => setD("subtitleAr", e.target.value)} />
              </Field>
              <Field label={tx("العنوان الفرعي بالإنجليزية", "English subtitle")}>
                <input className={inputCls} dir="ltr" value={draft.subtitleEn} onChange={(e) => setD("subtitleEn", e.target.value)} />
              </Field>
              <Field label={tx("نص الزر بالعربية", "CTA text (Arabic)")}>
                <input className={inputCls} dir="rtl" value={draft.ctaTextAr} onChange={(e) => setD("ctaTextAr", e.target.value)} />
              </Field>
              <Field label={tx("نص الزر بالإنجليزية", "CTA text (English)")}>
                <input className={inputCls} dir="ltr" value={draft.ctaTextEn} onChange={(e) => setD("ctaTextEn", e.target.value)} />
              </Field>
              <Field label={tx("رابط الزر", "CTA link")} hint="#store · #deals · #import · /path · https://…">
                <input className={inputCls} dir="ltr" value={draft.ctaLink} onChange={(e) => setD("ctaLink", e.target.value)} />
              </Field>
              <div className="flex items-end pb-2">
                <Switch checked={draft.isActive} onChange={(v) => setD("isActive", v)} label={tx("نشطة", "Active")} color="bg-emerald-500" />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
