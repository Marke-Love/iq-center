"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { site, subjects, type Exam } from "@/content/site";
import { goal } from "@/lib/metrika";
import { readUtm } from "@/lib/utm";

function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = "+7";
  if (p.length) out += " (" + p.slice(0, 3);
  if (p.length >= 3) out += ")";
  if (p.length > 3) out += " " + p.slice(3, 6);
  if (p.length > 6) out += "-" + p.slice(6, 8);
  if (p.length > 8) out += "-" + p.slice(8, 10);
  return out;
}

type Props = { defaultSubject?: string; defaultExam?: string; source: string; dark?: boolean };

export function LeadForm({ defaultSubject, defaultExam, source, dark }: Props) {
  const id = useId();
  const [exam, setExam] = useState<Exam>(defaultExam === "ОГЭ" ? "ОГЭ" : "ЕГЭ");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 11) {
      setStatus("error");
      setError("Введите номер полностью: 10 цифр после +7.");
      return;
    }
    if (!form.get("consent")) {
      setStatus("error");
      setError("Отметьте согласие на обработку персональных данных.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/send.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone,
          exam,
          subject: form.get("subject"),
          website: form.get("website"),
          source,
          page: window.location.href,
          utm: readUtm(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "send_failed");
      goal("form_submit", { source, exam });
      window.location.href = "/thanks/";
    } catch {
      setStatus("error");
      setError(`Не удалось отправить заявку. Позвоните нам: ${site.phone}`);
    }
  }

  const field = dark
    ? "w-full rounded-2xl border-2 border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/40 outline-none transition focus:border-marker"
    : "w-full rounded-2xl border-2 border-grid bg-paper px-4 py-3.5 text-text placeholder:text-muted/60 outline-none transition focus:border-ink";
  const label = dark ? "mb-1.5 block text-sm font-medium text-white/70" : "mb-1.5 block text-sm font-medium text-muted";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {/* honeypot для ботов */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div role="radiogroup" aria-label="Экзамен" className={`grid grid-cols-2 gap-1 rounded-2xl p-1 ${dark ? "bg-white/10" : "bg-paper"}`}>
        {(["ЕГЭ", "ОГЭ"] as Exam[]).map((x) => (
          <button
            key={x}
            type="button"
            role="radio"
            aria-checked={exam === x}
            onClick={() => setExam(x)}
            className={`min-h-11 rounded-xl px-1 font-display text-[13px] font-bold whitespace-nowrap transition sm:text-sm ${
              exam === x ? "bg-ink text-white shadow" : dark ? "text-white/70 hover:text-white" : "text-muted hover:text-text"
            }`}
          >
            {x} · {x === "ЕГЭ" ? "11 кл." : "9 кл."}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor={`${id}-name`} className={label}>Имя</label>
        <input id={`${id}-name`} name="name" autoComplete="name" placeholder="Как к вам обращаться" className={field} maxLength={80} />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className={label}>Телефон</label>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+7 (___) ___-__-__"
          value={phone}
          onChange={(e) => setPhone(e.target.value ? formatPhone(e.target.value) : "")}
          className={field}
        />
      </div>
      <div>
        <label htmlFor={`${id}-subject`} className={label}>Предмет</label>
        <select
          id={`${id}-subject`}
          name="subject"
          key={exam}
          defaultValue={subjects[exam].some((s) => s.name === defaultSubject) ? defaultSubject : ""}
          className={`${field} appearance-none`}
        >
          <option value="">Пока не решили</option>
          {subjects[exam].map((s) => (
            <option key={s.name} value={s.name} className="text-text">{s.name}</option>
          ))}
          <option value="Несколько предметов" className="text-text">Несколько предметов</option>
        </select>
      </div>

      <label className={`flex items-start gap-3 text-sm ${dark ? "text-white/70" : "text-muted"}`}>
        <input type="checkbox" name="consent" className="mt-0.5 size-5 shrink-0 accent-ink" />
        <span>
          Соглашаюсь на обработку персональных данных в соответствии с{" "}
          <a href="/privacy/" target="_blank" className="underline underline-offset-2">политикой конфиденциальности</a>
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-check px-6 font-display text-base font-bold text-white shadow-[0_10px_30px_-10px_var(--color-check)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-70"
      >
        {status === "sending" ? <Loader2 className="animate-spin" size={20} /> : null}
        {status === "sending" ? "Отправляем…" : "Записаться"}
        {status !== "sending" && <ArrowRight size={20} className="transition group-hover:translate-x-1" />}
      </button>

      <p role="alert" aria-live="polite" className={`min-h-5 text-sm font-medium ${dark ? "text-marker" : "text-check"}`}>
        {status === "error" ? error : ""}
      </p>
    </form>
  );
}
