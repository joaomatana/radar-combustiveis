import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../hooks/useTheme";
import { chartColors } from "../../lib/chartColors";
import type { DispersaoPonto } from "../../lib/charts";
import { formatBRL, formatPct } from "../../lib/format";

interface TooltipInjected {
  active?: boolean;
  payload?: Array<{ payload?: DispersaoPonto }>;
}

function DispersaoTooltip({ active, payload }: TooltipInjected) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const p = payload[0]?.payload;
  if (!p) {
    return null;
  }
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-mono uppercase tracking-wide text-muted">{p.periodo}</p>
      <p className="text-sm font-semibold text-fg">coef. var. {formatPct(p.valor)}</p>
      <p className="mt-1 text-muted">
        amplitude {formatBRL(p.amplitude)} · faixa {formatBRL(p.precoMin)}–{formatBRL(p.precoMax)}
      </p>
    </div>
  );
}

/** Dispersão dos preços entre municípios (coef. de variação % ao longo do tempo). */
export function DispersaoChart({ data }: { data: readonly DispersaoPonto[] }) {
  const { theme } = useTheme();
  const c = chartColors(theme === "dark");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data as DispersaoPonto[]} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="dispGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.petro} stopOpacity={0.35} />
            <stop offset="100%" stopColor={c.petro} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="periodo"
          stroke={c.axis}
          tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={{ stroke: c.grid }}
        />
        <YAxis
          stroke={c.axis}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => formatPct(v)}
        />
        <Tooltip content={<DispersaoTooltip />} cursor={{ stroke: c.petro, strokeOpacity: 0.4 }} />
        <Area
          type="monotone"
          dataKey="valor"
          stroke={c.petro}
          strokeWidth={2}
          fill="url(#dispGrad)"
          connectNulls={false}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
