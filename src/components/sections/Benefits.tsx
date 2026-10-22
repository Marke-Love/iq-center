import { BarChart3, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";
import { Reveal, SectionHead } from "../ui/Reveal";

const items = [
  { icon: BarChart3, title: "Баллы по шкале ФИПИ", text: "Первичные и тестовые баллы, такие же, как в официальных результатах." },
  { icon: ClipboardCheck, title: "Разбор каждой ошибки", text: "Что не так, почему сняли баллы и как оформить правильно." },
  {
    icon: ShieldCheck,
    title: "Уверенность",
    text: "Процедура уже знакома, поэтому на экзамене все силы уйдут на решение задач, а не на стресс.",
  },
];

const report = ["Реальный уровень знаний", "Предполагаемый результат на экзамене", "Слабые места, которые можно отработать"];

export function Benefits() {
  return (
    <section id="result" className="border-y border-grid/70 bg-white/55 py-16 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-14 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHead
            eyebrow="Что получите"
            title={
              <>
                Не просто оценку, а <span className="marker">карту ошибок</span>
              </>
            }
            lead="После проведения экзамена у ученика и родителей есть ясная картина: на каком уровне подготовленности он находится и что делать дальше."
          />
          <ul className="mt-10 grid gap-6">
            {items.map((it, i) => (
              <Reveal key={it.title} delay={i * 0.06}>
                <li className="flex gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink-soft text-ink">
                    <it.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{it.title}</h3>
                    <p className="mt-1 text-muted">{it.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Отчёт: что родитель и ученик получат на руки */}
        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-[32px] bg-night p-7 text-white sm:p-10">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-marker text-night">
                  <FileText size={20} />
                </span>
                <p className="eyebrow text-marker">Отчёт по пробнику</p>
              </div>

              <p className="mt-8 flex items-baseline gap-3">
                <span className="font-mono text-6xl leading-none font-bold text-marker sm:text-7xl">5–7</span>
                <span className="font-display text-xl font-bold sm:text-2xl">дней</span>
              </p>
              <p className="mt-4 font-display text-2xl leading-snug font-bold text-balance sm:text-[1.7rem]">
                и у вас на руках полный развёрнутый отчёт с результатом работы и всеми ошибками
              </p>

              <p className="mt-5 text-white/70">
                На его основе вы увидите реальную картину уровня знаний, поймёте слабые места и сможете отработать их
                заранее, чтобы на экзамене не было неприятных сюрпризов.
              </p>

              <ul className="mt-7 grid gap-3 border-t border-white/10 pt-6">
                {report.map((r) => (
                  <li key={r} className="flex items-center gap-3 font-medium">
                    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-marker" aria-hidden>
                      <path d="M4 13 L10 18 L20 5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
