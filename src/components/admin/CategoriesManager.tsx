"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveCategory } from "@/app/admin/actions";
import type { CategoryInfo } from "@/lib/types";
import { Btn, Card, Field, ImageListEditor, inputCls, PageHeader, SeedNotice, Switch, useToast, useTx } from "./ui";

function CategoryEditor({ initial }: { initial: CategoryInfo }) {
  const tx = useTx();
  const toast = useToast();
  const router = useRouter();
  const [c, setC] = useState(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof CategoryInfo>(k: K, v: CategoryInfo[K]) => setC((s) => ({ ...s, [k]: v }));

  const save = () =>
    start(async () => {
      const r = await saveCategory({ ...c, image: c.carouselImages[0] || c.image });
      toast(r.ok, r.message);
      if (r.ok) router.refresh();
    });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">
          {c.nameAr} · <span className="text-muted">{c.nameEn}</span>
        </h2>
        <Switch checked={c.isActive} onChange={(v) => set("isActive", v)} label={tx("ظاهر", "Visible")} color="bg-emerald-500" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("الاسم بالعربية", "Arabic name")}>
          <input className={inputCls} dir="rtl" value={c.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
        </Field>
        <Field label={tx("الاسم بالإنجليزية", "English name")}>
          <input className={inputCls} dir="ltr" value={c.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
        </Field>
        <Field label={tx("الوصف المختصر بالعربية", "Arabic tagline")}>
          <input className={inputCls} dir="rtl" value={c.taglineAr} onChange={(e) => set("taglineAr", e.target.value)} />
        </Field>
        <Field label={tx("الوصف المختصر بالإنجليزية", "English tagline")}>
          <input className={inputCls} dir="ltr" value={c.taglineEn} onChange={(e) => set("taglineEn", e.target.value)} />
        </Field>
      </div>
      <h3 className="mt-5 mb-2 text-sm font-black">{tx("صور المعرض الدوّار (3–4 صور، تتبدل كل 3.5 ثانية)", "Rotating carousel (3–4 photos, crossfade every 3.5s)")}</h3>
      <ImageListEditor value={c.carouselImages} onChange={(v) => set("carouselImages", v)} max={6} folder="categories" />
      <Btn className="mt-4" onClick={save} disabled={pending || c.carouselImages.length === 0}>
        <Save size={16} /> {pending ? tx("جاري الحفظ...", "Saving...") : tx("حفظ القسم", "Save category")}
      </Btn>
    </Card>
  );
}

export function CategoriesManager({ categories, source }: { categories: CategoryInfo[]; source: "database" | "seed" }) {
  const tx = useTx();
  return (
    <>
      <PageHeader title={tx("إدارة الأقسام والمعارض", "Categories & Galleries")} subtitle={tx("الأركان الأربعة للسوق", "The four store pillars")} />
      <SeedNotice source={source} />
      <div className="grid gap-5 xl:grid-cols-2">
        {categories.map((c) => (
          <CategoryEditor key={c.id} initial={c} />
        ))}
      </div>
    </>
  );
}
