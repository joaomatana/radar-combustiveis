import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../hooks/useTheme";
import { chartColors } from "../../lib/chartColors";
import type { VariacaoPonto } from "../../lib/charts";
import { formatBRL, formatPct } from "../../lib/format";

interface TooltipInjected {
  active?: boolean;
  payload?: Array<{ payload?: VariacaoPonto }>;
}

function VariacaoTooltip({ active, payload }: TooltipInjected) {
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
      <p className="text-sm font-semibold text-fg">{formatPct(p.valor, { sign: true })}</p>
      <p className="mt-1 text-muted">
        {formatBRL(p.preco)} (ant.: {formatBRL(p.precoAnterior)})
      </p>
    </div>
  );
}

/** Variação % mês a mês — barra por sinal (alta=vermelho, baixa=verde). */
export function VariacaoChart({ data }: { data: readonly VariacaoPonto[] }) {
  const { theme } = useTheme();
  const c = chartColors(theme === "dark");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data as VariacaoPonto[]} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
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
        <ReferenceLine y={0} stroke={c.axis} />
        <Tooltip content={<VariacaoTooltip />} cursor={{ fill: c.grid, fillOpacity: 0.3 }} />
        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
          {data.map((p) => (
            <Cell
              key={`${p.ano}-${p.mes}`}
              fill={p.valor == null ? "transparent" : p.valor > 0 ? c.up : c.down}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
