"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShieldCheck, Ship, Wrench } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { SectionHeading } from "@/components/ui/Pills";
import { IMG } from "@/lib/images";

const ICONS = [Search, Wrench, Ship, ShieldCheck];
const VISUALS = [IMG.mercGarage, IMG.headlightEngine, IMG.offroadBuggy, IMG.motoWheelBrake];

export function ImportProcess() {
  const { t } = usePrefs();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const steps = t.process.steps;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 4500);
    return () => clearInterval(id);
  }, [auto, steps.length]);

  return (
    <section id="process" className="border-y border-line bg-bg-2 py-20 md:py-28" aria-labelledby="process-h">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading id="process-h" kicker={t.process.kicker} title={t.process.title} subtitle={t.process.subtitle} />

        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.1fr]">
          <ol className="relative space-y-3">
            <span className="absolute start-[27px] top-6 bottom-6 w-px bg-line" aria-hidden />
            {steps.map((s, i) => {
              const Icon = ICONS[i];
              const on = i === active;
              return (
                <li key={s.title}>
                  <button
                    onClick={() => {
                      setActive(i);
                      setAuto(false);
                    }}
                    aria-current={on ? "step" : undefined}
                    className={`relative flex w-full items-start gap-4 rounded-2xl border p-4 text-start transition ${
                      on ? "border-gold/60 bg-surface shadow-lux" : "border-transparent hover:bg-surface/60"
                    }`}
                  >
                    <span
                      className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition ${
                        on ? "bg-crimson text-white" : "border border-line bg-surface text-muted"
                      }`}
                    >
                      <Icon size={22} />
                    </span>
                    <span className="flex-1">
                      <span className="font-mono text-xs font-bold text-gold">{String(i + 1).padStart(2, "0")}.</span>
                      <span className="mt-0.5 block text-lg font-extrabold">{s.title}</span>
                      <AnimatePresence initial={false}>
                        {on && (
                          <motion.span
                            className="block overflow-hidden text-sm leading-relaxed text-muted"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <span className="block pt-2">{s.body}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {on && auto && (
                        <motion.span
                          key={`bar-${i}`}
                          className="mt-3 block h-0.5 origin-left rounded bg-gold rtl:origin-right"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 4.5, ease: "linear" }}
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-line bg-black">
            <AnimatePresence mode="sync">
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
              >
                <Image src={VISUALS[active]} alt={steps[active].title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <p className="font-display text-7xl text-white/15 md:text-9xl">{String(active + 1).padStart(2, "0")}</p>
              <p className="-mt-6 text-2xl font-black md:text-3xl">{steps[active].title}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
