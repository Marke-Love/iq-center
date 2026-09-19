"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { faq, site } from "@/content/site";
import { PhoneLink } from "../ui/CtaButton";
import { SectionHead } from "../ui/Reveal";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-16 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHead eyebrow="Вопросы" title="Частые вопросы родителей и учеников" />
          <p className="mt-6 text-muted">
            Не нашли ответ? Позвоните: <PhoneLink withIcon={false} className="font-bold text-ink" /> — {site.hours.toLowerCase()}.
          </p>
        </div>
        <div className="grid gap-3">
          {faq.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`rounded-[22px] bg-white transition ${isOpen ? "shadow-[var(--shadow-card)]" : ""}`}>
                <h3>
                  <button
                    id={`faq-b-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-p-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 px-6 py-4 text-left font-display text-[17px] font-bold"
                  >
                    {f.q}
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full transition ${isOpen ? "rotate-45 bg-check text-white" : "bg-paper text-ink"}`}>
                      <Plus size={18} />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-p-${i}`}
                  role="region"
                  aria-labelledby={`faq-b-${i}`}
                  className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 leading-relaxed text-muted">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
