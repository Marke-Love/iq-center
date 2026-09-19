"use client";

import { ArrowRight, Phone } from "lucide-react";
import { site } from "@/content/site";
import { goal } from "@/lib/metrika";
import { useLead } from "./LeadProvider";

type Props = {
  children: React.ReactNode;
  source: string;
  subject?: string;
  exam?: string;
  variant?: "primary" | "ink" | "ghost" | "marker";
  className?: string;
};

const styles = {
  primary: "bg-check text-white shadow-[0_12px_30px_-12px_var(--color-check)] hover:brightness-105",
  ink: "bg-ink text-white shadow-[0_12px_30px_-12px_var(--color-ink)] hover:bg-ink-deep",
  marker: "bg-marker text-night hover:brightness-95",
  ghost: "border-2 border-text/15 bg-white/60 text-text hover:border-ink hover:text-ink",
};

export function CtaButton({ children, source, subject, exam, variant = "primary", className = "" }: Props) {
  const open = useLead();
  return (
    <button
      type="button"
      onClick={() => {
        goal("click_cta", { source });
        open({ source, subject, exam });
      }}
      className={`group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 font-display text-[15px] font-bold transition hover:-translate-y-0.5 ${styles[variant]} ${className}`}
    >
      {children}
      <ArrowRight size={19} className="transition group-hover:translate-x-1" />
    </button>
  );
}

export function PhoneLink({ className = "", withIcon = true }: { className?: string; withIcon?: boolean }) {
  return (
    <a href={site.phoneHref} onClick={() => goal("click_phone")} className={`inline-flex items-center gap-2 whitespace-nowrap ${className}`}>
      {withIcon && <Phone size={17} />}
      {site.phone}
    </a>
  );
}
