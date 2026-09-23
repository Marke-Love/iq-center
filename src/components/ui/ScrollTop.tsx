"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // раз в кадр, а не на каждое событие скролла
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setShown(window.scrollY > 700);
      });
    };
    setShown(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Наверх"
      title="Наверх"
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      // над мобильной панелью записи, справа от неё же на десктопе
      className={`fixed right-4 bottom-24 z-40 grid size-12 place-items-center rounded-2xl bg-night text-white shadow-[0_10px_30px_-12px_rgba(16,16,46,0.8)] transition duration-200 hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:size-14 ${
        shown ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
      }`}
    >
      <ArrowUp size={22} />
    </button>
  );
}
