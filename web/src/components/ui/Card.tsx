import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Accent = "flame" | "petro";

interface CardProps {
  accent?: Accent;
  className?: string;
  children: ReactNode;
}

const accentRule: Record<Accent, string> = {
  flame: "border-t-flame-500",
  petro: "border-t-petro-600",
};

/** Superfície base: borda fina, canto arredondado, régua de acento no topo. */
export function Card({ accent = "flame", className, children }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border border-t-2 bg-surface p-5 shadow-sm",
        "transition-colors hover:border-fg/15 dark:shadow-none",
        accentRule[accent],
        className,
      )}
    >
      {children}
    </section>
  );
}
