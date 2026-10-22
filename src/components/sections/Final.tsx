"use client";

import { Clock, FileText, MapPin, MessageCircle, Phone, Send, Users } from "lucide-react";
import { site } from "@/content/site";
import { goal } from "@/lib/metrika";
import { CtaButton, PhoneLink } from "../ui/CtaButton";
import { LeadForm } from "../ui/LeadForm";
import { MetroIcon } from "../ui/MetroIcon";
import { Logo } from "./Header";

// ключевые факты рядом с формой: снимают последние сомнения перед записью
const facts = [
  { icon: Users, title: "Очно, как на экзамене", text: "Рассадка, бланки, тайминг", tilt: "lg:-rotate-3" },
  { icon: MapPin, title: site.landmark, text: `${site.metroWalk} от м. ${site.metroName}`, tilt: "lg:translate-x-10 lg:rotate-2" },
  { icon: FileText, title: "Отчёт за 5–7 дней", text: "Баллы и разбор каждой ошибки", tilt: "lg:translate-x-3 lg:-rotate-[1.5deg]" },
];

export function CtaForm() {
  return (
    <section id="signup" className="px-2 py-10 sm:px-5">
      {/* такая же «картина» в рамке, как первый экран */}
      <div className="relative mx-auto grid max-w-[1360px] overflow-hidden rounded-[32px] bg-ink text-white shadow-[0_30px_60px_-30px_rgba(28,28,168,0.7)] sm:rounded-[44px] lg:grid-cols-[1fr_0.95fr]">
        <div className="bg-grid absolute inset-0 opacity-[0.09]" aria-hidden />

        <div className="relative px-5 pt-10 sm:px-10 sm:pt-14 lg:px-14">
          <p className="eyebrow flex items-center gap-3 text-marker">
            <span className="h-0.5 w-8 rounded-full bg-marker" aria-hidden />
            Запись открыта
          </p>
          <h2 className="mt-4 font-display text-3xl leading-[1.08] font-bold text-balance sm:text-5xl">Узнайте свои баллы до&nbsp;экзамена</h2>
          <p className="mt-5 max-w-md text-lg text-white/80">Оставьте телефон. Администратор перезвонит, подберёт предмет и удобную дату.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-white/80">
            <PhoneLink className="font-display text-lg font-bold text-white" />
            <span className="flex items-center gap-2 text-sm">
              <Clock size={16} /> {site.hours}
            </span>
          </div>

          {/* на десктопе карточки лежат на лаймовом круге, который уходит за нижний край рамки */}
          <div className="relative mt-8 lg:mt-12 lg:pt-4 lg:pb-24">
            <div className="absolute top-0 left-[6%] hidden aspect-square w-[78%] rounded-full bg-marker lg:block" aria-hidden />
            <ul className="relative grid max-w-md gap-3 lg:pl-4">
              {facts.map((f) => (
                <li
                  key={f.title}
                  className={`flex items-center gap-3 rounded-3xl bg-white p-3 pr-5 text-text shadow-[0_20px_40px_-24px_rgba(16,16,46,0.7)] ${f.tilt}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-marker">
                    <f.icon size={20} />
                  </span>
                  <span className="leading-tight">
                    <b className="block font-display text-[15px] font-bold">{f.title}</b>
                    <span className="text-sm text-muted">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative px-3 pt-8 pb-3 sm:px-8 sm:pb-8 lg:py-12 lg:pr-12 lg:pl-4">
          <div className="rounded-[28px] bg-white p-6 text-text shadow-[0_30px_60px_-30px_rgba(16,16,46,0.6)] sm:rounded-[32px] sm:p-8">
            <p className="font-display text-2xl font-bold">Записаться на пробник</p>
            <p className="mt-1.5 text-sm text-muted">Перезвоним в течение 15 минут в рабочее время.</p>
            <div className="mt-6">
              <LeadForm source="final" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contacts() {
  const { lat, lon } = site.geo;
  return (
    <section id="contacts" className="py-16 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] bg-white p-7 shadow-[var(--shadow-card)] sm:p-9">
          <p className="eyebrow text-check">Контакты</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Как нас найти</h2>
          <ul className="mt-7 grid gap-5">
            <li className="flex gap-4">
              <MapPin className="mt-0.5 shrink-0 text-ink" />
              <span>
                <b className="block font-semibold">{site.landmark}</b>
                <span className="text-muted">
                  {site.address}, {site.city}
                </span>
              </span>
            </li>
            <li className="flex items-center gap-4 rounded-2xl bg-marker/25 p-3">
              <MetroIcon className="ml-0.5 size-6" />
              <span>
                <b className="block font-semibold">
                  {site.metroWalk} от м. {site.metroName}
                </b>
                <span className="text-sm text-muted">Выход к Каменноостровскому проспекту</span>
              </span>
            </li>
            <li className="flex gap-4">
              <Phone className="shrink-0 text-ink" />
              <PhoneLink withIcon={false} className="font-display text-lg font-bold" />
            </li>
            <li className="flex gap-4">
              <Clock className="shrink-0 text-ink" />
              <span className="text-muted">{site.hours}</span>
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={site.telegram}
              target="_blank"
              rel="noopener"
              onClick={() => goal("click_messenger", { m: "tg" })}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-paper px-4 font-medium transition hover:bg-ink-soft"
            >
              <Send size={18} className="text-ink" /> Telegram
            </a>
            <a
              href={site.max}
              target="_blank"
              rel="noopener"
              onClick={() => goal("click_messenger", { m: "max" })}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-paper px-4 font-medium transition hover:bg-ink-soft"
            >
              <MessageCircle size={18} className="text-ink" /> MAX
            </a>
          </div>
        </div>
        <div className="min-h-[360px] overflow-hidden rounded-[28px] bg-ink-soft shadow-[var(--shadow-card)]">
          <iframe
            title={`Карта: ${site.address}`}
            src={`https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=17&pt=${lon}%2C${lat}%2Cpm2rdm`}
            className="h-full min-h-[360px] w-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { legal } = site;
  return (
    <footer className="bg-night pt-14 pb-28 text-white/70 sm:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 md:flex-row md:items-center md:justify-between">
          <Logo light />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PhoneLink className="font-display font-bold text-white" />
            <CtaButton source="footer" variant="marker" className="min-h-12!">
              Записаться
            </CtaButton>
          </div>
        </div>
        <div className="grid gap-6 pt-8 text-sm md:grid-cols-2">
          <div className="grid gap-1">
            <p>{legal.entity}</p>
            <p>
              ИНН {legal.inn} · ОГРН{legal.ogrn.length > 13 ? "ИП" : ""} {legal.ogrn}
            </p>
            <p>
              {site.city}, {site.address}
            </p>
            <a href="/privacy/" className="mt-2 underline underline-offset-2 hover:text-white">
              Политика обработки персональных данных
            </a>
          </div>
          <p className="text-white/50 md:text-right">
            Пробные экзамены являются платной образовательной услугой. {site.name} не является пунктом проведения экзаменов и
            не связан с ФИПИ и Рособрнадзором. Результат пробника не влияет на официальные результаты ЕГЭ и ОГЭ.
            <br />© {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-grid bg-paper p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <a
        href={site.phoneHref}
        onClick={() => goal("click_phone", { source: "mobile_bar" })}
        aria-label={`Позвонить ${site.phone}`}
        className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-ink shadow-sm"
      >
        <Phone size={22} />
      </a>
      <CtaButton source="mobile_bar" className="flex-1 px-4!">
        Записаться
      </CtaButton>
    </div>
  );
}
