import { Reveal, SectionHead } from "../ui/Reveal";

const items = [
  {
    problem: "Волнение в незнакомой обстановке",
    fix: "Школьник проходит всю процедуру заранее: вход по списку, сдача телефонов, инструктаж. На экзамене всё уже знакомо.",
  },
  {
    problem: "Не хватило времени на вторую часть",
    fix: "Пишет с таймером на полное время и видит, на каких заданиях застревает. Разберём, как распределять минуты.",
  },
  {
    problem: "Ошибки в заполнении бланков",
    fix: "Заполняет настоящие бланки ответов. Проверяющий отметит неправильное написание цифр, единиц и переносы.",
  },
  {
    problem: "Решено верно, но оформлено не по критериям",
    fix: "Развёрнутые ответы оцениваются строго по критериям ФИПИ — видно, за что снимают баллы.",
  },
];

export function Pain() {
  return (
    <section className="py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Зачем нужен пробник"
          title={
            <>
              Баллы теряют не только из‑за <span className="marker">знаний</span>
            </>
          }
          lead="Даже хорошо подготовленные ученики ошибаются на самом экзамене. Причины — обстановка, время и формальности. Всё это можно отработать заранее."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {items.map((it, i) => (
            <Reveal key={it.problem} delay={i * 0.06}>
              <article className="group h-full rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 sm:p-8">
                <p className="flex gap-3 font-display text-lg leading-snug font-bold sm:text-xl">
                  <svg viewBox="0 0 24 24" className="mt-1 size-5 shrink-0 text-check" aria-hidden>
                    <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                  </svg>
                  {/* волнистая линия — как пометка ошибки красной ручкой, но текст остаётся читаемым */}
                  <span className="underline decoration-check/70 decoration-wavy decoration-2 underline-offset-[6px]">{it.problem}</span>
                </p>
                <p className="mt-4 flex gap-3 text-muted">
                  <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden>
                    <path d="M4 13 L10 18 L20 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {it.fix}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
