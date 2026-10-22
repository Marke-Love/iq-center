import { MapPin } from "lucide-react";
import { site } from "@/content/site";
import { CtaButton } from "../ui/CtaButton";
import { MetroIcon } from "../ui/MetroIcon";
import { ExamDeck } from "./ExamDeck";

const points = [
  "Отсутствие телефонов, рассадка по одному и точный тайминг",
  "Настоящие бланки и задания с учётом всех нововведений",
  "Проверка действующим экспертом и разбор каждой ошибки",
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 pb-10 sm:pt-32 sm:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8">
          {/* главный аргумент: экзамен пишут вживую, в аудитории */}
          <p className="inline-flex max-w-full items-center gap-3 rounded-[22px] bg-night py-1.5 pr-4 pl-1.5 text-white shadow-[4px_4px_0_var(--color-ink)] sm:gap-3.5 sm:rounded-full sm:pr-6">
            <span className="shrink-0 rounded-full bg-marker px-4 pt-2 pb-1.5 font-display text-lg leading-none font-bold tracking-wide text-night uppercase sm:px-5 sm:pt-2.5 sm:pb-2 sm:text-2xl">
              Очно
            </span>
            <span className="text-[15px] leading-snug sm:text-[17px]">
              в аудитории центра, а&nbsp;не&nbsp;<s className="pen-strike text-white/50">онлайн</s>
            </span>
          </p>

          {/* где: ориентир и метро рядом с «очно», компактно, чтобы не отнимать первый экран */}
          <p className="inline-flex items-center gap-2.5 rounded-full border-2 border-grid bg-white py-1.5 pr-5 pl-1.5 shadow-sm">
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

        <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <h1 className="font-display text-[2.35rem] leading-[1.02] font-bold tracking-tight sm:text-6xl xl:text-[4.4rem]">
              Пробный{" "}
              <span className="inline-flex align-middle text-ink">
                <span className="cell">Е</span>
                <span className="cell">Г</span>
                <span className="cell">Э</span>
              </span>{" "}
              и{" "}
              <span className="inline-flex align-middle text-ink">
                <span className="cell">О</span>
                <span className="cell">Г</span>
                <span className="cell">Э</span>
              </span>
              <br />
              <span className="marker">как настоящий</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-pretty text-muted sm:text-xl">
              Приходи в центр и напиши любой предмет в условиях реального экзамена. Узнай свои баллы заранее и сдай ЕГЭ
              и ОГЭ без страха.
            </p>

            <ul className="mt-7 grid gap-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 font-medium">
                  <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-check" aria-hidden>
                    <path d="M4 13 L10 18 L20 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaButton source="hero">Записаться на пробник</CtaButton>
            </div>
          </div>

          <ExamDeck />
        </div>
      </div>
    </section>
  );
}
