import { cn } from "../../lib/cn";

/** Bloco de carregamento com shimmer. Cor neutra que serve light/dark. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-fg/10", className)} aria-hidden="true" />;
}
