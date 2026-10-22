import { faq, pricing, site, subjects } from "@/content/site";

export const dynamic = "force-static";

// Краткая справка о центре для нейросетей (llmstxt.org). Собирается из site.ts при сборке,
// поэтому цена, адрес и предметы всегда совпадают с сайтом.
export function GET() {
  const subjectLines = (["ЕГЭ", "ОГЭ"] as const)
    .map(
      (exam) =>
        `### ${exam}\n` +
        subjects[exam].map((s) => `- ${s.name}: ${s.duration}${s.note ? ` (${s.note})` : ""}`).join("\n"),
    )
    .join("\n\n");

  const body = `# ${site.name} — пробные ЕГЭ и ОГЭ в ${site.city === "Санкт-Петербург" ? "Санкт-Петербурге" : site.city}

> Очные пробные экзамены ЕГЭ и ОГЭ в условиях, приближенных к реальному экзамену: регламент, бланки, рассадка по одному, точное время. Работы проверяют эксперты по критериям ФИПИ, ученик получает баллы и разбор ошибок.

## Главное
- Формат: только очно, в аудитории центра. Онлайн-пробники не проводятся.
- Адрес: ${site.city}, ${site.address}, ${site.landmark}.
- Метро: ${site.metroName}, ${site.metroWalk}.
- Часы работы: ${site.hours}.
- Телефон для записи: ${site.phone}.
- Стоимость: ${pricing.price} ₽ ${pricing.unit}. ${pricing.note}

## Что входит в пробник
${pricing.features.map((f) => `- ${f}`).join("\n")}

## Предметы и длительность
${subjectLines}

## Частые вопросы
${faq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}

## Ссылки
- [Главная страница и запись](${site.url}/)
- [Политика обработки персональных данных](${site.url}/privacy/)
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
