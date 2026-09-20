import { site } from "@/content/site";

// Близость метро — сильный аргумент, поэтому у неё собственный бейдж фирменным цветом.
export function MetroBadge({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-full bg-marker px-3.5 py-2 text-sm font-bold text-night shadow-sm ${className}`}>
      <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-night font-display text-[11px] leading-none text-marker">
        М
      </span>
      <span>
        {site.metroName} — <span className="whitespace-nowrap">{site.metroWalk}</span>
      </span>
    </p>
  );
}
