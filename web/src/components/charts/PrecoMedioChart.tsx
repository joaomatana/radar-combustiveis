import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../hooks/useTheme";
import { chartColors } from "../../lib/chartColors";
import { type PrecoPonto, precoDominio } from "../../lib/charts";
import { formatBRL } from "../../lib/format";

/** Props injetadas pelo Recharts no content do Tooltip (tipagem local, robusta entre versões). */
interface TooltipInjected {
  active?: boolean;
  payload?: Array<{ payload?: PrecoPonto }>;
}

function PrecoTooltip({ active, payload }: TooltipInjected) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const ponto = payload[0]?.payload;
  if (!ponto) {
    return null;
  }
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-mono uppercase tracking-wide text-muted">{ponto.periodo}</p>
      <p className="text-sm font-semibold text-fg">{formatBRL(ponto.valor)}</p>
      <p className="mt-1 text-muted">
        faixa {formatBRL(ponto.min)} – {formatBRL(ponto.max)}
      </p>
      <p className="text-muted">
        {ponto.qtdMunicipios} municípios · {ponto.qtdColetas} coletas
      </p>
    </div>
  );
}

/** Preço médio ao longo do tempo (linha âmbar) + banda min/max (área empilhada). */
export function PrecoMedioChart({ data }: { data: readonly PrecoPonto[] }) {
  const { theme } = useTheme();
  const c = chartColors(theme === "dark");
  const dominio = precoDominio(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data as PrecoPonto[]} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="precoBanda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.flame} stopOpacity={0.18} />
            <stop offset="100%" stopColor={c.flame} stopOpacity={0.02} />
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
          domain={dominio}
          stroke={c.axis}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v: number) => formatBRL(v)}
        />
        <Tooltip
          content={<PrecoTooltip />}
          cursor={{ stroke: c.flame, strokeOpacity: 0.4, strokeWidth: 1 }}
        />
        {/* Banda: base transparente em `min` + área visível de altura `bandaDelta` (= max−min). */}
        <Area
          type="monotone"
          dataKey="min"
          stroke="none"
          fill="transparent"
          stackId="banda"
          isAnimationActive={false}
          legendType="none"
        />
        <Area
          type="monotone"
          dataKey="bandaDelta"
          stroke="none"
          fill="url(#precoBanda)"
          stackId="banda"
          isAnimationActive={false}
          legendType="none"
        />
        <Line
          type="monotone"
          dataKey="valor"
          name="Preço médio"
          stroke={c.flame}
          strokeWidth={2.5}
          dot={{ r: 3, fill: c.flame, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
          animationDuration={600}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
