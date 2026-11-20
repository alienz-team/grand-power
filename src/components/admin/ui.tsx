"use client";

import { createContext, useCallback, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, CheckCircle2, ImagePlus, Link2, Loader2, Trash2, TriangleAlert, X } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { uploadImagesAction } from "@/app/admin/actions";
import { isAllowedImageUrl } from "@/lib/images";

/** Inline bilingual helper for admin copy. */
export function useTx() {
  const { lang } = usePrefs();
  return useCallback((ar: string, en: string) => (lang === "ar" ? ar : en), [lang]);
}

// ── Toasts ──────────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  ok: boolean;
  text: string;
}
const ToastCtx = createContext<(ok: boolean, text?: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((ok: boolean, text?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, ok, text: text || (ok ? "✓" : "Error") }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ok ? 3000 : 6000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`flex items-start gap-2 rounded-2xl p-3 text-sm font-semibold text-white shadow-lux ${t.ok ? "bg-emerald-600" : "bg-crimson"}`}
            >
              {t.ok ? <CheckCircle2 size={18} className="shrink-0" /> : <TriangleAlert size={18} className="shrink-0" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ── Primitives ──────────────────────────────────────────────────────────────
export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-gold";

export function Field({ label, children, className = "", hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, color = "bg-crimson" }: { checked: boolean; onChange: (v: boolean) => void; label: string; color?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm font-semibold"
    >
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? color : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "start-[22px]" : "start-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "dark" }) {
  const v = {
    primary: "bg-crimson text-white hover:bg-crimson-hi",
    ghost: "border border-line hover:border-gold hover:text-gold",
    danger: "border border-crimson/40 text-crimson hover:bg-crimson hover:text-white",
    dark: "bg-fg text-bg hover:opacity-90",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SeedNotice({ source }: { source: "database" | "seed" }) {
  const tx = useTx();
  if (source === "database") return null;
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
      <TriangleAlert size={18} className="mt-0.5 shrink-0 text-gold" />
      <p>
        {tx(
          "وضع العرض: لا توجد قاعدة بيانات متصلة — البيانات المعروضة هي بيانات أولية للقراءة فقط. أضف DATABASE_URL في ملف ‎.env ثم اضغط «تعبئة قاعدة البيانات» من لوحة الإحصائيات لتفعيل التعديل.",
          "Preview mode: no database connected — showing read-only seed data. Add DATABASE_URL to .env, then click “Seed database” on the dashboard to enable editing.",
        )}
      </p>
    </div>
  );
}

// ── Slide-over drawer ───────────────────────────────────────────────────────
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const { dir } = usePrefs();
  const from = dir === "rtl" ? "-100%" : "100%";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-y-0 end-0 flex w-full max-w-2xl flex-col border-s border-line bg-bg shadow-2xl"
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-line p-4">
              <h2 className="text-lg font-black">{title}</h2>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-crimson hover:text-crimson" aria-label="close">
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <footer className="border-t border-line p-4">{footer}</footer>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Image list editor (URL input + Supabase Storage upload + reorder) ───────
export function ImageListEditor({ value, onChange, max = 12, folder = "products" }: { value: string[]; onChange: (v: string[]) => void; max?: number; folder?: string }) {
  const tx = useTx();
  const toast = useToast();
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!isAllowedImageUrl(u))
      return toast(false, tx("المصادر المسموحة: Unsplash أو Supabase أو cdn-files-a", "Allowed hosts: images.unsplash.com, *.supabase.co, images.cdn-files-a.com"));
    if (value.length >= max) return toast(false, `Max ${max}`);
    onChange([...value, u]);
    setUrlDraft("");
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files)
      .slice(0, Math.max(0, max - value.length))
      .forEach((f) => fd.append("files", f));
    fd.append("folder", folder);
    startUpload(async () => {
      const res = await uploadImagesAction(fd);
      if (res.ok && res.urls) {
        onChange([...value, ...res.urls]);
        toast(true, tx("تم رفع الصور", "Images uploaded"));
      } else toast(false, res.message);
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface-2">
            <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            {i === 0 && <span className="absolute start-1 top-1 rounded bg-gold px-1.5 text-[10px] font-black text-black">{tx("الرئيسية", "Cover")}</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="grid h-6 w-6 place-items-center rounded bg-black/70 text-white" aria-label="up">
                  <ArrowUp size={12} />
                </button>
                <button type="button" onClick={() => move(i, 1)} className="grid h-6 w-6 place-items-center rounded bg-black/70 text-white" aria-label="down">
                  <ArrowDown size={12} />
                </button>
              </div>
              <button type="button" onClick={() => onChange(value.filter((_, n) => n !== i))} className="grid h-6 w-6 place-items-center rounded bg-crimson text-white" aria-label="remove">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-xs font-bold text-muted hover:border-gold hover:text-gold"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            {tx("رفع صور", "Upload")}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className={`${inputCls} ps-9`}
            dir="ltr"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://images.unsplash.com/photo-...?auto=format&fit=crop&w=1800&q=85"
          />
        </div>
        <Btn type="button" variant="ghost" onClick={addUrl}>
          {tx("إضافة", "Add")}
        </Btn>
      </div>
      <p className="text-[11px] text-muted">
        {tx(
          "⚠️ قاعدة التصوير: مركبات وآلات فقط — بدون أشخاص أو وجوه أو سائقين.",
          "⚠️ Photography rule: machines only — no people, faces or riders.",
        )}
      </p>
    </div>
  );
}
