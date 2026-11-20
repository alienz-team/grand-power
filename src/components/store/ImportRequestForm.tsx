"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Bike, Calculator, Car, CheckCircle2, Cog, Loader2, Send, TriangleAlert } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { submitImportRequest } from "@/app/actions/import-request";
import { waLink } from "@/lib/config/contact";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { formatPrice, USD_TO_LYD } from "@/lib/format";
import { IMG } from "@/lib/images";
import type { ImportVehicleType } from "@/lib/types";
import { useStore } from "./store-context";

const TYPE_ICONS: Record<ImportVehicleType, typeof Car> = { CAR: Car, MOTOR: Bike, BICYCLE: Bike, ACCESSORY: Cog };
const TYPES: ImportVehicleType[] = ["CAR", "MOTOR", "BICYCLE", "ACCESSORY"];

type Status = { kind: "idle" } | { kind: "ok"; saved: boolean } | { kind: "error"; msg: string };

export function ImportRequestForm() {
  const { t, lang } = usePrefs();
  const { settings } = useStore();
  const f = t.importForm;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [form, setForm] = useState({
    vehicleType: "CAR" as ImportVehicleType,
    customerName: "",
    customerPhone: "",
    customerCity: "",
    brandModel: "",
    targetSpec: "",
    budget: "",
    currency: "LYD" as "LYD" | "USD",
    notes: "",
    website: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((s) => ({ ...s, [k]: v }));

  const estimateLyd = useMemo(() => {
    const n = Number(form.budget);
    if (!n || n < 0) return 0;
    return form.currency === "USD" ? Math.round(n * USD_TO_LYD) : n;
  }, [form.budget, form.currency]);

  const whatsappMessage = () => {
    const ar = dictionaries.ar.importForm;
    return [
      "أهلاً قراند باور (GRAND POWER)، أرغب في طلب استيراد خاص:",
      `• النوع: ${ar.types[form.vehicleType]}`,
      `• الماركة والموديل: ${form.brandModel || "-"}`,
      form.targetSpec && `• المواصفات: ${form.targetSpec}`,
      form.budget && `• الميزانية: ${form.budget} ${form.currency === "LYD" ? "د.ل" : "USD"}`,
      `• الاسم: ${form.customerName || "-"}`,
      form.customerCity && `• المدينة: ${form.customerCity}`,
      `• الهاتف: ${form.customerPhone || "-"}`,
      form.notes && `• ملاحظات: ${form.notes}`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const openWhatsapp = () => window.open(waLink(settings.whatsappNumber, whatsappMessage()), "_blank", "noopener,noreferrer");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.brandModel.trim()) {
      setStatus({ kind: "error", msg: f.required });
      return;
    }
    startTransition(async () => {
      const res = await submitImportRequest({
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      if (res.ok) {
        setStatus({ kind: "ok", saved: res.saved });
      } else {
        setStatus({ kind: "error", msg: res.error === "validation" ? f.required : f.error });
      }
    });
  };

  const input =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-gold";

  return (
    <section id="import" className="relative overflow-hidden py-20 md:py-28" aria-labelledby="import-h">
      <div className="absolute inset-0 -z-10 opacity-[0.07]">
        <Image src={IMG.sedanSilhouette} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-crimson uppercase">{f.kicker}</p>
          <h2 id="import-h" className="font-display text-3xl leading-tight md:text-5xl">
            {f.title}
          </h2>
          <div className="metal-line mt-5 w-32" />
          <p className="mt-5 text-muted md:text-lg">{f.subtitle}</p>

          <div className="glass mt-8 rounded-3xl p-6">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Calculator size={18} className="text-gold" />
              {f.estimate}
            </p>
            <p className="mt-2 text-4xl font-black text-gold-gradient">{estimateLyd ? formatPrice(estimateLyd, lang) : "—"}</p>
            <p className="mt-2 text-xs text-muted">{f.estimateNote}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-surface/80 p-5 shadow-lux backdrop-blur md:p-8" noValidate>
          <fieldset>
            <legend className="mb-3 text-sm font-bold">{f.type}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPES.map((ty) => {
                const Icon = TYPE_ICONS[ty];
                const on = form.vehicleType === ty;
                return (
                  <button
                    key={ty}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("vehicleType", ty)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-bold transition ${
                      on ? "border-crimson bg-crimson/10 text-crimson" : "border-line hover:border-gold"
                    }`}
                  >
                    <Icon size={22} />
                    {f.types[ty]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.name} *</span>
              <input className={input} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} autoComplete="name" required maxLength={80} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.phone} *</span>
              <input className={input} value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" placeholder="+218 9X XXX XXXX" required maxLength={20} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.city}</span>
              <input className={input} value={form.customerCity} onChange={(e) => set("customerCity", e.target.value)} maxLength={60} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.brandModel} *</span>
              <input className={input} value={form.brandModel} onChange={(e) => set("brandModel", e.target.value)} placeholder={f.brandModelPh} required maxLength={120} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.spec}</span>
              <input className={input} value={form.targetSpec} onChange={(e) => set("targetSpec", e.target.value)} placeholder={f.specPh} maxLength={200} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.budget}</span>
              <input className={input} value={form.budget} onChange={(e) => set("budget", e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" placeholder="50000" />
            </label>
            <div>
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.currency}</span>
              <div className="grid h-12 grid-cols-2 gap-1 rounded-xl border border-line p-1">
                {(["LYD", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={form.currency === c}
                    onClick={() => set("currency", c)}
                    className={`rounded-lg text-sm font-bold transition ${form.currency === c ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
                  >
                    {c === "LYD" ? (lang === "ar" ? "دينار ليبي" : "LYD") : "USD"}
                  </button>
                ))}
              </div>
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.notes}</span>
              <textarea className={`${input} h-28 resize-none py-3`} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />
            </label>
            {/* Honeypot */}
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>

          {status.kind === "ok" && (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-500" role="status">
              <CheckCircle2 size={18} className="shrink-0" />
              <span className="flex-1">{status.saved ? f.success : f.successWa}</span>
              {!status.saved && (
                <a
                  href={waLink(settings.whatsappNumber, whatsappMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-whatsapp px-3 py-1.5 text-xs text-white"
                >
                  <WhatsAppIcon size={14} />
                  {t.card.whatsapp}
                </a>
              )}
            </p>
          )}
          {status.kind === "error" && (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-crimson/10 p-3 text-sm font-bold text-crimson" role="alert">
              <TriangleAlert size={18} />
              {status.msg}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-crimson py-3.5 text-sm font-black text-white transition hover:bg-crimson-hi disabled:opacity-60"
            >
              {pending ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} className="rtl:-scale-x-100" />}
              {pending ? f.sending : f.submit}
            </button>
            <button
              type="button"
              onClick={openWhatsapp}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 text-sm font-black text-white transition hover:brightness-110"
            >
              <WhatsAppIcon size={18} />
              {f.sendWhatsapp}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
