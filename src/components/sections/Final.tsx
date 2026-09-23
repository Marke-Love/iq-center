"use client";

import { Clock, MapPin, MessageCircle, Phone, Send, Train } from "lucide-react";
import { site } from "@/content/site";
import { goal } from "@/lib/metrika";
import { PhoneLink, CtaButton } from "../ui/CtaButton";
import { LeadForm } from "../ui/LeadForm";
import { Logo } from "./Header";
import { MetroBadge } from "./MetroBadge";

export function CtaForm() {
  return (
    <section id="signup" className="px-4 py-10 sm:px-6">
      <div className="relative mx-auto grid max-w-7xl gap-10 overflow-hidden rounded-[36px] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16 lg:grid-cols-2 lg:items-center">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden />
        <div className="relative">
          <p className="eyebrow text-marker">Запись открыта</p>
          <h2 className="mt-3 font-display text-3xl leading-[1.08] font-bold text-balance sm:text-5xl">
            Узнайте свои баллы до&nbsp;экзамена
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/75">
            Оставьте телефон — администратор перезвонит, подберёт дату и расскажет, что взять с собой.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-white/80">
            <PhoneLink className="font-display text-lg font-bold text-white" />
            <span className="flex items-center gap-2"><Clock size={17} /> {site.hours}</span>
          </div>
          <MetroBadge className="mt-5" />
        </div>
        <div className="relative rounded-[28px] bg-night/70 p-6 ring-1 ring-white/10 sm:p-8">
          <LeadForm source="final" dark />
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
          <ul className="mt-8 grid gap-5">
            <li className="flex gap-4">
              <MapPin className="mt-0.5 shrink-0 text-ink" />
              <span><b className="block font-display">{site.address}</b><span className="text-muted">{site.city}</span></span>
            </li>
            <li className="flex items-center gap-4 rounded-2xl bg-marker/25 p-3">
              <Train className="ml-1 shrink-0 text-ink" />
              <span>
                <b className="block font-display">{site.metroWalk} от м. {site.metroName}</b>
                <span className="text-sm text-muted">Выход к Каменноостровскому проспекту</span>
              </span>
            </li>
            <li className="flex gap-4">
              <Phone className="mt-0.5 shrink-0 text-ink" />
              <PhoneLink withIcon={false} className="font-display font-bold" />
            </li>
            <li className="flex gap-4">
              <Clock className="mt-0.5 shrink-0 text-ink" />
              <span className="text-muted">{site.hours}</span>
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={site.telegram} target="_blank" rel="noopener" onClick={() => goal("click_messenger", { m: "tg" })} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-paper px-4 font-medium transition hover:bg-ink-soft">
              <Send size={18} className="text-ink" /> Telegram
            </a>
            <a href={site.max} target="_blank" rel="noopener" onClick={() => goal("click_messenger", { m: "max" })} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-paper px-4 font-medium transition hover:bg-ink-soft">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PhoneLink className="font-display font-bold text-white" />
            <CtaButton source="footer" variant="marker" className="min-h-12!">Записаться</CtaButton>
          </div>
        </div>
        <div className="grid gap-6 pt-8 text-sm md:grid-cols-2">
          <div className="grid gap-1">
            <p>{legal.entity}</p>
            <p>ИНН {legal.inn} · ОГРН{legal.ogrn.length > 13 ? "ИП" : ""} {legal.ogrn}</p>
            <p>{site.city}, {site.address}</p>
            <a href="/privacy/" className="mt-2 underline underline-offset-2 hover:text-white">Политика обработки персональных данных</a>
          </div>
          <p className="text-white/50 md:text-right">
            Пробные экзамены — платная образовательная услуга. {site.name} не является пунктом проведения экзаменов и не связан
            с ФИПИ и Рособрнадзором. Результат пробника не влияет на официальные результаты ЕГЭ и ОГЭ.
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
      <CtaButton source="mobile_bar" className="flex-1 px-4!">Записаться</CtaButton>
    </div>
  );
}
