import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes condicionais (clsx) e resolve conflitos do Tailwind (twMerge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
