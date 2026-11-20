"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Languages, Loader2, Lock, Mail, Moon, Sun } from "lucide-react";
import { loginAction } from "@/app/admin/actions";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { Logo } from "@/components/ui/Logo";
import { IMG } from "@/lib/images";
import { inputCls, useTx } from "./ui";

export function LoginForm() {
  const tx = useTx();
  const { theme, toggleTheme, toggleLang, lang } = usePrefs();
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden bg-black lg:block">
        <Image src={IMG.studioSupercar} alt="" fill priority sizes="50vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute start-10 bottom-10 text-white">
          <p className="font-display text-5xl">{tx("القـــوة والفـــن", "POWER & ARTISTRY")}</p>
          <p className="mt-2 text-gold">{tx("لوحة التحكم المركزية", "Enterprise Super-Admin")}</p>
        </div>
      </div>

      <div className="flex flex-col p-6">
        <div className="flex justify-end gap-2">
          <button onClick={toggleLang} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold" aria-label="language">
            <Languages size={15} /> {lang === "ar" ? "EN" : "ع"}
          </button>
          <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-full border border-line" aria-label="theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="m-auto w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size={110} priority />
            <h1 className="mt-4 text-2xl font-black">{tx("تسجيل دخول الإدارة", "Admin Sign In")}</h1>
            <p className="mt-1 text-sm text-muted">GRAND POWER | قراند باور</p>
          </div>

          <form action={formAction} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{tx("البريد الإلكتروني", "Email")}</span>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input key={state?.email} defaultValue={state?.email} name="email" type="email" required autoComplete="username" dir="ltr" className={`${inputCls} h-12 ps-10`} />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{tx("كلمة المرور", "Password")}</span>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input name="password" type="password" required autoComplete="current-password" dir="ltr" className={`${inputCls} h-12 ps-10`} />
              </div>
            </label>
            {state && !state.ok && (
              <p role="alert" className="rounded-xl bg-crimson/10 p-3 text-sm font-bold text-crimson">
                {state.message}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-crimson text-sm font-black text-white transition hover:bg-crimson-hi disabled:opacity-60"
            >
              {pending && <Loader2 size={18} className="animate-spin" />}
              {tx("دخول", "Sign in")}
            </button>
          </form>
          <Link href="/" className="mt-6 block text-center text-sm text-muted hover:text-gold">
            ← {tx("العودة للمتجر", "Back to store")}
          </Link>
        </div>
      </div>
    </div>
  );
}
