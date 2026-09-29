"use client";

import { useEffect, useRef, useState } from "react";
import { examDeck } from "@/content/site";

// «3 ч 55 мин» → секунды
function durationToSeconds(duration: string) {
  const h = Number(duration.match(/(\d+)\s*ч/)?.[1] ?? 0);
  const m = Number(duration.match(/(\d+)\s*мин/)?.[1] ?? 0);
  return h * 3600 + m * 60;
}

function format(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// Веер «живёт» только на экране и при активной вкладке — иначе зря греет процессор
function useOnScreen<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const onVisibility = () => setVisible(!document.hidden && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);
  return visible;
}

const ROWS = 6;

// Положение карточки в веере: 0 — верхняя, дальше уходят вправо-вниз с наклоном
const layers = [
  "z-40 translate-x-0 translate-y-0 rotate-0 scale-100",
  "z-30 translate-x-3 translate-y-3 rotate-[3deg] scale-[0.97] sm:translate-x-5 sm:translate-y-4",
  "z-20 -translate-x-2 translate-y-6 rotate-[-3deg] scale-[0.94] sm:-translate-x-4 sm:translate-y-8",
  "z-10 translate-x-5 translate-y-9 rotate-[6deg] scale-[0.91] sm:translate-x-9 sm:translate-y-12",
];

const edges = ["border-ink/80", "border-marker", "border-ink", "border-check"];

type Blank = (typeof examDeck)[number];

function BlankCard({ blank, active, step, time, edge }: { blank: Blank; active: boolean; step: number; time: string; edge: string }) {
  // на дальних бланках работа уже «сдана»: всё вписано и проверено
  const written = active ? Math.min(step, ROWS) : ROWS;
  const checked = active ? Math.max(0, Math.min(step - ROWS, ROWS)) : ROWS;
  const done = active ? step > ROWS * 2 : true;
  const score = blank.answers.filter((a) => a.ok).length;

  return (
    <div
      className={`overflow-hidden rounded-[28px] border-2 bg-white p-5 shadow-[var(--shadow-card)] sm:p-7 ${edge}`}
      role="img"
      aria-label={`Бланк ответов: ${blank.subject}, ${blank.exam}, ${blank.duration}`}
    >
      <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-grid pb-4">
        <div>
          <p className="eyebrow text-muted">{blank.note === "на компьютере" ? "Работа на компьютере" : "Бланк ответов № 1"}</p>
          <p className="mt-1 font-display text-lg leading-tight font-bold text-ink">{blank.subject}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-night px-3 py-2 text-right">
          <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase">{blank.exam}</p>
          <p className="font-mono text-lg font-bold text-marker tabular-nums">{time}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="font-mono text-[11px] text-muted uppercase">Код&nbsp;региона</span>
        <span className="flex text-lg text-ink">
          <span className="cell">7</span>
          <span className="cell">8</span>
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted uppercase">Аудитория</span>
        <span className="flex text-lg text-ink">
          <span className="cell">0</span>
          <span className="cell">4</span>
        </span>
      </div>

      <ul className="mt-5 grid gap-2">
        {blank.answers.map((a, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="w-6 font-mono text-sm font-bold text-muted">{i + 1}</span>
            <span className="flex flex-1 text-[19px] text-ink">
              {Array.from({ length: 6 }).map((_, k) => (
                <span key={k} className="cell flex-1 border-grid! text-ink">
                  {i < written ? (a.v[k] ?? "") : ""}
                </span>
              ))}
            </span>
            <span className="grid w-7 place-items-center">
              {i < checked && (
                <svg viewBox="0 0 24 24" className={`size-7 text-check ${active ? "animate-[pop_.25s_ease-out]" : ""}`} aria-hidden>
                  {a.ok ? (
                    <path d="M4 13 L10 18 L20 5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                  )}
                </svg>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col items-start gap-3 border-t-2 border-dashed border-grid pt-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <p className="text-sm text-muted">
          Проверяет эксперт
          <br />
          по критериям ФИПИ
        </p>
        <div
          className={`self-end rotate-[-8deg] rounded-xl border-[3px] border-check px-3 py-1.5 text-center text-check transition-[opacity,transform] duration-300 ease-out min-[420px]:self-auto ${
            done ? "scale-100 opacity-100" : "scale-150 opacity-0"
          }`}
        >
          <p className="font-display text-xs font-bold tracking-wider uppercase">Проверено</p>
          <p className="font-mono text-2xl leading-none font-bold">
            {score}/{ROWS}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ExamDeck() {
  const rootRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(rootRef);
  const [front, setFront] = useState(0);
  // после ручного выбора автолистание выключаем — иначе бланк «уезжает» из-под пользователя
  const [manual, setManual] = useState(false);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(() => durationToSeconds(examDeck[0].duration));

  const active = examDeck[front];

  // перебор бланков: верхний уходит в конец веера
  useEffect(() => {
    if (!onScreen || manual) return;
    const t = setInterval(() => setFront((f) => (f + 1) % examDeck.length), 7000);
    return () => clearInterval(t);
  }, [onScreen, manual]);

  // заполнение и проверка верхнего бланка
  useEffect(() => {
    setStep(0);
    setSeconds(durationToSeconds(active.duration));
  }, [active]);

  useEffect(() => {
    if (!onScreen) return;
    const t = setInterval(() => setStep((x) => Math.min(x + 1, ROWS * 2 + 4)), 420);
    return () => clearInterval(t);
  }, [onScreen, active]);

  useEffect(() => {
    if (!onScreen) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : s)), 1000);
    return () => clearInterval(t);
  }, [onScreen, active]);

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[460px]">
      {/* переключатели предметов — они же индикаторы веера */}
      <div className="relative z-50 mb-6 grid grid-cols-2 gap-1.5 sm:mb-7 sm:grid-cols-4 sm:gap-2">
        {examDeck.map((blank, i) => (
          <button
            key={blank.subject}
            onClick={() => {
              setFront(i);
              setManual(true);
            }}
            aria-pressed={i === front}
            className={`min-h-10 w-full rounded-full border-2 px-1 font-display text-[11px] font-bold whitespace-nowrap transition ${
              i === front ? "border-ink bg-ink text-white" : "border-grid bg-white/70 text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {blank.short}
          </button>
        ))}
      </div>

      {/* веер: все бланки в одной ячейке грида, слои задаются трансформом */}
      <div className="relative grid">
        {examDeck.map((blank, i) => {
          const pos = (i - front + examDeck.length) % examDeck.length;
          return (
            <div
              key={blank.subject}
              className={`col-start-1 row-start-1 transition-[transform,opacity] duration-500 ease-out ${layers[pos] ?? layers[layers.length - 1]}`}
              aria-hidden={pos !== 0}
            >
              <BlankCard
                blank={blank}
                active={pos === 0}
                step={step}
                time={pos === 0 ? format(seconds) : blank.duration.replace(" ч ", ":").replace(" мин", "")}
                edge={edges[pos] ?? edges[edges.length - 1]}
              />
            </div>
          );
        })}

        <div className="absolute -bottom-6 -left-2 z-50 inline-block rotate-[-3deg] rounded-2xl bg-night px-4 py-3 text-white shadow-xl sm:-bottom-7 sm:-left-12">
          <p className="font-mono text-[11px] text-white/50 uppercase">После проверки</p>
          <p className="mt-0.5 text-sm font-semibold">Разберём каждую ошибку</p>
        </div>
      </div>


    </div>
  );
}
