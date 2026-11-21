"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarClock, Car, MapPin, Phone, StickyNote, Trash2, UserCheck } from "lucide-react";
import { deleteBooking, updateBooking } from "@/app/admin/actions";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { telLink, waLink } from "@/lib/config/contact";
import { STATUS_LABELS } from "@/lib/i18n/dictionaries";
import { optionLabel, SERVICE_TYPES, SERVICES, TIME_SLOT_LABELS, type ServiceType, type TimeSlot } from "@/lib/services";
import { REQUEST_STATUSES, type RequestStatus, type ServiceBooking } from "@/lib/types";
import { Card, inputCls, PageHeader, SeedNotice, useToast, useTx } from "./ui";

const STATUS_TONE: Record<RequestStatus, string> = {
  PENDING: "bg-gold/15 text-gold border-gold/40",
  REVIEWING: "bg-sky-500/15 text-sky-500 border-sky-500/40",
  QUOTED: "bg-violet-500/15 text-violet-500 border-violet-500/40",
  APPROVED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
  COMPLETED: "bg-fg/10 text-fg border-line",
  CANCELLED: "bg-crimson/10 text-crimson border-crimson/40",
};

/** Pre-filled Arabic WhatsApp reply for a booking, tailored to its status. */
function replyMessage(b: ServiceBooking): string {
  const s = SERVICES[b.serviceType];
  const when = [b.preferredDate, b.preferredTime && TIME_SLOT_LABELS[b.preferredTime as TimeSlot]?.ar].filter(Boolean).join(" ");
  const base = `مرحباً ${b.customerName}، معك فريق قراند باور (GRAND POWER) بخصوص حجز: ${s.ar} — ${optionLabel(b.serviceType, b.serviceOption, "ar")}${when ? ` (${when})` : ""}`;
  const tail: Record<RequestStatus, string> = {
    PENDING: "استلمنا حجزك، هل يناسبك تأكيد الموعد الآن؟",
    REVIEWING: "نراجع تفاصيل حجزك وسنؤكد الموعد قريباً.",
    QUOTED: "جهّزنا لك عرض السعر — هل نرسل التفاصيل؟",
    APPROVED: "تم تأكيد موعدك ✅ فريقنا سيكون في الموعد المحدد.",
    COMPLETED: "تمت الخدمة بنجاح، شكراً لثقتك في قراند باور 🙏",
    CANCELLED: "تم إلغاء الحجز. يسعدنا خدمتك في أي وقت.",
  };
  return `${base}\n${tail[b.status]}`;
}

