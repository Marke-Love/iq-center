import { Check } from "lucide-react";
import { pricing, site } from "@/content/site";
import { CtaButton, PhoneLink } from "../ui/CtaButton";
import { Reveal, SectionHead } from "../ui/Reveal";

export function Pricing() {
  return (
    <section id="prices" className="py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Стоимость"
          title="Одна запись, и всё включено"
          lead="В цену уже входят сам экзамен, проверка работы экспертом и разбор ошибок. Ничего доплачивать не нужно."
        />

        <Reveal className="mt-10">
          <div className="grid overflow-hidden rounded-[32px] bg-white shadow-[var(--shadow-card)] lg:grid-cols-[0.85fr_1.15fr]">
            {/* цена и запись — главное действие блока */}
            <div className="relative flex flex-col justify-center bg-ink p-8 text-white sm:p-10">
              <div className="bg-grid absolute inset-0 opacity-[0.08]" aria-hidden />
              <div className="relative">
                <p className="eyebrow text-marker">{pricing.unit}</p>
                <p className="mt-3 font-mono text-6xl leading-none font-bold sm:text-7xl">
                  {pricing.price.toLocaleString("ru-RU")}&nbsp;₽
                </p>
                <p className="mt-4 text-white/75">Выберите предмет и&nbsp;дату. Остальное за&nbsp;нами.</p>
                <CtaButton
                  source="prices"
                  variant="marker"
                  className="mt-8 min-h-16! w-full text-lg! shadow-[0_18px_40px_-16px_var(--color-marker)] sm:min-h-[72px]! sm:text-xl!"
                >
                  Записаться
                </CtaButton>
                <p className="mt-5 text-sm text-white/70">
                  Или позвоните: <PhoneLink withIcon={false} className="font-display font-bold text-white" />
                </p>
              </div>
            </div>

            {/* состав услуги */}
            <div className="p-8 sm:p-10">
              <h3 className="font-display text-xl font-bold">В пробник входит</h3>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {pricing.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check size={20} strokeWidth={3} className="mt-0.5 shrink-0 text-check" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 border-t border-grid pt-6 text-sm text-muted">{pricing.note}</p>
              <p className="mt-1 text-sm text-muted">
                {site.landmark}, {site.metroWalk} от м. {site.metroName}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
