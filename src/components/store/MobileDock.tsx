"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, LayoutGrid, Phone, Zap } from "lucide-react";
import { usePrefs } from "@/components/providers/PreferencesProvider";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { telLink, waLink } from "@/lib/config/contact";
import { useStore } from "./store-context";

export function MobileDock() {
  const { t } = usePrefs();
  const { settings } = useStore();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const item = "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold";

  return (
    <>
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t.dock.top}
            className="glass fixed end-4 bottom-24 z-40 grid h-12 w-12 place-items-center rounded-full shadow-lux md:bottom-6"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <nav
        aria-label="quick actions"
        className="glass fixed inset-x-3 bottom-3 z-40 flex items-stretch rounded-2xl px-1 shadow-lux md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <a href={telLink(settings.phoneNumber)} className={item}>
          <Phone size={20} />
          {t.dock.call}
        </a>
        <a
          href={waLink(settings.whatsappNumber, t.whatsapp.general)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${item} -my-3 mx-1 rounded-2xl bg-whatsapp text-white shadow-lg`}
        >
          <WhatsAppIcon size={24} />
          {t.dock.whatsapp}
        </a>
        <a href="#deals" className={`${item} text-crimson`}>
          <Zap size={20} className="fill-current" />
          {t.dock.deals}
        </a>
        <a href="#store" className={item}>
          <LayoutGrid size={20} />
          {t.dock.store}
        </a>
      </nav>
    </>
  );
}
