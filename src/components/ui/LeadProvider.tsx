"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { goal } from "@/lib/metrika";
import { captureUtm } from "@/lib/utm";
import { LeadForm } from "./LeadForm";

type Preset = { subject?: string; exam?: string; source?: string };
const Ctx = createContext<(preset?: Preset) => void>(() => {});

export const useLead = () => useContext(Ctx);

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = useState<Preset | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const open = useCallback((p: Preset = {}) => {
    setPreset(p);
    goal("open_modal", { source: p.source });
  }, []);
  const close = () => setPreset(null);

  useEffect(() => captureUtm(), []);

  useEffect(() => {
    if (!preset) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [preset]);

  return (
    <Ctx.Provider value={open}>
      {children}
      <AnimatePresence>
        {preset && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-night/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="lead-title"
              className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-[28px] sm:p-8"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeRef}
                onClick={close}
                aria-label="Закрыть"
                className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-paper text-text transition hover:bg-ink-soft"
              >
                <X size={20} />
              </button>
              <p className="eyebrow text-check">Запись на пробник</p>
              <h2 id="lead-title" className="mt-2 pr-10 font-display text-2xl leading-tight font-bold">
                Оставьте телефон — подберём дату и&nbsp;предмет
              </h2>
              <p className="mt-2 text-muted">Перезвоним в течение 15 минут в рабочее время.</p>
              <div className="mt-6">
                <LeadForm defaultSubject={preset.subject} defaultExam={preset.exam} source={preset.source ?? "modal"} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
