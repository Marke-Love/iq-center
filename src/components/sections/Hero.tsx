import { Atom, BookOpen, Calculator, Landmark, MapPin } from "lucide-react";
import { site } from "@/content/site";
import { CtaButton } from "../ui/CtaButton";
import { MetroIcon } from "../ui/MetroIcon";
import { ExamDeck } from "./ExamDeck";

const points = [
  "Отсутствие телефонов, рассадка по одному и точный тайминг",
  "Настоящие бланки и задания с учётом всех нововведений",
  "Проверка действующим экспертом и разбор каждой ошибки",
];

// предметы «плавают» вокруг бланка; у каждого свой наклон, задержка и темп, чтобы движение не было синхронным
const tags = [
  { label: "Математика", icon: Calculator, pos: "-top-3 -left-2", tilt: "-7deg", delay: "0s", dur: "7s" },
  { label: "Русский язык", icon: BookOpen, pos: "top-[26%] -right-4", tilt: "6deg", delay: "-2.4s", dur: "8s" },
  { label: "История", icon: Landmark, pos: "bottom-[24%] -left-6", tilt: "-5deg", delay: "-4.1s", dur: "6.5s" },
  { label: "Физика", icon: Atom, pos: "bottom-[6%] right-2", tilt: "5deg", delay: "-1.2s", dur: "7.5s" },
];

export function Hero() {
  return (
    <section id="top" className="px-2 pt-22 pb-6 sm:px-5 sm:pt-24 sm:pb-10">
      {/* первый экран — отдельная «картина» в рамке: синий лист в клетку со скруглёнными углами */}
      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-ink text-white shadow-[0_30px_60px_-30px_rgba(28,28,168,0.7)] sm:rounded-[44px]">
        <div className="bg-grid absolute inset-0 opacity-[0.09]" aria-hidden />

        <div className="relative px-4 pt-6 pb-10 sm:px-10 sm:pt-10 sm:pb-14 lg:px-14 lg:pt-12">
          <div className="mb-7 flex flex-wrap items-center gap-3 sm:mb-9">
            {/* главный аргумент: экзамен пишут вживую, в аудитории */}
            <p className="inline-flex max-w-full items-center gap-3 rounded-[22px] bg-night py-1.5 pr-4 pl-1.5 text-white shadow-[4px_4px_0_var(--color-ink-deep)] sm:gap-3.5 sm:rounded-full sm:pr-6">
              <span className="shrink-0 rounded-full bg-marker px-4 pt-2 pb-1.5 font-display text-lg leading-none font-bold tracking-wide text-night uppercase sm:px-5 sm:pt-2.5 sm:pb-2 sm:text-2xl">
                Очно
              </span>
              <span className="text-[15px] leading-snug sm:text-[17px]">
                в аудитории центра, а&nbsp;не&nbsp;<s className="pen-strike text-white/50">онлайн</s>
              </span>
            </p>

            {/* где: ориентир и метро рядом с «очно», компактно, чтобы не отнимать первый экран */}
            <p className="inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-5 pl-1.5 text-text shadow-sm">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-check text-white shadow-[0_6px_16px_-6px_var(--color-check)]">
                <MapPin size={19} strokeWidth={2.5} />
              </span>
              <span className="leading-tight">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <b className="font-display text-[13px] font-bold sm:text-sm">{site.landmark}</b>
                  <span className="text-xs text-muted sm:text-[13px]">{site.address}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted sm:text-[13px]">
                  <MetroIcon className="size-4" />
                  {site.metroName}, {site.metroWalk}
                </span>
              </span>
            </p>
          </div>

          <div className="grid items-center gap-12 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div>
              <h1 className="font-display text-[2.35rem] leading-[1.06] font-bold tracking-tight sm:text-6xl xl:text-[4.4rem]">
                Пробный{" "}
                <span className="inline-flex align-middle text-marker">
                  <span className="cell">Е</span>
                  <span className="cell">Г</span>
                  <span className="cell">Э</span>
                </span>{" "}
                и{" "}
                <span className="inline-flex align-middle text-marker">
                  <span className="cell">О</span>
                  <span className="cell">Г</span>
                  <span className="cell">Э</span>
                </span>
                <br />
                <span className="text-marker">
                  как{" "}
                  {/* «настоящий» подчёркнут от руки ручкой проверяющего */}
                  <span className="relative inline-block whitespace-nowrap">
                    настоящий
                    <svg
                      viewBox="0 0 300 20"
                      preserveAspectRatio="none"
                      className="absolute -bottom-2 left-0 h-3 w-full text-check sm:-bottom-3 sm:h-4"
                      aria-hidden
                    >
                      <path d="M3 13 C 70 4, 160 3, 297 9" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  </span>
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg text-pretty text-white/80 sm:text-xl">
                Приходи в центр и напиши любой предмет в условиях реального экзамена. Узнай свои баллы заранее и сдай
                ЕГЭ и ОГЭ без страха.
              </p>

              <ul className="mt-7 grid gap-3">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-3 font-medium">
                    <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-marker" aria-hidden>
                      <path d="M4 13 L10 18 L20 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CtaButton source="hero" className="px-5! sm:px-7!">Записаться на пробник</CtaButton>
              </div>
            </div>

            {/* бланк на лаймовом круге, вокруг плавают предметы; на телефоне скрыт, чтобы кнопка записи была ближе */}
            <div className="relative hidden px-12 pt-8 pb-12 sm:block">
              <div
                className="absolute top-1/2 left-1/2 aspect-square w-[110%] max-w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-marker sm:w-[104%]"
                aria-hidden
              />
              <ExamDeck />
              {tags.map((t) => (
                <span
                  key={t.label}
                  className={`float-tag absolute z-[60] flex items-center gap-2 rounded-full bg-white py-1.5 pr-4 pl-1.5 font-display text-[13px] font-bold whitespace-nowrap text-text shadow-[0_14px_30px_-12px_rgba(16,16,46,0.55)] sm:text-sm ${t.pos}`}
                  style={{ "--tilt": t.tilt, animationDelay: t.delay, animationDuration: t.dur } as React.CSSProperties}
                  aria-hidden
                >
                  <span className="grid size-7 place-items-center rounded-full bg-ink text-marker">
                    <t.icon size={15} />
                  </span>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
