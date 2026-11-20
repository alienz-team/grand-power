"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Database, Inbox, MonitorPlay, Package, Plus, Settings, Ship, TriangleAlert, Zap } from "lucide-react";
import { seedDatabaseAction } from "@/app/admin/actions";
import { STATUS_LABELS } from "@/lib/i18n/dictionaries";
import type { AdminOverview } from "@/lib/repo";
import { CATEGORY_KEYS } from "@/lib/types";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { Btn, Card, PageHeader, SeedNotice, useToast, useTx } from "./ui";

export function Dashboard({ overview: o, env }: { overview: AdminOverview; env: { db: boolean; storage: boolean; authSecret: boolean } }) {
  const tx = useTx();
  const { t, lang } = usePrefs();
  const toast = useToast();
  const router = useRouter();
  const [seeding, startSeed] = useTransition();

  const kpis = [
    { label: tx("إجمالي المركبات والمنتجات", "Total vehicles & products"), value: o.total, icon: Package, tone: "text-fg" },
    { label: tx("متوفر في ليبيا 🇱🇾", "In Libya 🇱🇾"), value: o.inLibya, icon: CheckCircle2, tone: "text-emerald-500" },
    { label: tx("استيراد 🚢", "Import 🚢"), value: o.imports, icon: Ship, tone: "text-sky-500" },
    { label: tx("الخت فت", "Fast Deals"), value: o.fastDeals, icon: Zap, tone: "text-crimson" },
    { label: tx("طلبات قيد الانتظار", "Pending requests"), value: o.pendingRequests, icon: Inbox, tone: "text-gold" },
    { label: tx("شرائح الهيرو", "Hero slides"), value: o.slides, icon: MonitorPlay, tone: "text-fg" },
  ];

  const seed = () =>
    startSeed(async () => {
      const r = await seedDatabaseAction();
      toast(r.ok, r.message);
      if (r.ok) router.refresh();
    });

  const maxCat = Math.max(1, ...CATEGORY_KEYS.map((k) => o.byCategory[k] || 0));

  return (
    <>
      <PageHeader
        title={tx("لوحة الإحصائيات", "Dashboard")}
        subtitle={tx("نظرة عامة على المعرض والطلبات", "Showroom & request overview")}
        actions={
          <>
            <Link href="/admin/products?new=1">
              <Btn>
                <Plus size={16} /> {tx("منتج جديد", "New product")}
              </Btn>
            </Link>
            <Link href="/admin/orders">
              <Btn variant="ghost">
                <Inbox size={16} /> {tx("الطلبات", "Requests")}
              </Btn>
            </Link>
          </>
        }
      />
      <SeedNotice source={o.source} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <k.icon size={20} className={k.tone} />
              <p className={`mt-3 text-3xl font-black ${k.tone}`}>{k.value}</p>
              <p className="mt-1 text-xs text-muted">{k.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-black">{tx("أحدث طلبات الاستيراد", "Latest import requests")}</h2>
          {o.recentRequests.length ? (
            <ul className="divide-y divide-line">
              {o.recentRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{r.brandModel}</p>
                    <p className="text-xs text-muted">
                      {r.customerName} · <span dir="ltr">{r.customerPhone}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs font-bold">{STATUS_LABELS[r.status][lang]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">{tx("لا توجد طلبات بعد", "No requests yet")}</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-black">{tx("التوزيع حسب القسم", "By department")}</h2>
          <ul className="space-y-3">
            {CATEGORY_KEYS.map((k) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-bold">{t.categories[k]}</span>
                  <span className="text-muted">{o.byCategory[k] || 0}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-crimson to-gold" style={{ width: `${((o.byCategory[k] || 0) / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-black">{tx("إجراءات سريعة", "Quick actions")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/admin/products", icon: Package, label: tx("إدارة المنتجات", "Manage products") },
              { href: "/admin/content", icon: MonitorPlay, label: tx("تعديل الهيرو", "Edit hero slides") },
              { href: "/admin/categories", icon: Zap, label: tx("صور الأقسام", "Category galleries") },
              { href: "/admin/settings", icon: Settings, label: tx("أرقام التواصل", "Contact numbers") },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex items-center gap-2 rounded-2xl border border-line p-3 text-sm font-bold hover:border-gold hover:text-gold">
                <a.icon size={18} /> {a.label}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-black">{tx("حالة النظام", "System status")}</h2>
          <ul className="space-y-2 text-sm">
            {[
              { ok: env.db, label: tx("قاعدة البيانات (DATABASE_URL)", "Database (DATABASE_URL)") },
              { ok: env.storage, label: tx("تخزين الصور Supabase", "Supabase Storage (product-images)") },
              { ok: env.authSecret, label: tx("مفتاح الجلسات ADMIN_SESSION_SECRET", "ADMIN_SESSION_SECRET session key") },
            ].map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                {s.ok ? <CheckCircle2 size={16} className="text-emerald-500" /> : <TriangleAlert size={16} className="text-gold" />}
                <span className={s.ok ? "" : "text-muted"}>{s.label}</span>
              </li>
            ))}
          </ul>
          <Btn variant="dark" className="mt-4 w-full" onClick={seed} disabled={!env.db || seeding}>
            <Database size={16} />
            {seeding ? tx("جاري التعبئة...", "Seeding...") : tx("تعبئة قاعدة البيانات بالبيانات الأولية", "Seed database with catalogue")}
          </Btn>
          <p className="mt-2 text-[11px] text-muted">
            {tx("آمن للتكرار — لا يستبدل البيانات الموجودة.", "Idempotent — never overwrites existing rows.")}
          </p>
        </Card>
      </div>
    </>
  );
}
