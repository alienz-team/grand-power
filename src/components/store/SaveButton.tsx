"use client";

import { Heart } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { featureDictionaries } from "@/lib/i18n/features";
import { useStore } from "./store-context";

/** ♡ toggle for a catalog vehicle. Signed-out visitors are sent to sign-in (and back). */
export function SaveButton({ code, variant = "overlay" }: { code: string; variant?: "overlay" | "inline" }) {
  const { lang } = usePrefs();
  const { saved, toggleSave, customer } = useStore();
  const f = featureDictionaries[lang].save;
  const on = saved.has(code);
  const label = !customer ? f.login : on ? f.remove : f.add;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={() => toggleSave(code)}
        aria-pressed={on}
        className={`inline-flex items-center justify-center gap-2 rounded-full border py-3 text-sm font-bold transition ${
          on ? "border-crimson bg-crimson/10 text-crimson" : "border-line hover:border-gold"
        }`}
      >
        <Heart size={16} className={on ? "fill-current" : ""} />
        {on ? f.remove : f.add}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleSave(code);
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition ${
        on ? "bg-crimson text-white" : "bg-black/45 text-white hover:bg-black/70"
      }`}
    >
      <Heart size={16} className={on ? "fill-current" : ""} />
    </button>
  );
}
