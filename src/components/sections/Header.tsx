"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { CtaButton, PhoneLink } from "../ui/CtaButton";

const nav = [
  { href: "#subjects", label: "Предметы" },
  { href: "#prices", label: "Цены" },
  { href: "#faq", label: "Вопросы" },
  { href: "#contacts", label: "Контакты" },
];

export function Logo({ light }: { light?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label={`${site.name} — наверх`}>
      <span className="grid size-10 place-items-center rounded-xl bg-ink font-mono text-sm font-bold text-marker">IQ</span>
      <span className="leading-none whitespace-nowrap">
        <span className={`block font-display text-[15px] font-bold ${light ? "text-white" : ""}`}>{site.name}</span>
        <span className={`mt-1 block text-xs ${light ? "text-white/60" : "text-muted"}`}>{site.tagline}</span>
      </span>
    </a>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // раз в кадр, иначе состояние пересчитывается на каждое событие скролла
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 12);
      });
    };
    setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-grid bg-paper/95" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-[15px] font-medium lg:flex" aria-label="Основное меню">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="text-muted transition hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden md:block">
            <PhoneLink className="font-display text-sm font-bold" />
          </span>
          <span className="hidden sm:block">
            <CtaButton source="header" variant="ink" className="min-h-11! px-5! text-sm!">
              Записаться
            </CtaButton>
          </span>
          <button
            className="grid size-11 place-items-center rounded-xl bg-white lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-grid px-4 pt-2 pb-6 lg:hidden" aria-label="Мобильное меню">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block border-b border-grid py-3.5 font-display font-bold">
              {n.label}
            </a>
          ))}
          <PhoneLink className="mt-5 font-display text-lg font-bold text-ink" />
        </nav>
      )}
    </header>
  );
}
