"use client";

import { useEffect, useRef, useState } from "react";

/*
  Появление блоков при скролле.
  Раньше здесь были framer-motion и свой слушатель скролла на каждый блок — на странице
  их полтора десятка, и каждый на каждом кадре скролла звал getBoundingClientRect.
  Теперь: одно общее наблюдение за всеми блоками + анимация средствами CSS.
*/

type Cb = () => void;
const pending = new Map<Element, Cb>();
let io: IntersectionObserver | null = null;
let rafScheduled = false;

function reveal(el: Element) {
  const cb = pending.get(el);
  if (!cb) return;
  pending.delete(el);
  io?.unobserve(el);
  cb();
  if (!pending.size) stopFallback();
}

// Быстрый скролл может «перепрыгнуть» наблюдатель, поэтому раз в кадр досматриваем остальные
function onScroll() {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    const h = window.innerHeight - 40;
    for (const el of [...pending.keys()]) {
      if (el.getBoundingClientRect().top < h) reveal(el);
    }
  });
}

function startFallback() {
  window.addEventListener("scroll", onScroll, { passive: true });
}

function stopFallback() {
  window.removeEventListener("scroll", onScroll);
}

function observe(el: Element, cb: Cb) {
  io ??= new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && reveal(e.target)),
    { rootMargin: "-40px" },
  );
  if (!pending.size) startFallback();
  pending.set(el, cb);
  io.observe(el);
}

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight - 40) {
      setShown(true);
      return;
    }
    observe(el, () => setShown(true));
    return () => {
      pending.delete(el);
      io?.unobserve(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className ?? ""}`}
      style={shown && delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

export function SectionHead({ eyebrow, title, lead, dark }: { eyebrow: string; title: React.ReactNode; lead?: string; dark?: boolean }) {
  return (
    <Reveal className="max-w-3xl">
      <p className={`eyebrow ${dark ? "text-marker" : "text-check"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-3xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl ${dark ? "text-white" : ""}`}>
        {title}
      </h2>
      {lead && <p className={`mt-4 text-lg text-pretty ${dark ? "text-white/70" : "text-muted"}`}>{lead}</p>}
    </Reveal>
  );
}
