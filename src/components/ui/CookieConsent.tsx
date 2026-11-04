"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { clearMetrikaCookies, loadMetrika, readConsent, saveConsent } from "@/lib/metrika";

// Событие, по которому ссылка «Настройки cookie» в подвале снова открывает плашку
export const COOKIE_SETTINGS_EVENT = "iq:cookie-settings";

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}

// Плашка согласия на cookie: Яндекс Метрика включается только после «Принять»
export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!site.metrikaId) return;
    const consent = readConsent();
    if (consent === "yes") loadMetrika();
    if (consent === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  const accept = () => {
    saveConsent("yes");
    loadMetrika();
    setOpen(false);
  };

  const decline = () => {
    const wasOn = readConsent() === "yes";
    saveConsent("no");
    clearMetrikaCookies();
    setOpen(false);
    // уже загруженный счётчик не выгрузить — перезагружаем страницу без него
    if (wasOn) location.reload();
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Согласие на использование cookie"
      className="fixed inset-x-3 bottom-24 z-[55] mx-auto max-w-xl animate-[fadeUp_.3s_ease-out] rounded-[24px] bg-white p-5 shadow-[0_20px_50px_-20px_rgba(16,16,46,0.55)] ring-1 ring-grid sm:bottom-6 sm:p-6"
    >
      <p className="font-display text-base font-bold">Мы используем cookie</p>
      <p className="mt-2 text-sm text-muted">
        С вашего согласия сайт подключит Яндекс Метрику: она сохраняет cookie и собирает данные о посещении (IP-адрес,
        устройство, действия на сайте), чтобы мы понимали, как сделать сайт удобнее. Без согласия Метрика не включается. Подробнее — в{" "}
        <a href="/privacy/#cookie" className="font-medium text-ink underline underline-offset-2">
          политике обработки персональных данных
        </a>
        .
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={decline}
          className="min-h-11 rounded-xl border-2 border-grid bg-white px-4 font-display text-sm font-bold text-text transition hover:border-ink hover:text-ink"
        >
          Отказаться
        </button>
        <button
          type="button"
          onClick={accept}
          className="min-h-11 rounded-xl bg-ink px-4 font-display text-sm font-bold text-white transition hover:bg-ink-deep"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
