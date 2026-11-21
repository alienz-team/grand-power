"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Droplets, Loader2, Sparkles, TriangleAlert, UserRound, Wrench } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { submitServiceBooking } from "@/app/actions/service-booking";
import { waLink } from "@/lib/config/contact";
import { featureDictionaries } from "@/lib/i18n/features";
import { optionLabel, SERVICE_TYPES, SERVICES, TIME_SLOT_LABELS, TIME_SLOTS, type ServiceType, type TimeSlot } from "@/lib/services";
import { useStore } from "./store-context";

const ICONS: Record<ServiceType, typeof Wrench> = { MOBILE_WORKSHOP: Wrench, CAR_WASH: Droplets, CAR_EDITING: Sparkles };

type Status = { kind: "idle" } | { kind: "ok"; saved: boolean; signedIn: boolean } | { kind: "error"; msg: string };

/** Local YYYY-MM-DD (the date input's min must use the visitor's calendar day). */
function isoDay(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ServiceBookingForm() {
  const { lang, t } = usePrefs();
  const { settings, customer, booking, bookService } = useStore();
  const f = featureDictionaries[lang].booking;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [form, setForm] = useState({
    customerName: customer?.name ?? "",
    customerPhone: customer?.phone ?? "",
    customerCity: customer?.city ?? "",
    address: "",
    vehicle: "",
    preferredDate: "",
    preferredTime: "" as "" | TimeSlot,
    notes: "",
    website: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((s) => ({ ...s, [k]: v }));
  const service = SERVICES[booking.type];
  const minDate = useMemo(() => isoDay(0), []);
  const maxDate = useMemo(() => isoDay(120), []);

  // A new service chosen from the cards above starts a fresh request.
  useEffect(() => setStatus({ kind: "idle" }), [booking.type, booking.option]);

  const whatsappMessage = () =>
    [
      "أهلاً قراند باور (GRAND POWER)، أرغب في حجز خدمة:",
      `• الخدمة: ${service.ar}`,
      `• النوع: ${optionLabel(booking.type, booking.option, "ar")}`,
      form.vehicle && `• السيارة: ${form.vehicle}`,
      form.preferredDate && `• التاريخ: ${form.preferredDate}`,
      form.preferredTime && `• الوقت: ${TIME_SLOT_LABELS[form.preferredTime].ar}`,
      `• الاسم: ${form.customerName || "-"}`,
      `• الهاتف: ${form.customerPhone || "-"}`,
      form.customerCity && `• المدينة: ${form.customerCity}`,
      form.address && `• العنوان: ${form.address}`,
      form.notes && `• ملاحظات: ${form.notes}`,
    ]
      .filter(Boolean)
      .join("\n");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !booking.option) {
      setStatus({ kind: "error", msg: f.required });
      return;
    }
    startTransition(async () => {
      const res = await submitServiceBooking({ ...form, serviceType: booking.type, serviceOption: booking.option });
      if (res.ok) setStatus({ kind: "ok", saved: res.saved, signedIn: !!res.signedIn });
      else
        setStatus({
          kind: "error",
          msg: res.error === "validation" ? f.required : res.error === "date" ? f.dateError : res.error === "rate" ? f.rate : f.error,
        });
    });
  };

  const input =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-gold";

  return (
    <section id="booking" className="py-20 md:py-28" aria-labelledby="booking-h">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-crimson uppercase">{f.kicker}</p>
          <h2 id="booking-h" className="font-display text-3xl leading-tight md:text-5xl">
            {f.title}
          </h2>
          <div className="metal-line mt-5 w-32" />
          <p className="mt-5 text-muted md:text-lg">{f.subtitle}</p>
          {!customer && (
            <Link
              href="/account/login?next=%2F%23booking"
              className="glass mt-8 flex items-center gap-3 rounded-2xl p-4 text-sm font-bold transition hover:border-gold"
            >
              <UserRound size={20} className="shrink-0 text-gold" />
              {f.signInHint}
            </Link>
          )}
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-surface/80 p-5 shadow-lux backdrop-blur md:p-8" noValidate>
          <fieldset>
            <legend className="mb-3 text-sm font-bold">{f.service}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SERVICE_TYPES.map((ty) => {
                const Icon = ICONS[ty];
                const on = booking.type === ty;
                return (
                  <button
                    key={ty}
                    type="button"
                    aria-pressed={on}
                    onClick={() => bookService(ty)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-start text-sm font-bold transition ${
                      on ? "border-crimson bg-crimson/10 text-crimson" : "border-line hover:border-gold"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    {SERVICES[ty][lang]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-bold">{f.option} *</legend>
            <div className="flex flex-wrap gap-2">
              {service.options.map((o) => {
                const on = booking.option === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => bookService(booking.type, o.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${on ? "border-gold bg-gold/15 text-gold" : "border-line hover:border-gold"}`}
                  >
                    {o[lang]}
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
              <input className={input} value={form.customerCity} onChange={(e) => set("customerCity", e.target.value)} autoComplete="address-level2" maxLength={60} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.vehicle}</span>
              <input className={input} value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder={f.vehiclePh} maxLength={120} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.address}</span>
              <input className={input} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder={f.addressPh} autoComplete="street-address" maxLength={200} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.date}</span>
              <input type="date" className={input} value={form.preferredDate} min={minDate} max={maxDate} onChange={(e) => set("preferredDate", e.target.value)} dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.time}</span>
              <select className={input} value={form.preferredTime} onChange={(e) => set("preferredTime", e.target.value as "" | TimeSlot)}>
                <option value="">{f.anyTime}</option>
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {TIME_SLOT_LABELS[s][lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.notes}</span>
              <textarea className={`${input} h-24 resize-none py-3`} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />
            </label>
            {/* Honeypot */}
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>

          {status.kind === "ok" && (
            <p className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-500" role="status">
              <CheckCircle2 size={18} className="shrink-0" />
              <span className="flex-1">{!status.saved ? f.successWa : status.signedIn ? f.successAccount : f.success}</span>
              {status.saved && status.signedIn && (
                <Link href="/account" className="shrink-0 rounded-full bg-emerald-500 px-3 py-1.5 text-xs text-white">
                  {f.viewAccount}
                </Link>
              )}
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
              <TriangleAlert size={18} className="shrink-0" />
              {status.msg}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-crimson py-3.5 text-sm font-black text-white transition hover:bg-crimson-hi disabled:opacity-60"
            >
              {pending ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck size={17} />}
              {pending ? f.sending : f.submit}
            </button>
            <button
              type="button"
              onClick={() => window.open(waLink(settings.whatsappNumber, whatsappMessage()), "_blank", "noopener,noreferrer")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 text-sm font-black text-white transition hover:brightness-110"
            >
              <WhatsAppIcon size={18} />
              {f.whatsapp}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
