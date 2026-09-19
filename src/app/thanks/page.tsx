import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Заявка принята | " + site.name, robots: { index: false } };

export default function Thanks() {
  return (
    <main className="bg-grid grid min-h-svh place-items-center px-4 py-16">
      <div className="w-full max-w-lg rounded-[32px] bg-white p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
        <div className="mx-auto w-fit rotate-[-6deg] rounded-2xl border-[3px] border-check px-5 py-2 text-check">
          <p className="font-display text-sm font-bold tracking-wider uppercase">Заявка принята</p>
        </div>
        <h1 className="mt-8 font-display text-3xl leading-tight font-bold">Спасибо! Скоро перезвоним</h1>
        <p className="mt-4 text-lg text-muted">
          Администратор свяжется с вами в течение 15 минут в рабочее время ({site.hours.toLowerCase()}) и подберёт дату пробника.
        </p>
        <p className="mt-6 text-muted">
          Срочный вопрос? <a href={site.phoneHref} className="font-bold text-ink">{site.phone}</a>
        </p>
        <a href="/" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-6 font-display text-sm font-bold text-white">
          <ArrowLeft size={18} /> На главную
        </a>
      </div>
    </main>
  );
}
