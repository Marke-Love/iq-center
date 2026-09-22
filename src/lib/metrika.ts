import { site } from "@/content/site";

type Ym = (id: number, method: string, ...args: unknown[]) => void;

export type Goal = "form_submit" | "click_phone" | "click_cta" | "open_modal" | "click_messenger";

export function goal(name: Goal, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !site.metrikaId) return;
  const ym = (window as unknown as { ym?: Ym }).ym;
  ym?.(Number(site.metrikaId), "reachGoal", name, params);
}
