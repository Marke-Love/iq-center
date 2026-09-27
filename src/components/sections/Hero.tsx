import { MapPin } from "lucide-react";
import { site } from "@/content/site";
import { MetroBadge } from "./MetroBadge";
import { CtaButton } from "../ui/CtaButton";
import { ExamDeck } from "./ExamDeck";

const points = [
  "Очно в аудитории центра — не онлайн-тест",
  "Сдача телефонов, рассадка по одному и точный тайминг",
  "Настоящие бланки и задания в формате демоверсии ФИПИ",
  "Проверка экспертом и разбор каждой ошибки",
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 pb-10 sm:pt-32 sm:pb-14">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)] opacity-70" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium shadow-sm">
                <MapPin size={16} className="text-check" />
                {site.city}, {site.address}
              </p>
              <MetroBadge />
            </div>

            <h1 className="mt-6 font-display text-[2.35rem] leading-[1.02] font-bold tracking-tight sm:text-6xl xl:text-[4.4rem]">
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
              Приходите в центр и сдайте любой предмет в условиях реального экзамена. Узнаете свои баллы заранее — и
              придёте на ЕГЭ или ОГЭ без страха перед процедурой.
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
              <a
                href="#prices"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-text/15 bg-white/60 px-7 font-display text-[15px] font-bold transition hover:border-ink hover:text-ink"
              >
                Узнать стоимость
              </a>
            </div>
          </div>

          <ExamDeck />
        </div>

      </div>
    </section>
  );
}
