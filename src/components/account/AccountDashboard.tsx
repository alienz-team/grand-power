"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Car, CheckCircle2, Heart, KeyRound, Loader2, LogOut, MapPin, Ship, Trash2, TriangleAlert, UserRound, Wrench, XCircle } from "lucide-react";
import { cancelMyBooking, changePassword, logoutCustomer, toggleSavedVehicle, updateProfile, type AccountError } from "@/app/account/actions";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { waLink } from "@/lib/config/contact";
import { formatPrice, productWhatsappLink } from "@/lib/format";
import { dictionaries, STATUS_LABELS } from "@/lib/i18n/dictionaries";
import { featureDictionaries } from "@/lib/i18n/features";
import { optionLabel, SERVICES, TIME_SLOT_LABELS, type TimeSlot } from "@/lib/services";
import type { CustomerProfile, ImportRequest, Product, RequestStatus, ServiceBooking } from "@/lib/types";

type SavedItem = Product | { code: string; missing: true };
type Tab = "bookings" | "imports" | "saved" | "profile";

const STATUS_TONE: Record<RequestStatus, string> = {
  PENDING: "bg-gold/15 text-gold",
  REVIEWING: "bg-sky-500/15 text-sky-500",
  QUOTED: "bg-violet-500/15 text-violet-500",
  APPROVED: "bg-emerald-500/15 text-emerald-500",
  COMPLETED: "bg-fg/10 text-fg",
  CANCELLED: "bg-crimson/10 text-crimson",
};

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-gold";

function StatusPill({ s }: { s: RequestStatus }) {
  const { lang } = usePrefs();
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[s]}`}>{STATUS_LABELS[s][lang]}</span>;
}

function useDate() {
  const { lang } = usePrefs();
  return (iso: string, withTime = false) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar-LY" : "en-GB", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

export function AccountDashboard({
  customer,
  bookings,
  imports,
  saved,
  whatsappNumber,
}: {
  customer: CustomerProfile;
  bookings: ServiceBooking[];
  imports: ImportRequest[];
  saved: SavedItem[];
  whatsappNumber: string;
}) {
  const { lang } = usePrefs();
  const f = featureDictionaries[lang].account;
  const [tab, setTab] = useState<Tab>("bookings");
  const tabs: { key: Tab; icon: typeof Wrench; count?: number }[] = [
    { key: "bookings", icon: Wrench, count: bookings.length },
    { key: "imports", icon: Ship, count: imports.length },
    { key: "saved", icon: Heart, count: saved.length },
    { key: "profile", icon: UserRound },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gold">
            {f.hello}
            {lang === "ar" ? "، " : ", "}
            {customer.name}
          </p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">{featureDictionaries[lang].nav.account}</h1>
          <p className="mt-2 text-muted">{f.dashboardSubtitle}</p>
        </div>
        <form action={logoutCustomer}>
          <button className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-bold transition hover:border-crimson hover:text-crimson">
            <LogOut size={16} className="rtl:-scale-x-100" />
            {f.logout}
          </button>
        </form>
      </div>

      <div role="tablist" className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
              tab === t.key ? "border-crimson bg-crimson text-white" : "border-line hover:border-gold"
            }`}
          >
            <t.icon size={16} />
            {f.tabs[t.key]}
            {t.count !== undefined && <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? "bg-white/20" : "bg-surface-2"}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "bookings" && <Bookings bookings={bookings} whatsappNumber={whatsappNumber} />}
      {tab === "imports" && <Imports imports={imports} />}
      {tab === "saved" && <Saved saved={saved} whatsappNumber={whatsappNumber} />}
      {tab === "profile" && <Profile customer={customer} />}
    </>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-line p-10 text-center">
      <p className="text-muted">{text}</p>
      <Link href={href} className="mt-5 inline-flex rounded-full bg-crimson px-5 py-2.5 text-sm font-black text-white hover:bg-crimson-hi">
        {cta}
      </Link>
    </div>
  );
}

