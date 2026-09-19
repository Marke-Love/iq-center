"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollTop() {
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {shown && (
        <motion.button
          type="button"
          aria-label="Наверх"
          title="Наверх"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          // над мобильной панелью записи, справа от неё же на десктопе
          className="fixed right-4 bottom-24 z-40 grid size-12 place-items-center rounded-2xl bg-night/90 text-white shadow-[0_10px_30px_-12px_rgba(16,16,46,0.8)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-night sm:right-6 sm:bottom-6 sm:size-14"
        >
          <ArrowUp size={22} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
