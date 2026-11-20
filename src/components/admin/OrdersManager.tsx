"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Phone, StickyNote, Trash2 } from "lucide-react";
import { deleteRequest, updateRequest } from "@/app/admin/actions";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { telLink, waLink } from "@/lib/config/contact";
import { dictionaries, STATUS_LABELS } from "@/lib/i18n/dictionaries";
import { formatNumber } from "@/lib/format";
import { REQUEST_STATUSES, type ImportRequest, type RequestStatus } from "@/lib/types";
import { Card, inputCls, PageHeader, SeedNotice, useToast, useTx } from "./ui";

const STATUS_TONE: Record<RequestStatus, string> = {
  PENDING: "bg-gold/15 text-gold border-gold/40",
  REVIEWING: "bg-sky-500/15 text-sky-500 border-sky-500/40",
  QUOTED: "bg-violet-500/15 text-violet-500 border-violet-500/40",
  APPROVED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
  COMPLETED: "bg-fg/10 text-fg border-line",
  CANCELLED: "bg-crimson/10 text-crimson border-crimson/40",
};

/** Pre-filled Arabic WhatsApp reply tailored to the request status. */
function replyMessage(r: ImportRequest): string {
  const type = dictionaries.ar.importForm.types[r.vehicleType];
  const base = `مرحباً ${r.customerName}، معك فريق قراند باور (GRAND POWER) بخصوص طلبك: ${type} - ${r.brandModel}`;
  const tail: Record<RequestStatus, string> = {
    PENDING: "استلمنا طلبك وسنراجعه ونعود إليك قريباً.",
    REVIEWING: "طلبك قيد المراجعة الفنية حالياً، وسنرسل لك التفاصيل خلال 24 ساعة.",
    QUOTED: "جهّزنا لك عرض السعر النهائي — هل يناسبك أن نرسل التفاصيل الآن؟",
    APPROVED: "تمت الموافقة على طلبك ✅ وسنبدأ إجراءات الشحن/التسليم.",
    COMPLETED: "تم إتمام طلبك بنجاح، شكراً لثقتك في قراند باور 🙏",
    CANCELLED: "نأسف، تم إلغاء الطلب. يسعدنا مساعدتك في أي طلب آخر.",
  };
  return `${base}\n${tail[r.status]}`;
}

function RequestRow({ r }: { r: ImportRequest }) {
  const tx = useTx();
  const { lang } = usePrefs();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(r.adminNotes);
  const [showNotes, setShowNotes] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(false, res.message);
      else router.refresh();
    });

  const budget = r.budgetLyd ? `${formatNumber(r.budgetLyd, lang)} ${lang === "ar" ? "د.ل" : "LYD"}` : r.budgetUsd ? `$${formatNumber(r.budgetUsd, "en")}` : "—";

  return (
    <Card className={pending ? "opacity-60" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {new Date(r.createdAt).toLocaleString(lang === "ar" ? "ar-LY" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
            {r.productCode && (
              <span className="ms-2 font-mono" dir="ltr">
                #{r.productCode}
              </span>
            )}
          </p>
          <h3 className="mt-1 text-lg font-black">{r.brandModel}</h3>
          <p className="text-sm text-muted">
            {dictionaries[lang].importForm.types[r.vehicleType]}
            {r.targetSpec && ` · ${r.targetSpec}`} · {tx("الميزانية", "Budget")}: <b className="text-fg">{budget}</b>
          </p>
        </div>
        <select
          value={r.status}
          disabled={pending}
          onChange={(e) => run(() => updateRequest(r.id, e.target.value))}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold outline-none ${STATUS_TONE[r.status]}`}
          aria-label="status"
        >
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-surface text-fg">
              {STATUS_LABELS[s][lang]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-bold">{r.customerName}</span>
        <span dir="ltr" className="text-muted">
          {r.customerPhone}
        </span>
        {r.customerCity && <span className="text-muted">{r.customerCity}</span>}
      </div>
      {r.notes && <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">{r.notes}</p>}

      {showNotes && (
        <div className="mt-3 flex gap-2">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tx("ملاحظات داخلية للفريق", "Internal team notes")} />
          <button onClick={() => run(() => updateRequest(r.id, r.status, notes))} className="shrink-0 rounded-xl bg-fg px-4 text-sm font-bold text-bg">
            {tx("حفظ", "Save")}
          </button>
        </div>
      )}
      {!showNotes && r.adminNotes && <p className="mt-2 text-xs text-muted">📝 {r.adminNotes}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={waLink(r.customerPhone, replyMessage(r))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2 text-sm font-bold text-white hover:brightness-110"
        >
          <WhatsAppIcon size={16} /> {tx("رد عبر واتساب", "Reply on WhatsApp")}
        </a>
        <a href={telLink(r.customerPhone)} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold hover:border-gold">
          <Phone size={15} /> {tx("اتصال", "Call")}
        </a>
        <button onClick={() => setShowNotes((s) => !s)} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold hover:border-gold">
          <StickyNote size={15} /> {tx("ملاحظات", "Notes")}
        </button>
        <button
          onClick={() => confirm(tx("حذف الطلب نهائياً؟", "Delete request permanently?")) && run(() => deleteRequest(r.id))}
          className="ms-auto inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-crimson hover:border-crimson"
          aria-label="delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
}

export function OrdersManager({ requests, source }: { requests: ImportRequest[]; source: "database" | "seed" }) {
  const tx = useTx();
  const { lang } = usePrefs();
  const [filter, setFilter] = useState<"ALL" | RequestStatus>("ALL");
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [requests]);
  const rows = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  return (
    <>
      <PageHeader
        title={tx("طلبات الاستيراد والحجوزات", "Import Requests & Orders")}
        subtitle={tx("قيد الانتظار ← تم التسعير ← تمت الموافقة ← مكتمل", "Pending → Quoted → Approved → Completed")}
      />
      <SeedNotice source={source} />

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {(["ALL", ...REQUEST_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${filter === s ? "bg-fg text-bg" : "border border-line"}`}
          >
            {s === "ALL" ? tx("الكل", "All") : STATUS_LABELS[s][lang]} ({s === "ALL" ? requests.length : counts[s] || 0})
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((r) => (
            <RequestRow key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-16 text-center text-muted">
          <Inbox size={36} />
          <p>{tx("لا توجد طلبات في هذا التصنيف", "No requests in this view")}</p>
        </Card>
      )}
    </>
  );
}
