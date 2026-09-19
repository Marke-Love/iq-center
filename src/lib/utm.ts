const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"];
const STORAGE = "iq_utm";

// Сохраняем метки из первого URL сессии, чтобы они дошли до заявки даже после переходов.
export function captureUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const k of KEYS) {
      const v = params.get(k);
      if (v) found[k] = v.slice(0, 200);
    }
    if (Object.keys(found).length) sessionStorage.setItem(STORAGE, JSON.stringify(found));
  } catch {}
}

export function readUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE) || "{}");
  } catch {
    return {};
  }
}
