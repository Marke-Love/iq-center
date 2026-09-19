"use client";

import { ArrowUpRight, Clock } from "lucide-react";
import { useState } from "react";
import { subjects, type Exam } from "@/content/site";
import { goal } from "@/lib/metrika";
import { useLead } from "../ui/LeadProvider";
import { SectionHead } from "../ui/Reveal";

export function Subjects() {
  const [exam, setExam] = useState<Exam>("ЕГЭ");
  const open = useLead();

  return (
    <section id="subjects" className="bg-white py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead
            eyebrow="Предметы"
            title="Любой предмет ЕГЭ и ОГЭ"
            lead="Время и формат — как на экзамене этого года. Информатика — на компьютерах, иностранный — с устной частью."
          />
          <div role="tablist" aria-label="Экзамен" className="inline-grid shrink-0 grid-cols-2 gap-1 self-start rounded-2xl bg-paper p-1.5 lg:self-auto">
            {(["ЕГЭ", "ОГЭ"] as Exam[]).map((x) => (
              <button
                key={x}
                role="tab"
                aria-selected={exam === x}
                onClick={() => setExam(x)}
                className={`min-h-12 rounded-xl px-6 font-display font-bold transition ${exam === x ? "bg-ink text-white shadow" : "text-muted hover:text-text"}`}
              >
                {x} <span className="font-sans text-sm font-medium opacity-70">{x === "ЕГЭ" ? "11 кл." : "9 кл."}</span>
              </button>
            ))}
          </div>
        </div>

        <ul key={exam} className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects[exam].map((s, i) => (
            <li key={s.name} className="animate-[fadeUp_.45s_ease_both]" style={{ animationDelay: `${i * 30}ms` }}>
              <button
                onClick={() => {
                  goal("subject_click", { exam, subject: s.name });
                  open({ subject: s.name, exam, source: "subjects" });
                }}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-grid bg-paper px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-ink hover:bg-white hover:shadow-[var(--shadow-card)]"
              >
                <span>
                  <span className="block font-display font-bold">{s.name}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <Clock size={14} /> {s.duration}
                    {s.note && <span className="text-ink">· {s.note}</span>}
                  </span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-ink transition group-hover:bg-check group-hover:text-white">
                  <ArrowUpRight size={20} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
