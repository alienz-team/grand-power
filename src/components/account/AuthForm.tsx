"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn, TriangleAlert, UserPlus } from "lucide-react";
import { loginCustomer, registerCustomer, type AccountFormState } from "@/app/account/actions";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { featureDictionaries } from "@/lib/i18n/features";
import { IMG } from "@/lib/images";

/** Customer sign-in ("تسجيل الدخول") and registration ("إنشاء حساب") — progressive-enhancement server-action forms. */
export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const { lang } = usePrefs();
  const f = featureDictionaries[lang].account;
  const [state, action, pending] = useActionState<AccountFormState | null, FormData>(
    mode === "login" ? loginCustomer : registerCustomer,
    null,
  );
  const [show, setShow] = useState(false);
  const v = state?.values ?? {};
  const isLogin = mode === "login";
  const otherHref = `${isLogin ? "/account/register" : "/account/login"}${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`;

  const input =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-gold";

  return (
    <div className="grid overflow-hidden rounded-3xl border border-line bg-surface shadow-lux lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden min-h-[560px] lg:block">
        <Image src={isLogin ? IMG.landCruiser200 : IMG.patrolY62} alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-x-8 bottom-8 text-white">
          <p className="font-display text-3xl leading-tight">GRAND POWER</p>
          <p className="mt-2 max-w-sm text-white/80">{isLogin ? f.loginSubtitle : f.registerSubtitle}</p>
        </div>
      </div>

      <form action={action} className="p-6 md:p-10" noValidate>
        <h1 className="font-display text-3xl md:text-4xl">{isLogin ? f.loginTitle : f.registerTitle}</h1>
        <p className="mt-2 text-sm text-muted lg:hidden">{isLogin ? f.loginSubtitle : f.registerSubtitle}</p>
        <div className="metal-line mt-5 mb-8 w-24" />

        <input type="hidden" name="next" value={next} />
        {!isLogin && <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden defaultValue="" />}

        {/* key → remount with the echoed values after React 19 resets the form on a failed submit */}
        <div key={JSON.stringify(v)} className="grid gap-4 sm:grid-cols-2">
          {!isLogin && (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.name} *</span>
              <input name="name" className={input} defaultValue={v.name} autoComplete="name" required minLength={2} maxLength={80} />
            </label>
          )}
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-bold text-muted">{f.email} *</span>
            <input name="email" type="email" dir="ltr" className={input} defaultValue={v.email} autoComplete="email" required maxLength={120} />
          </label>
          {!isLogin && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-muted">{f.phone} *</span>
                <input name="phone" inputMode="tel" dir="ltr" placeholder="+218 9X XXX XXXX" className={input} defaultValue={v.phone} autoComplete="tel" required maxLength={20} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-muted">{f.city}</span>
                <input name="city" className={input} defaultValue={v.city} autoComplete="address-level2" maxLength={60} />
              </label>
            </>
          )}
          <label className={`block ${isLogin ? "sm:col-span-2" : ""}`}>
            <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted">
              <span>{f.password} *</span>
              {!isLogin && <span className="font-normal">{f.passwordHint}</span>}
            </span>
            <span className="relative block">
              <input
                name="password"
                type={show ? "text" : "password"}
                dir="ltr"
                className={`${input} pe-12`}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={isLogin ? 1 : 8}
                maxLength={128}
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 end-0 grid w-12 place-items-center text-muted hover:text-fg" aria-label={show ? "hide" : "show"}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {!isLogin && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">{f.confirm} *</span>
              <input name="confirm" type={show ? "text" : "password"} dir="ltr" className={input} autoComplete="new-password" required minLength={8} maxLength={128} />
            </label>
          )}
        </div>

        {state?.error && (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-crimson/10 p-3 text-sm font-bold text-crimson" role="alert">
            <TriangleAlert size={18} className="shrink-0" />
            {f.errors[state.error]}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-crimson py-3.5 text-sm font-black text-white transition hover:bg-crimson-hi disabled:opacity-60"
        >
          {pending ? <Loader2 size={18} className="animate-spin" /> : isLogin ? <LogIn size={17} className="rtl:-scale-x-100" /> : <UserPlus size={17} />}
          {pending ? f.working : isLogin ? f.signIn : f.create}
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? f.noAccount : f.haveAccount}{" "}
          <Link href={otherHref} className="font-bold text-gold hover:underline">
            {isLogin ? f.registerTitle : f.loginTitle}
          </Link>
        </p>
      </form>
    </div>
  );
}
