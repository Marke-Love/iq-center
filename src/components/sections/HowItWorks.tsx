import { Reveal, SectionHead } from "../ui/Reveal";
import { CtaButton } from "../ui/CtaButton";

// Порядок шагов важен — это реальный регламент дня экзамена.
const steps = [
  { time: "За неделю", title: "Запись", text: "Выбираете предмет и дату. Пришлём памятку: что взять и во сколько прийти." },
  { time: "09:30", title: "Вход и досмотр", text: "Проверка документа по списку, сдача телефонов и смарт-часов, рассадка по одному." },
  { time: "10:00", title: "Экзамен", text: "Инструктаж, вскрытие пакета с КИМ, бланки ответов. Наблюдатели в аудитории, время — строго по регламенту предмета." },
  { time: "3 дня", title: "Проверка", text: "Эксперт проверяет работу по критериям ФИПИ и переводит первичные баллы в тестовые." },
  { time: "После", title: "Разбор", text: "Встреча с преподавателем: каждая ошибка, причины потерь и план, что подтянуть до экзамена." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden bg-night py-16 text-white sm:py-28">
      <div className="bg-grid absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          dark
          eyebrow="Как проходит пробник"
          title="Один день, как на настоящем экзамене"
          lead="Мы повторяем процедуру ППЭ шаг за шагом, чтобы в день экзамена ничего не было впервые."
        />

        <ol className="mt-14 grid gap-4 lg:grid-cols-5">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <li className="relative flex h-full flex-col rounded-[24px] border border-white/10 bg-white/[0.04] p-6 transition hover:border-marker/60 hover:bg-white/[0.07]">
                <div className="flex items-center justify-between">
                  <span className="cell text-2xl text-marker">{i + 1}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/70">{s.time}</span>
                </div>
                <h3 className="mt-6 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/65">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-12 flex flex-col items-start gap-4 rounded-[28px] bg-marker p-6 text-night sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-xl font-display text-xl leading-snug font-bold sm:text-2xl">
            Результат — баллы по официальной шкале и понятный план подготовки
          </p>
          <CtaButton source="how" variant="ink">Записаться</CtaButton>
        </Reveal>
      </div>
    </section>
  );
}