function BookingRow({ b }: { b: ServiceBooking }) {
  const tx = useTx();
  const { lang } = usePrefs();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(b.adminNotes);
  const [showNotes, setShowNotes] = useState(false);
  const s = SERVICES[b.serviceType];

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(false, res.message);
      else router.refresh();
    });

  return (
    <Card className={pending ? "opacity-60" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {new Date(b.createdAt).toLocaleString(lang === "ar" ? "ar-LY" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
            {b.hasAccount && (
              <span className="ms-2 inline-flex items-center gap-1 text-emerald-500">
                <UserCheck size={12} /> {tx("عميل مسجّل", "Registered customer")}
              </span>
            )}
          </p>
          <h3 className="mt-1 text-lg font-black">{s[lang]}</h3>
          <p className="text-sm text-muted">{optionLabel(b.serviceType, b.serviceOption, lang)}</p>
        </div>
        <select
          value={b.status}
          disabled={pending}
          onChange={(e) => run(() => updateBooking(b.id, e.target.value))}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold outline-none ${STATUS_TONE[b.status]}`}
          aria-label="status"
        >
          {REQUEST_STATUSES.map((st) => (
            <option key={st} value={st} className="bg-surface text-fg">
              {STATUS_LABELS[st][lang]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-bold">{b.customerName}</span>
        <span dir="ltr" className="text-muted">
          {b.customerPhone}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5 text-sm text-muted">
        <p className="flex items-center gap-2">
          <CalendarClock size={14} className="shrink-0 text-gold" />
          {b.preferredDate || tx("بدون تاريخ محدد", "No date set")}
          {b.preferredTime && ` · ${TIME_SLOT_LABELS[b.preferredTime as TimeSlot]?.[lang] ?? b.preferredTime}`}
        </p>
        {b.vehicle && (
          <p className="flex items-center gap-2">
            <Car size={14} className="shrink-0 text-gold" />
            {b.vehicle}
          </p>
        )}
        {(b.customerCity || b.address) && (
          <p className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0 text-gold" />
            {[b.customerCity, b.address].filter(Boolean).join(" — ")}
          </p>
        )}
      </div>
      {b.notes && <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">{b.notes}</p>}

      {showNotes && (
        <div className="mt-3 flex gap-2">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tx("ملاحظة تظهر للعميل في حسابه", "Note shown to the customer in their account")} />
          <button onClick={() => run(() => updateBooking(b.id, b.status, notes))} className="shrink-0 rounded-xl bg-fg px-4 text-sm font-bold text-bg">
            {tx("حفظ", "Save")}
          </button>
        </div>
      )}
      {!showNotes && b.adminNotes && <p className="mt-2 text-xs text-muted">📝 {b.adminNotes}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={waLink(b.customerPhone, replyMessage(b))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2 text-sm font-bold text-white hover:brightness-110"
        >
          <WhatsAppIcon size={16} /> {tx("رد عبر واتساب", "Reply on WhatsApp")}
        </a>
        <a href={telLink(b.customerPhone)} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold hover:border-gold">
          <Phone size={15} /> {tx("اتصال", "Call")}
        </a>
        <button onClick={() => setShowNotes((x) => !x)} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold hover:border-gold">
          <StickyNote size={15} /> {tx("ملاحظات", "Notes")}
        </button>
        <button
          onClick={() => confirm(tx("حذف الحجز نهائياً؟", "Delete booking permanently?")) && run(() => deleteBooking(b.id))}
          className="ms-auto inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-crimson hover:border-crimson"
          aria-label="delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
}

export function BookingsManager({ bookings, source }: { bookings: ServiceBooking[]; source: "database" | "seed" }) {
  const tx = useTx();
  const { lang } = usePrefs();
  const [service, setService] = useState<"ALL" | ServiceType>("ALL");
  const [status, setStatus] = useState<"ALL" | RequestStatus>("ALL");

  const byService = useMemo(() => (service === "ALL" ? bookings : bookings.filter((b) => b.serviceType === service)), [bookings, service]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of byService) c[b.status] = (c[b.status] || 0) + 1;
    return c;
  }, [byService]);
  const rows = status === "ALL" ? byService : byService.filter((b) => b.status === status);

  return (
    <>
      <PageHeader
        title={tx("حجوزات الخدمات", "Service Bookings")}
        subtitle={tx("ورش متنقلة وصيانة · غسيل متنقل · تعديل السيارات", "Mobile workshop · Mobile car wash · Car editing")}
      />
      <SeedNotice source={source} />

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {(["ALL", ...SERVICE_TYPES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setService(s)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${service === s ? "bg-crimson text-white" : "border border-line"}`}
          >
            {s === "ALL" ? tx("كل الخدمات", "All services") : SERVICES[s][lang]} (
            {s === "ALL" ? bookings.length : bookings.filter((b) => b.serviceType === s).length})
          </button>
        ))}
      </div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {(["ALL", ...REQUEST_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${status === s ? "bg-fg text-bg" : "border border-line"}`}
          >
            {s === "ALL" ? tx("الكل", "All") : STATUS_LABELS[s][lang]} ({s === "ALL" ? byService.length : counts[s] || 0})
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((b) => (
            <BookingRow key={b.id} b={b} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-16 text-center text-muted">
          <CalendarCheck size={36} />
          <p>{tx("لا توجد حجوزات في هذا التصنيف", "No bookings in this view")}</p>
        </Card>
      )}
    </>
  );
}
