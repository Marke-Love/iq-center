import { Quote } from "lucide-react";
import { experts, reviews } from "@/content/site";
import { Reveal, SectionHead } from "../ui/Reveal";

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);
const avatarBg = ["bg-ink text-marker", "bg-marker text-night", "bg-check text-white", "bg-night text-marker"];

export function Experts() {
  return (
    <section className="py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Кто проверяет"
          title="Эксперты, которые знают критерии изнутри"
          lead="Работы проверяют преподаватели с опытом в предметных комиссиях — так же строго, как на экзамене."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {experts.map((e, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <article className="h-full rounded-[22px] bg-white p-4 shadow-[var(--shadow-card)] sm:rounded-[28px] sm:p-6">
                <div className={`grid aspect-square place-items-center rounded-2xl font-display text-3xl font-bold sm:aspect-[4/3] sm:text-4xl ${avatarBg[i % 4]}`}>
                  {initials(e.name)}
                </div>
                <h3 className="mt-4 font-display text-base font-bold sm:text-lg">{e.name}</h3>
                <p className="mt-0.5 text-sm font-medium text-ink sm:text-base">{e.role}</p>
                <p className="mt-2 text-sm text-muted sm:mt-3 sm:text-[15px]">{e.fact}</p>
                <p className="mt-3 inline-block rounded-full bg-paper px-3 py-1 font-mono text-xs sm:mt-4 sm:text-sm">стаж {e.years} лет</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

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
