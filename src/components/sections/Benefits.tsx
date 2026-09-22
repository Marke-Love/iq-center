import { BarChart3, ClipboardCheck, Compass, FileText, ShieldCheck } from "lucide-react";
import { Reveal, SectionHead } from "../ui/Reveal";

const items = [
  { icon: BarChart3, title: "Баллы по шкале ФИПИ", text: "Первичные и тестовые баллы — такие же, как в официальных результатах." },
  { icon: ClipboardCheck, title: "Разбор каждой ошибки", text: "Что не так, почему сняли баллы и как оформить правильно." },
  { icon: Compass, title: "План подготовки", text: "Список тем и заданий, которые дадут прирост баллов быстрее всего." },
  { icon: ShieldCheck, title: "Уверенность", text: "Процедура уже пройдена — на экзамене силы уходят на задания, а не на стресс." },
];

export function Benefits() {
  return (
    <section className="bg-white py-16 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-14 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHead
            eyebrow="Что получите"
            title={
              <>
                Не просто оценку, а <span className="marker">карту ошибок</span>
              </>
            }
            lead="После пробника у ученика и родителей есть ясная картина: где он сейчас и что делать дальше."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal key={it.title} delay={i * 0.06}>
                <div className="grid size-12 place-items-center rounded-2xl bg-ink-soft text-ink">
                  <it.icon size={22} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{it.title}</h3>
                <p className="mt-1.5 text-muted">{it.text}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Мокап отчёта */}
        <Reveal delay={0.1}>
          <div className="relative rounded-[28px] border-2 border-grid bg-paper p-6 sm:p-8" role="img" aria-label="Пример отчёта по результатам пробного экзамена">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-ink" />
                <p className="font-display font-bold">Отчёт по пробнику</p>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 font-mono text-xs text-muted">пример</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-muted">Первичный балл</p>
                <p className="mt-1 font-mono text-3xl font-bold">14<span className="text-lg text-muted">/32</span></p>
              </div>
              <div className="rounded-2xl bg-ink p-4 text-white">
                <p className="text-sm text-white/70">Тестовый балл</p>
                <p className="mt-1 font-mono text-3xl font-bold text-marker">74</p>
              </div>
            </div>

            <p className="mt-6 eyebrow text-muted">Задания · выполнение</p>
            <div className="mt-3 grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(19,minmax(0,1fr))]">
              {[1, 1, 1, 0, 1, 1, 1, 1, 0.5, 1, 1, 0, 1, 0.5, 0, 1, 0.5, 0, 0].map((v, i) => (
                <div key={i} className="text-center">
                  <div
                    className={`aspect-square rounded-md ${v === 1 ? "bg-ink" : v > 0 ? "bg-ink/40" : "bg-check/85"}`}
                    title={`Задание ${i + 1}`}
                  />
                  <span className="mt-1 block font-mono text-[10px] text-muted">{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-check/50 p-4">
              <p className="font-display text-sm font-bold text-check">Главное, что подтянуть</p>
              <ul className="mt-2 grid gap-1 text-[15px] text-muted">
                <li>— Задание 4: теория вероятностей, условная вероятность</li>
                <li>— Задание 12: оформление обоснования, −1 балл</li>
                <li>— Задание 15: не хватило времени, начать раньше</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
