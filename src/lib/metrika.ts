import { site } from "@/content/site";

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };
type YmWindow = Window & { ym?: Ym; dataLayer?: unknown[] };

export type Goal = "form_submit" | "click_phone" | "click_cta" | "open_modal" | "subject_click" | "click_messenger";

// Согласие на cookie храним в браузере посетителя: "yes" / "no" (+ дата решения)
const CONSENT_KEY = "iq_cookie_consent";
export type Consent = "yes" | "no" | null;

export function readConsent(): Consent {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    return v?.value === "yes" || v?.value === "no" ? v.value : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: "yes" | "no") {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, at: new Date().toISOString() }));
  } catch {}
}

// Удаляем cookie Метрики (_ym_*), если посетитель отозвал согласие
export function clearMetrikaCookies() {
  const host = location.hostname;
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0].trim();
    if (!name.startsWith("_ym")) continue;
    for (const domain of ["", host, "." + host.replace(/^www\./, "")]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? "; domain=" + domain : ""}`;
    }
  }
}

// Счётчик подключается только после согласия — до этого Метрика не ставит cookie и ничего не собирает
export function loadMetrika() {
  const w = window as YmWindow;
  if (!site.metrikaId || w.ym) return;
  const id = Number(site.metrikaId);
  const src = `https://mc.yandex.ru/metrika/tag.js?id=${id}`;
  // та же заглушка, что в официальном коде счётчика: копит вызовы, пока грузится tag.js
  const ym = function (this: unknown) {
    // eslint-disable-next-line prefer-rest-params
    (ym.a = ym.a || []).push(arguments);
  } as unknown as Ym;
  ym.l = Date.now();
  w.ym = ym;
  w.dataLayer = w.dataLayer || [];
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
  ym(id, "init", {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

export function goal(name: Goal, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !site.metrikaId) return;
  // без согласия ym не существует, и цель просто не отправляется
  (window as YmWindow).ym?.(Number(site.metrikaId), "reachGoal", name, params);
}
