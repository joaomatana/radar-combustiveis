import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../hooks/useTheme";
import { chartColors } from "../../lib/chartColors";
import type { RankingPonto } from "../../lib/charts";
import { formatBRL } from "../../lib/format";

interface TooltipInjected {
  active?: boolean;
  payload?: Array<{ payload?: RankingPonto }>;
}

function RankingTooltip({ active, payload }: TooltipInjected) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const r = payload[0]?.payload;
  if (!r) {
    return null;
  }
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-mono font-semibold text-fg">{r.uf}</p>
      <p className="text-sm font-semibold text-fg">{formatBRL(r.valor)}</p>
      <p className="mt-1 text-muted">
        faixa {formatBRL(r.min)} – {formatBRL(r.max)}
      </p>
    </div>
  );
}

/** Ranking de preço médio por UF (cross-section) — UF selecionada destacada em âmbar. */
export function RankingUfChart({
  data,
  selectedUf,
}: {
  data: readonly RankingPonto[];
  selectedUf: string;
}) {
  const { theme } = useTheme();
  const c = chartColors(theme === "dark");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data as RankingPonto[]}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          stroke={c.axis}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatBRL(v)}
        />
        <YAxis
          type="category"
          dataKey="uf"
          stroke={c.axis}
          tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<RankingTooltip />} cursor={{ fill: c.grid, fillOpacity: 0.3 }} />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
          {data.map((r) => (
            <Cell key={r.uf} fill={r.uf === selectedUf ? c.flame : c.petro} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
