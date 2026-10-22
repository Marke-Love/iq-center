import { site } from "@/content/site";
import { MetroIcon } from "../ui/MetroIcon";

// Близость метро — сильный аргумент, поэтому у неё собственный бейдж фирменным цветом.
export function MetroBadge({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-full bg-marker px-3.5 py-2 text-sm font-bold text-night shadow-sm ${className}`}>
      <MetroIcon className="size-5" />
      <span>
        {site.metroName}, <span className="whitespace-nowrap">{site.metroWalk}</span>
      </span>
    </p>
  );
}
