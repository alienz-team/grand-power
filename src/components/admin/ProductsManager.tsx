"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Plus, Search, Trash2, X, Zap } from "lucide-react";
import { deleteProduct, saveProduct, toggleProduct, type ProductInput } from "@/app/admin/actions";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { formatPrice } from "@/lib/format";
import { CATEGORY_KEYS, CONDITIONS, type CategoryKey, type Product } from "@/lib/types";
import { Btn, Drawer, Field, ImageListEditor, inputCls, PageHeader, SeedNotice, Switch, useToast, useTx } from "./ui";

type Draft = Omit<Product, "id" | "specs"> & { id?: string; specs: [string, string][] };

const ENGINE_PRESETS = ["150cc", "200cc", "300cc", "600cc", "1000cc", "Electric", "V8", "V8/SUV"];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function emptyDraft(): Draft {
  return {
    code: "",
    titleAr: "",
    titleEn: "",
    slug: "",
    descriptionAr: "",
    descriptionEn: "",
    price: 0,
    compareAtPrice: null,
    category: "MOTORS",
    availability: "IN_LIBYA",
    engineSpec: "",
    powerHp: null,
    year: new Date().getFullYear(),
    mileage: null,
    condition: "NEW",
    images: [],
    specs: [],
    isFastDeal: false,
    isNew: true,
    isActive: true,
    sortOrder: 0,
  };
}

const toDraft = (p: Product): Draft => ({ ...p, specs: Object.entries(p.specs) });