function Bookings({ bookings, whatsappNumber }: { bookings: ServiceBooking[]; whatsappNumber: string }) {
  const { lang } = usePrefs();
  const f = featureDictionaries[lang].account;
  const fmt = useDate();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<AccountError | null>(null);

  if (!bookings.length) return <Empty text={f.noBookings} href="/#services" cta={f.bookNow} />;

  return (
    <div className="grid gap-4">
      {err && <ErrorNote error={err} />}
      {bookings.map((b) => {
        const s = SERVICES[b.serviceType];
        const msg = `مرحباً قراند باور، أستفسر عن حجزي: ${s.ar} — ${optionLabel(b.serviceType, b.serviceOption, "ar")} (${b.id.slice(-6)})`;
        return (
          <article key={b.id} className={`rounded-3xl border border-line bg-surface p-5 shadow-lux ${pending && busy === b.id ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl sm:block">
                  <Image src={s.images[0]} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black">{s[lang]}</h3>
                  <p className="text-sm text-muted">{optionLabel(b.serviceType, b.serviceOption, lang)}</p>
                </div>
              </div>
              <StatusPill s={b.status} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarClock size={15} className="shrink-0 text-gold" />
                <dt className="sr-only">{f.when}</dt>
                <dd>
                  {b.preferredDate ? fmt(`${b.preferredDate}T12:00:00Z`) : "—"}
                  {b.preferredTime && ` · ${TIME_SLOT_LABELS[b.preferredTime as TimeSlot]?.[lang] ?? b.preferredTime}`}
                </dd>
              </div>
              {b.vehicle && (
                <div className="flex items-center gap-2">
                  <Car size={15} className="shrink-0 text-gold" />
                  <dd>{b.vehicle}</dd>
                </div>
              )}
              {(b.customerCity || b.address) && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin size={15} className="shrink-0 text-gold" />
                  <dd>{[b.customerCity, b.address].filter(Boolean).join(" — ")}</dd>
                </div>
              )}
            </dl>
            {b.adminNotes && (
              <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
                <b>{f.teamNote}:</b> {b.adminNotes}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">
                {f.createdAt}: {fmt(b.createdAt, true)}
              </span>
              <a
                href={waLink(whatsappNumber, msg)}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-2 text-xs font-bold text-white"
              >
                <WhatsAppIcon size={14} /> {dictionaries[lang].card.whatsapp}
              </a>
              {b.status === "PENDING" && (
                <button
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(f.cancelConfirm)) return;
                    setBusy(b.id);
                    start(async () => {
                      const res = await cancelMyBooking(b.id);
                      setErr(res.ok ? null : (res.error ?? "server"));
                      router.refresh();
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-bold text-crimson hover:border-crimson"
                >
                  <XCircle size={14} /> {f.cancel}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Imports({ imports }: { imports: ImportRequest[] }) {
  const { lang } = usePrefs();
  const f = featureDictionaries[lang].account;
  const fmt = useDate();
  if (!imports.length) return <Empty text={f.noImports} href="/#import" cta={f.requestImport} />;
  return (
    <div className="grid gap-4">
      {imports.map((r) => (
        <article key={r.id} className="rounded-3xl border border-line bg-surface p-5 shadow-lux">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">{r.brandModel}</h3>
              <p className="text-sm text-muted">
                {dictionaries[lang].importForm.types[r.vehicleType]}
                {r.targetSpec && ` · ${r.targetSpec}`}
              </p>
            </div>
            <StatusPill s={r.status} />
          </div>
          {r.adminNotes && (
            <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
              <b>{f.teamNote}:</b> {r.adminNotes}
            </p>
          )}
          <p className="mt-3 text-xs text-muted">
            {f.createdAt}: {fmt(r.createdAt, true)}
          </p>
        </article>
      ))}
    </div>
  );
}

function Saved({ saved, whatsappNumber }: { saved: SavedItem[]; whatsappNumber: string }) {
  const { lang } = usePrefs();
  const f = featureDictionaries[lang].account;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  if (!saved.length) return <Empty text={f.noSaved} href="/#showroom" cta={f.browse} />;

  const remove = (code: string) => {
    setBusy(code);
    start(async () => {
      await toggleSavedVehicle(code);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((item) =>
        "missing" in item ? (
          <article key={item.code} className="flex items-center justify-between gap-3 rounded-3xl border border-dashed border-line p-5">
            <div>
              <p className="font-mono text-sm" dir="ltr">
                {item.code}
              </p>
              <p className="text-sm text-muted">{f.unavailable}</p>
            </div>
            <button onClick={() => remove(item.code)} disabled={pending} className="rounded-full border border-line p-2 text-crimson hover:border-crimson" aria-label={f.remove}>
              <Trash2 size={15} />
            </button>
          </article>
        ) : (
          <article key={item.code} className={`overflow-hidden rounded-3xl border border-line bg-surface shadow-lux ${pending && busy === item.code ? "opacity-60" : ""}`}>
            <div className="relative aspect-[4/3] bg-surface-2">
              <Image src={item.images[0]} alt={lang === "ar" ? item.titleAr : item.titleEn} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
            </div>
            <div className="p-4">
              <p className="text-xs text-muted">
                {dictionaries[lang].categories[item.category]} · {dictionaries[lang].conditions[item.condition]}
              </p>
              <h3 className="line-clamp-1 text-lg font-extrabold">{lang === "ar" ? item.titleAr : item.titleEn}</h3>
              <p className="mt-1 text-xl font-black text-gold-gradient">{formatPrice(item.price, lang)}</p>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <a
                  href={productWhatsappLink(item, whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-whatsapp py-2.5 text-xs font-bold text-white"
                >
                  <WhatsAppIcon size={15} /> {dictionaries[lang].card.whatsapp}
                </a>
                <button onClick={() => remove(item.code)} disabled={pending} className="grid w-10 place-items-center rounded-full border border-line text-crimson hover:border-crimson" aria-label={f.remove}>
                  {pending && busy === item.code ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          </article>
        ),
      )}
    </div>
  );
}

function ErrorNote({ error }: { error: AccountError }) {
  const { lang } = usePrefs();
  return (
    <p className="flex items-center gap-2 rounded-xl bg-crimson/10 p-3 text-sm font-bold text-crimson" role="alert">
      <TriangleAlert size={18} className="shrink-0" />
      {featureDictionaries[lang].account.errors[error]}
    </p>
  );
}

function Profile({ customer }: { customer: CustomerProfile }) {
  const { lang } = usePrefs();
  const f = featureDictionaries[lang].account;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone, city: customer.city });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const ok = (text: string) => setMsg({ ok: true, text });
  const bad = (e?: AccountError) => setMsg({ ok: false, text: f.errors[e ?? "server"] });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="rounded-3xl border border-line bg-surface p-6 shadow-lux"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updateProfile(form);
            if (res.ok) {
              ok(f.saved);
              router.refresh();
            } else bad(res.error);
          });
        }}
      >
        <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
          <UserRound size={18} className="text-gold" /> {f.tabs.profile}
        </h2>
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-muted">{f.email}</span>
            <input className={`${inputCls} opacity-70`} value={customer.email} dir="ltr" readOnly />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-muted">{f.name}</span>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} autoComplete="name" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-muted">{f.phone}</span>
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" inputMode="tel" maxLength={20} autoComplete="tel" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-muted">{f.city}</span>
            <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={60} />
          </label>
        </div>
        <button disabled={pending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-crimson py-3 text-sm font-black text-white hover:bg-crimson-hi disabled:opacity-60">
          {pending && <Loader2 size={16} className="animate-spin" />}
          {f.save}
        </button>
      </form>

      <form
        className="rounded-3xl border border-line bg-surface p-6 shadow-lux"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await changePassword(pw);
            if (res.ok) {
              ok(f.passwordChanged);
              setPw({ current: "", next: "" });
            } else bad(res.error);
          });
        }}
      >
        <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
          <KeyRound size={18} className="text-gold" /> {f.changePassword}
        </h2>
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-muted">{f.currentPassword}</span>
            <input type="password" className={inputCls} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} dir="ltr" autoComplete="current-password" maxLength={128} />
          </label>
          <label className="block">
            <span className="mb-1.5 flex justify-between text-xs font-bold text-muted">
              <span>{f.newPassword}</span>
              <span className="font-normal">{f.passwordHint}</span>
            </span>
            <input type="password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} dir="ltr" autoComplete="new-password" minLength={8} maxLength={128} />
          </label>
        </div>
        <button disabled={pending || !pw.current || pw.next.length < 8} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-black hover:border-gold disabled:opacity-50">
          {f.changePassword}
        </button>
      </form>

      {msg && (
        <p
          className={`flex items-center gap-2 rounded-xl p-3 text-sm font-bold lg:col-span-2 ${msg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-crimson/10 text-crimson"}`}
          role={msg.ok ? "status" : "alert"}
        >
          {msg.ok ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
          {msg.text}
        </p>
      )}
    </div>
  );
}
