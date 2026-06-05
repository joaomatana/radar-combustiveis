import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { StateWrapper } from "./StateWrapper";
import { Card } from "./ui/Card";

interface ChartCardProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: "flame" | "petro";
  trailing?: ReactNode;
  loading: boolean;
  error: Error | undefined;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  /** altura do gráfico — parent COM altura fixa exigido pelo ResponsiveContainer. */
  chartHeight?: string;
  className?: string;
  children: ReactNode;
}

/** Card de gráfico: Card + header + StateWrapper + slot de altura fixa p/ o chart. */
export function ChartCard({
  eyebrow,
  title,
  subtitle,
  accent = "flame",
  trailing,
  loading,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
  chartHeight = "h-72",
  className,
  children,
}: ChartCardProps) {
  return (
    <Card accent={accent} className={cn("flex flex-col gap-4", className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {eyebrow}
          </span>
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </header>

      <div className={cn("w-full", chartHeight)}>
        <StateWrapper
          loading={loading}
          error={error}
          isEmpty={isEmpty}
          emptyMessage={emptyMessage}
          onRetry={onRetry}
          minHeight="100%"
        >
          {children}
        </StateWrapper>
      </div>
    </Card>
  );
}