export function ProductsManager({ products, source, openNew }: { products: Product[]; source: "database" | "seed"; openNew: boolean }) {
  const tx = useTx();
  const { t, lang } = usePrefs();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(openNew ? emptyDraft() : null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"ALL" | CategoryKey>("ALL");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(
      (p) => (cat === "ALL" || p.category === cat) && (!s || `${p.titleAr} ${p.titleEn} ${p.code}`.toLowerCase().includes(s)),
    );
  }, [products, q, cat]);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast(true, r.message);
        after?.();
        router.refresh();
      } else toast(false, r.message);
    });

  const save = () => {
    if (!draft) return;
    const input: ProductInput = {
      ...draft,
      slug: draft.slug || slugify(draft.titleEn),
      specs: Object.fromEntries(draft.specs.filter(([k, v]) => k.trim() && v.trim()).map(([k, v]) => [k.trim(), v.trim()])),
    };
    run(() => saveProduct(input), () => setDraft(null));
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const num = (v: string) => (v === "" ? null : Number(v.replace(/\D/g, "")));

  return (
    <>
      <PageHeader
        title={tx("إدارة المركبات والمنتجات", "Vehicles & Products")}
        subtitle={`${products.length} ${tx("عنصر", "items")}`}
        actions={
          <Btn onClick={() => setDraft(emptyDraft())}>
            <Plus size={16} /> {tx("إضافة منتج", "Add product")}
          </Btn>
        }
      />
      <SeedNotice source={source} />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className={`${inputCls} ps-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("بحث بالاسم أو الكود", "Search name or code")} />
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {(["ALL", ...CATEGORY_KEYS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${cat === c ? "bg-fg text-bg" : "border border-line"}`}
            >
              {c === "ALL" ? t.filter.all : t.categories[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr className="text-start">
              <th className="p-3 text-start">{tx("المنتج", "Product")}</th>
              <th className="p-3 text-start">{tx("القسم", "Category")}</th>
              <th className="p-3 text-start">{tx("السعر", "Price")}</th>
              <th className="p-3 text-start">{tx("التوفر", "Availability")}</th>
              <th className="p-3 text-start">{tx("الخت فت", "Fast Deal")}</th>
              <th className="p-3 text-start">{tx("نشط", "Active")}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className={`${p.isActive ? "" : "opacity-50"} hover:bg-surface-2/60`}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{lang === "ar" ? p.titleAr : p.titleEn}</p>
                      <p className="font-mono text-[11px] text-muted" dir="ltr">
                        {p.code} · {p.engineSpec || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{t.categories[p.category]}</td>
                <td className="p-3 font-bold whitespace-nowrap">{formatPrice(p.price, lang)}</td>
                <td className="p-3">
                  <button
                    disabled={pending}
                    onClick={() => run(() => toggleProduct(p.id, "availability"))}
                    className={`rounded-full px-3 py-1 text-xs font-bold text-white ${p.availability === "IN_LIBYA" ? "bg-emerald-500" : "bg-sky-600"}`}
                    title={tx("اضغط للتبديل", "Click to toggle")}
                  >
                    {t.availabilityLong[p.availability]}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    disabled={pending}
                    onClick={() => run(() => toggleProduct(p.id, "isFastDeal"))}
                    className={`grid h-8 w-8 place-items-center rounded-full ${p.isFastDeal ? "bg-crimson text-white" : "border border-line text-muted"}`}
                    aria-label="fast deal"
                    aria-pressed={p.isFastDeal}
                  >
                    <Zap size={14} className={p.isFastDeal ? "fill-current" : ""} />
                  </button>
                </td>
                <td className="p-3">
                  <Switch checked={p.isActive} onChange={() => run(() => toggleProduct(p.id, "isActive"))} label="" color="bg-emerald-500" />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setDraft(toDraft(p))} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-gold" aria-label="edit">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDraft({ ...toDraft(p), id: undefined, code: `${p.code}-2`, slug: `${p.slug}-2` })}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-gold"
                      aria-label="duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => confirm(tx("حذف هذا المنتج نهائياً؟", "Delete this product permanently?")) && run(() => deleteProduct(p.id))}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-line text-crimson hover:border-crimson"
                      aria-label="delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-10 text-center text-sm text-muted">{tx("لا توجد نتائج", "No results")}</p>}
      </div>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? tx("تعديل المنتج", "Edit product") : tx("منتج جديد", "New product")}
        footer={
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={save} disabled={pending}>
              {pending ? tx("جاري الحفظ...", "Saving...") : tx("حفظ", "Save")}
            </Btn>
            <Btn variant="ghost" onClick={() => setDraft(null)}>
              {tx("إلغاء", "Cancel")}
            </Btn>
          </div>
        }
      >
        {draft && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-black">{tx("الصور (الأولى هي الغلاف)", "Images (first = cover)")}</h3>
              <ImageListEditor value={draft.images} onChange={(v) => set("images", v)} />
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <Field label={tx("الاسم بالعربية *", "Arabic title *")}>
                <input className={inputCls} value={draft.titleAr} onChange={(e) => set("titleAr", e.target.value)} dir="rtl" />
              </Field>
              <Field label={tx("الاسم بالإنجليزية *", "English title *")}>
                <input
                  className={inputCls}
                  value={draft.titleEn}
                  dir="ltr"
                  onChange={(e) => setDraft((d) => (d ? { ...d, titleEn: e.target.value, slug: d.id ? d.slug : slugify(e.target.value) } : d))}
                />
              </Field>
              <Field label={tx("الكود *", "Code *")} hint={tx("يظهر في رسائل واتساب", "Shown in WhatsApp messages")}>
                <input className={`${inputCls} font-mono`} dir="ltr" value={draft.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} placeholder="GP-M-600" />
              </Field>
              <Field label="Slug *">
                <input className={`${inputCls} font-mono`} dir="ltr" value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
              </Field>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <Field label={tx("القسم", "Category")}>
                <select className={inputCls} value={draft.category} onChange={(e) => set("category", e.target.value as CategoryKey)}>
                  {CATEGORY_KEYS.map((c) => (
                    <option key={c} value={c}>
                      {t.categories[c]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tx("التوفر", "Availability")}>
                <div className="grid h-11 grid-cols-2 gap-1 rounded-xl border border-line p-1">
                  {(["IN_LIBYA", "IMPORT"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => set("availability", a)}
                      className={`rounded-lg text-xs font-bold ${draft.availability === a ? (a === "IN_LIBYA" ? "bg-emerald-500 text-white" : "bg-sky-600 text-white") : "text-muted"}`}
                    >
                      {t.availabilityLong[a]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={tx("السعر (د.ل) *", "Price (LYD) *")}>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={draft.price || ""} onChange={(e) => set("price", num(e.target.value) ?? 0)} />
              </Field>
              <Field label={tx("السعر قبل الخصم", "Compare-at price")}>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={draft.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", num(e.target.value))} />
              </Field>
              <Field label={tx("المحرك / المواصفة", "Engine spec")}>
                <input className={inputCls} dir="ltr" list="engine-presets" value={draft.engineSpec} onChange={(e) => set("engineSpec", e.target.value)} placeholder="600cc" />
                <datalist id="engine-presets">
                  {ENGINE_PRESETS.map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
              </Field>
              <Field label={tx("القوة (حصان)", "Power (hp)")}>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={draft.powerHp ?? ""} onChange={(e) => set("powerHp", num(e.target.value))} />
              </Field>
              <Field label={tx("سنة الصنع", "Year")}>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={draft.year ?? ""} onChange={(e) => set("year", num(e.target.value))} />
              </Field>
              <Field label={tx("المسافة (كم)", "Mileage (km)")}>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={draft.mileage ?? ""} onChange={(e) => set("mileage", num(e.target.value))} />
              </Field>
              <Field label={tx("الحالة", "Condition")}>
                <select className={inputCls} value={draft.condition} onChange={(e) => set("condition", e.target.value as Draft["condition"])}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {t.conditions[c]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tx("ترتيب العرض", "Sort order")}>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={draft.sortOrder} onChange={(e) => set("sortOrder", num(e.target.value) ?? 0)} />
              </Field>
            </section>

            <section className="flex flex-wrap gap-5 rounded-2xl border border-line p-4">
              <Switch checked={draft.isFastDeal} onChange={(v) => set("isFastDeal", v)} label={`⚡ ${tx("الخت فت", "Fast Deal")}`} />
              <Switch checked={draft.isNew} onChange={(v) => set("isNew", v)} label={tx("جديد", "New")} color="bg-gold" />
              <Switch checked={draft.isActive} onChange={(v) => set("isActive", v)} label={tx("نشط (ظاهر)", "Active (visible)")} color="bg-emerald-500" />
            </section>

            <section className="grid gap-3">
              <Field label={tx("الوصف بالعربية", "Arabic description")}>
                <textarea className={`${inputCls} h-24 py-2`} dir="rtl" value={draft.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />
              </Field>
              <Field label={tx("الوصف بالإنجليزية", "English description")}>
                <textarea className={`${inputCls} h-24 py-2`} dir="ltr" value={draft.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
              </Field>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-black">{tx("مواصفات إضافية", "Additional specs")}</h3>
                <Btn type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => set("specs", [...draft.specs, ["", ""]])}>
                  <Plus size={14} /> {tx("إضافة", "Add")}
                </Btn>
              </div>
              <div className="space-y-2">
                {draft.specs.map(([k, v], i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={inputCls}
                      dir="ltr"
                      placeholder="topSpeed"
                      value={k}
                      onChange={(e) => set("specs", draft.specs.map((s, n) => (n === i ? [e.target.value, s[1]] : s)))}
                    />
                    <input
                      className={inputCls}
                      placeholder="260 km/h"
                      value={v}
                      onChange={(e) => set("specs", draft.specs.map((s, n) => (n === i ? [s[0], e.target.value] : s)))}
                    />
                    <button type="button" onClick={() => set("specs", draft.specs.filter((_, n) => n !== i))} className="grid w-11 shrink-0 place-items-center rounded-xl border border-line text-crimson" aria-label="remove">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </>
  );
}
