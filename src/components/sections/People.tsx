import { Quote } from "lucide-react";
import { reviews } from "@/content/site";
import { Reveal, SectionHead } from "../ui/Reveal";

export function Reviews() {
  return (
    <section className="bg-white py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow="Результаты" title={<>Было на пробнике → <span className="marker">стало на экзамене</span></>} />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <article className="flex h-full flex-col rounded-[28px] border-2 border-grid bg-paper p-7">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-muted line-through decoration-check decoration-2">{r.before}</p>
                    <p className="text-xs text-muted">пробник</p>
                  </div>
                  <svg viewBox="0 0 60 20" className="h-5 w-14 text-check" aria-hidden>
                    <path d="M2 14 C 18 2, 36 2, 52 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M46 4 L54 10 L45 15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-center">
                    <p className="font-mono text-4xl font-bold text-ink">{r.after}</p>
                    <p className="text-xs text-muted">{r.grade ? "оценка" : "экзамен"}</p>
                  </div>
                </div>
                <Quote className="mt-6 text-grid" size={28} />
                <p className="mt-2 flex-1 text-muted">{r.text}</p>
                <div className="mt-5 border-t border-grid pt-4">
                  <p className="font-display font-bold">{r.name}</p>
                  <p className="text-sm text-muted">{r.subject}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
