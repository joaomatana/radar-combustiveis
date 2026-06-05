import type { Periodo, Produto, Uf } from "@radar/contracts";
import { useMemo } from "react";
import { fetchPrecoMedio } from "../../api/marts";
import { useAsync } from "../../hooks/useAsync";
import { toRankingUf } from "../../lib/charts";
import { formatPeriodo } from "../../lib/format";
import { ChartCard } from "../ChartCard";
import { RankingUfChart } from "../charts/RankingUfChart";

export function RankingUfCard({
  produto,
  periodo,
  selectedUf,
  className,
}: {
  produto: Produto;
  periodo: Periodo;
  selectedUf: Uf;
  className?: string;
}) {
  const { data, loading, error, reload } = useAsync(
    (signal) => fetchPrecoMedio({ produto, ano: periodo.ano, mes: periodo.mes }, signal),
    [produto, periodo.ano, periodo.mes],
  );
  const ranking = useMemo(() => toRankingUf(data ?? []), [data]);

  return (
    <ChartCard
      eyebrow="Ranking UF"
      title={`${produto} · ${formatPeriodo(periodo.ano, periodo.mes)}`}
      subtitle="Preço médio por UF no período (sua UF em destaque)"
      accent="petro"
      loading={loading}
      error={error}
      isEmpty={ranking.length === 0}
      onRetry={reload}
      chartHeight="h-96"
      className={className}
    >
      <RankingUfChart data={ranking} selectedUf={selectedUf} />
    </ChartCard>
  );
}
