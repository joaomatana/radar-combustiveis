import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatPct } from "../../lib/format";

/**
 * Selo de tendência: alta=vermelho / baixa=verde (convenção BR de combustível —
 * preço subindo = ruim). null/zero = neutro.
 */
export function TrendChip({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="font-mono text-xs text-muted">—</span>;
  }
  const up = value > 0;
  const down = value < 0;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium",
        up && "bg-up/10 text-up",
        down && "bg-down/10 text-down",
        !up && !down && "bg-fg/10 text-muted",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {formatPct(value, { sign: true })}
    </span>
  );
}
