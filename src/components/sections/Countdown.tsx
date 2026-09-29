import { CtaButton } from "../ui/CtaButton";
import { Reveal, SectionHead } from "../ui/Reveal";

// «до» и «после» — про состояние ученика, а не про обещанные баллы
const before = [
  "Настоящий бланк видел только на картинке",
  "Не знает, на что уходит время на экзамене",
  "Оформляет ответы как привык, а не по критериям",
  "О своём реальном уровне судит по домашним работам",
];

const after = [
  "Заполнял бланки по регламенту — рука уже помнит",
  "Знает, на каких заданиях теряет минуты",
  "Понимает, за что эксперт снимает баллы",
  "Есть баллы по шкале ФИПИ и план, что подтянуть",
];

export function Countdown() {
  return (
    <section className="relative overflow-hidden bg-night py-16 text-white sm:py-24">
      <div className="bg-grid absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          dark
          eyebrow="Пока есть время"
          title={<>Экзамен ближе, чем кажется</>}
          lead="Первый раз увидеть бланк и услышать «время пошло» можно у нас — или в день, когда результат идёт в аттестат."
        />


        <div className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[28px] border border-white/10 p-7 sm:p-8">
              <p className="eyebrow text-white/50">Без пробника</p>
              <ul className="mt-5 grid gap-3.5">
                {before.map((t) => (
                  <li key={t} className="flex gap-3 text-white/70">
                    <svg viewBox="0 0 24 24" className="mt-1 size-4 shrink-0 text-check" aria-hidden>
                      <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="h-full rounded-[28px] bg-white/[0.07] p-7 ring-1 ring-marker/40 sm:p-8">
              <p className="eyebrow text-marker">После пробника</p>
              <ul className="mt-5 grid gap-3.5">
                {after.map((t) => (
                  <li key={t} className="flex gap-3">
                    <svg viewBox="0 0 24 24" className="mt-1 size-4 shrink-0 text-marker" aria-hidden>
                      <path d="M4 13 L10 18 L20 5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-10">
          <div className="flex flex-col items-start gap-4 rounded-[28px] bg-marker p-6 text-night sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="max-w-xl font-display text-xl leading-snug font-bold sm:text-2xl">
              Пусть первый экзамен пройдёт там, где ошибка ничего не стоит
            </p>
            <CtaButton source="countdown" variant="ink" className="w-full sm:w-auto">
              Записаться на пробник
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
