"use client";

import { CircleHelp, FileText, MapPin, Menu, MessagesSquare, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { CtaButton, PhoneLink } from "../ui/CtaButton";
import NavigationMenuWithActiveItem, { type NavItem } from "../ui/navigation-menu-05";

const nav: NavItem[] = [
  { href: "#why", title: "Зачем пробник", icon: CircleHelp },
  { href: "#result", title: "Что получите", icon: FileText },
  { href: "#prices", title: "Стоимость", icon: Wallet },
  { href: "#faq", title: "Вопросы", icon: MessagesSquare },
  { href: "#contacts", title: "Контакты", icon: MapPin },
];

// Подсвечиваем пункт меню того блока, который сейчас перед глазами
function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const els = nav.map((n) => document.querySelector(n.href)).filter((el): el is Element => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive("#" + hit.target.id);
      },
      // «текущий» блок — тот, что пересекает полосу чуть ниже шапки
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const onTop = () => window.scrollY < 200 && setActive("");
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onTop);
    };
  }, []);
  return active;
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label={`${site.tagline}, наверх`}>
      <span className="grid size-10 place-items-center rounded-xl bg-ink font-mono text-sm font-bold text-marker">IQ</span>
      <span className={`font-display text-[15px] leading-[1.15] font-bold ${light ? "text-white" : ""}`}>
        Пробные
        <br />
        <span className={light ? "text-marker" : "text-ink"}>ЕГЭ и ОГЭ</span>
      </span>
    </a>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection();

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
        open ? "border-b border-grid bg-paper" : scrolled ? "border-b border-grid bg-paper/95" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <NavigationMenuWithActiveItem items={nav} active={active} className="hidden lg:flex" />
        <div className="flex items-center gap-3">
          <span className="hidden md:block lg:hidden xl:block">
            <PhoneLink className="font-display text-sm font-bold" />
          </span>
          <span className="hidden sm:block">
            <CtaButton source="header" className="min-h-11! px-5! text-sm!">
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
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={active === n.href ? "true" : undefined}
              className={`flex items-center gap-3 border-b border-grid py-3.5 font-display font-bold ${active === n.href ? "text-ink" : ""}`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                  active === n.href ? "bg-check text-white" : "bg-ink-soft text-ink"
                }`}
              >
                <n.icon size={18} />
              </span>
              {n.title}
            </a>
          ))}
          <PhoneLink className="mt-5 font-display text-lg font-bold text-ink" />
        </nav>
      )}
    </header>
  );
}
