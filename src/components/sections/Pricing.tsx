import { Check } from "lucide-react";
import { plans } from "@/content/site";
import { CtaButton } from "../ui/CtaButton";
import { Reveal, SectionHead } from "../ui/Reveal";

const rub = (n: number) => n.toLocaleString("ru-RU") + " ₽";

export function Pricing() {
  return (
    <section id="prices" className="py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Стоимость"
          title="Выберите формат"
          lead="В каждый формат входят экзамен, проверка экспертом и разбор. Бланки и задания — наши."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.07}>
              <article
                className={`relative flex h-full flex-col rounded-[28px] p-7 sm:p-8 ${
                  p.accent ? "bg-ink text-white shadow-[0_30px_60px_-30px_var(--color-ink)] lg:-translate-y-3" : "bg-white shadow-[var(--shadow-card)]"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3.5 right-6 rotate-3 rounded-full bg-marker px-4 py-1.5 font-display text-xs font-bold text-night">
                    {p.badge}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{p.title}</h3>
                <div className="mt-5 flex items-baseline gap-2">
                  {p.price ? (
                    <>
                      <span className="font-mono text-4xl font-bold">{rub(p.price)}</span>
                      <span className={p.accent ? "text-white/60" : "text-muted"}>{p.unit}</span>
                    </>
                  ) : (
                    <span className={`font-display text-xl font-bold ${p.accent ? "text-marker" : "text-ink"}`}>Стоимость по телефону</span>
                  )}
                </div>
                <ul className="mt-6 grid flex-1 content-start gap-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check size={20} className={`mt-0.5 shrink-0 ${p.accent ? "text-marker" : "text-check"}`} strokeWidth={3} />
                      <span className={p.accent ? "text-white/85" : "text-muted"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <CtaButton source={`price_${p.id}`} variant={p.accent ? "marker" : "ink"} className="mt-8 w-full">
                  {p.price ? "Записаться" : "Узнать стоимость"}
                </CtaButton>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
