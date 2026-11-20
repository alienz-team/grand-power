"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveSettings } from "@/app/admin/actions";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import { waLink } from "@/lib/config/contact";
import type { SiteSettings } from "@/lib/types";
import { Btn, Card, Field, inputCls, PageHeader, SeedNotice, useToast, useTx } from "./ui";

export function SettingsForm({ settings, source }: { settings: SiteSettings; source: "database" | "seed" }) {
  const tx = useTx();
  const toast = useToast();
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [pending, start] = useTransition();
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveSettings(s);
      toast(r.ok, r.message);
      if (r.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={submit}>
      <PageHeader
        title={tx("إعدادات الموقع والتواصل", "Site & Contact Settings")}
        subtitle={tx("أي تعديل هنا يحدّث المتجر بالكامل فوراً", "Changes here update the whole storefront instantly")}
        actions={
          <Btn type="submit" disabled={pending}>
            <Save size={16} /> {pending ? tx("جاري الحفظ...", "Saving...") : tx("حفظ الإعدادات", "Save settings")}
          </Btn>
        }
      />
      <SeedNotice source={source} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-black">
            <WhatsAppIcon size={18} className="text-whatsapp" /> {tx("التواصل المباشر", "Direct contact")}
          </h2>
          <div className="grid gap-3">
            <Field label={tx("رقم واتساب الرسمي (دولي بدون +)", "Official WhatsApp (international, digits)")} hint={`wa.me/${s.whatsappNumber.replace(/\D/g, "")}`}>
              <input className={inputCls} dir="ltr" value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} placeholder="218915229703" />
            </Field>
            <Field label={tx("رقم الهاتف", "Phone number")}>
              <input className={inputCls} dir="ltr" value={s.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="+218915229703" />
            </Field>
            <Field label={tx("البريد الإلكتروني", "Email")}>
              <input className={inputCls} dir="ltr" type="email" value={s.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label={tx("العنوان بالعربية", "Address (Arabic)")}>
              <input className={inputCls} dir="rtl" value={s.addressAr} onChange={(e) => set("addressAr", e.target.value)} />
            </Field>
            <Field label={tx("العنوان بالإنجليزية", "Address (English)")}>
              <input className={inputCls} dir="ltr" value={s.addressEn} onChange={(e) => set("addressEn", e.target.value)} />
            </Field>
            <a href={waLink(s.whatsappNumber, "Test ✅")} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-whatsapp hover:underline">
              {tx("اختبار رابط واتساب ↗", "Test WhatsApp link ↗")}
            </a>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-black">{tx("الهوية والتواصل الاجتماعي", "Brand & social")}</h2>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={tx("اسم العلامة بالعربية", "Brand name (Arabic)")}>
                <input className={inputCls} dir="rtl" value={s.brandNameAr} onChange={(e) => set("brandNameAr", e.target.value)} />
              </Field>
              <Field label={tx("اسم العلامة بالإنجليزية", "Brand name (English)")}>
                <input className={inputCls} dir="ltr" value={s.brandNameEn} onChange={(e) => set("brandNameEn", e.target.value)} />
              </Field>
            </div>
            <Field label={tx("مجموعة فيسبوك", "Facebook group URL")}>
              <div className="relative">
                <FacebookIcon size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#1877F2]" />
                <input className={`${inputCls} ps-9`} dir="ltr" value={s.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} />
              </div>
            </Field>
            <Field label={tx("إنستغرام", "Instagram URL")}>
              <div className="relative">
                <InstagramIcon size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#E1306C]" />
                <input className={`${inputCls} ps-9`} dir="ltr" value={s.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
              </div>
            </Field>
          </div>
        </Card>
      </div>
    </form>
  );
}
