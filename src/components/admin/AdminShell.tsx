"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  ExternalLink,
  FolderKanban,
  Inbox,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorPlay,
  Moon,
  Settings,
  Sun,
  Warehouse,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { Logo } from "@/components/ui/Logo";
import { ToastProvider, useTx } from "./ui";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, ar: "لوحة الإحصائيات", en: "Dashboard" },
  { href: "/admin/products", icon: Warehouse, ar: "المركبات والمنتجات", en: "Vehicles & Products" },
  { href: "/admin/categories", icon: FolderKanban, ar: "الأقسام والمعارض", en: "Categories & Galleries" },
  { href: "/admin/content", icon: MonitorPlay, ar: "محتوى الواجهة والهيرو", en: "Storefront & Hero CMS" },
  { href: "/admin/orders", icon: Inbox, ar: "طلبات الاستيراد والحجوزات", en: "Import Requests & Orders" },
  { href: "/admin/bookings", icon: CalendarCheck, ar: "حجوزات الخدمات", en: "Service Bookings" },
  { href: "/admin/settings", icon: Settings, ar: "إعدادات الموقع والتواصل", en: "Site & Contact Settings" },
];

export function AdminShell({
  email,
  pending,
  pendingBookings = 0,
  children,
}: {
  email: string;
  pending: number;
  pendingBookings?: number;
  children: ReactNode;
}) {
  const tx = useTx();
  const { theme, toggleTheme, toggleLang, lang, dir } = usePrefs();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="admin">
      {NAV.map((n, i) => {
        const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
              active ? "bg-crimson text-white shadow-lg shadow-crimson/20" : "text-fg/75 hover:bg-surface-2 hover:text-fg"
            }`}
          >
            <span className={`font-mono text-[10px] ${active ? "text-white/70" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</span>
            <n.icon size={18} />
            <span className="flex-1">{tx(n.ar, n.en)}</span>
            {(() => {
              const badge = n.href === "/admin/orders" ? pending : n.href === "/admin/bookings" ? pendingBookings : 0;
              return badge > 0 ? (
                <span className={`rounded-full px-2 text-[11px] ${active ? "bg-white text-crimson" : "bg-crimson text-white"}`}>{badge}</span>
              ) : null;
            })()}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 border-b border-line p-4">
      <Logo size={44} />
      <div className="leading-tight">
        <p className="font-[family-name:var(--font-michroma)] text-xs tracking-widest">GRAND POWER</p>
        <p className="text-[11px] font-bold text-gold">{tx("لوحة التحكم", "Super-Admin CMS")}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-2 border-t border-line p-3">
      <p className="truncate px-2 text-xs text-muted" dir="ltr" title={email}>
        {email}
      </p>
      <form action={logoutAction}>
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-crimson hover:bg-crimson/10">
          <LogOut size={16} className="rtl:-scale-x-100" />
          {tx("تسجيل الخروج", "Sign out")}
        </button>
      </form>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="glass sticky top-0 hidden h-dvh flex-col border-y-0 border-s-0 lg:flex">
          {brand}
          {nav}
          {footer}
        </aside>

        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-50 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
              <motion.aside
                className="absolute inset-y-0 start-0 flex w-[290px] flex-col bg-bg"
                initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {brand}
                {nav}
                {footer}
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-w-0">
          <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-x-0 border-t-0 px-4 md:px-8">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden" aria-label="menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <p className="hidden text-sm text-muted md:block">gpower.store / admin</p>
            <div className="flex items-center gap-2">
              <Link href="/" target="_blank" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold hover:border-gold">
                <ExternalLink size={14} /> {tx("عرض المتجر", "View store")}
              </Link>
              <button onClick={toggleLang} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold hover:border-gold" aria-label="language">
                <Languages size={15} /> {lang === "ar" ? "EN" : "ع"}
              </button>
              <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-full border border-line hover:border-gold" aria-label="theme">
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </header>
          <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
