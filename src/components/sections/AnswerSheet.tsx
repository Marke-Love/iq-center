"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

// Фирменный элемент: «живой» бланк ответов — идёт время, вписываются ответы, проверяющий ставит отметки.
const answers = [
  { n: 1, v: "0,75", ok: true },
  { n: 2, v: "14", ok: true },
  { n: 3, v: "−3", ok: false },
  { n: 4, v: "0,2", ok: true },
  { n: 5, v: "256", ok: true },
  { n: 6, v: "7", ok: true },
];

// «3 ч 55 мин» → секунды, чтобы таймер шёл от реальной длительности предмета
export function durationToSeconds(duration: string) {
  const h = Number(duration.match(/(\d+)\s*ч/)?.[1] ?? 0);
  const m = Number(duration.match(/(\d+)\s*мин/)?.[1] ?? 0);
  return h * 3600 + m * 60;
}

function useCountdown(start: number) {
  const [s, setS] = useState(start);
  useEffect(() => {
    setS(start);
    const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : start)), 1000);
    return () => clearInterval(t);
  }, [start]);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type Props = { subject: string; duration: string; note?: string };

export function AnswerSheet({ subject, duration, note }: Props) {
  const time = useCountdown(durationToSeconds(duration));
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? answers.length * 2 + 1 : 0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setStep((x) => (x >= answers.length * 2 + 6 ? 0 : x + 1)), 550);
    return () => clearInterval(t);
  }, [reduce]);

  const written = Math.min(step, answers.length);
  const checked = Math.max(0, Math.min(step - answers.length, answers.length));
  const done = step > answers.length * 2;

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
     <div className="relative">
      {/* подложка — стопка бланков */}
      <div className="absolute inset-0 translate-x-3 translate-y-4 rotate-3 rounded-[28px] bg-ink" aria-hidden />
      <div className="absolute inset-0 -translate-x-2 translate-y-2 -rotate-2 rounded-[28px] bg-marker" aria-hidden />

      <div className="relative overflow-hidden rounded-[28px] border-2 border-ink/80 bg-white p-5 shadow-[var(--shadow-card)] sm:p-7" role="img" aria-label={`Бланк ответов пробного экзамена по предмету «${subject}»: таймер на ${duration} и отметки проверяющего`}>
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-grid pb-4">
          <div>
            <p className="eyebrow text-muted">{note === "на компьютере" ? "Работа на компьютере" : "Бланк ответов № 1"}</p>
            <p className="mt-1 font-display text-lg leading-tight font-bold text-ink">{subject}</p>
          </div>
          <div className="rounded-xl bg-night px-3 py-2 text-right">
            <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase">осталось</p>
            <p className="font-mono text-lg font-bold text-marker tabular-nums">{time}</p>
          </div>
        </div>

        {/* поле участника — клетки */}
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
          {answers.map((a, i) => (
            <li key={a.n} className="flex items-center gap-3">
              <span className="w-6 font-mono text-sm font-bold text-muted">{a.n}</span>
              <span className="flex flex-1 text-[19px] text-ink">
                {Array.from({ length: 6 }).map((_, k) => (
                  <span key={k} className="cell flex-1 border-grid! text-ink">
                    {i < written ? a.v[k] ?? "" : ""}
                  </span>
                ))}
              </span>
              <span className="grid w-7 place-items-center">
                {i < checked && (
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="size-7 text-check"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    aria-hidden
                  >
                    {a.ok ? (
                      <path d="M4 13 L10 18 L20 5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                    )}
                  </motion.svg>
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
          <motion.div
            className="self-end rotate-[-8deg] rounded-xl border-[3px] border-check px-3 py-1.5 text-center text-check min-[420px]:self-auto"
            animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 1.6 }}
            transition={{ type: "spring", damping: 12, stiffness: 260 }}
          >
            <p className="font-display text-xs font-bold tracking-wider uppercase">Проверено</p>
            <p className="font-mono text-2xl leading-none font-bold">5/6</p>
          </motion.div>
        </div>
      </div>
     </div>

      {/* стикер с разбором */}
      <motion.div
        className="mt-4 inline-block rotate-[-2deg] rounded-2xl bg-night px-4 py-3 text-white shadow-xl sm:absolute sm:-bottom-6 sm:-left-10 sm:mt-0 sm:rotate-[-4deg]"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="font-mono text-[11px] text-white/50 uppercase">После проверки</p>
        <p className="mt-0.5 text-sm font-semibold">Разберём каждую ошибку</p>
      </motion.div>
    </div>
  );
}
