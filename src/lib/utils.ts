import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Склейка классов в стиле shadcn: последние классы Tailwind перекрывают конфликтующие
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
