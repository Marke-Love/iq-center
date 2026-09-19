"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Блок уже в зоне видимости или выше неё — показываем сразу
    const check = () => {
      if (el.getBoundingClientRect().top < window.innerHeight - 40) {
        setShown(true);
        return true;
      }
      return false;
    };
    if (check()) return;

    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && setShown(true), { rootMargin: "-40px" });
    io.observe(el);

    // Быстрый скролл или переход по якорю могут «перепрыгнуть» наблюдатель — подстраховываемся
    const onScroll = () => {
      if (check()) cleanup();
    };
    const cleanup = () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return cleanup;
  }, []);

  const visible = shown || reduce;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay: visible ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
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
