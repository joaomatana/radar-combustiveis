import type { Produto, Uf } from "@radar/contracts";
import { useMemo } from "react";
import { fetchVariacao } from "../../api/marts";
import { useAsync } from "../../hooks/useAsync";
import { toVariacaoSerie, variacaoVazia } from "../../lib/charts";
import { ChartCard } from "../ChartCard";
import { VariacaoChart } from "../charts/VariacaoChart";
import { TrendChip } from "../ui/TrendChip";

export function VariacaoCard({
  uf,
  produto,
  className,
}: {
  uf: Uf;
  produto: Produto;
  className?: string;
}) {
  const { data, loading, error, reload } = useAsync(
    (signal) => fetchVariacao({ uf, produto }, signal),
    [uf, produto],
  );
  const serie = useMemo(() => toVariacaoSerie(data ?? []), [data]);
  const ultima = serie.at(-1)?.valor ?? null;

  return (
    <ChartCard
      eyebrow="Variação m/m"
      title={`${produto} · ${uf}`}
      subtitle="Variação % do preço médio vs. mês anterior"
      accent="flame"
      trailing={<TrendChip value={ultima} />}
      loading={loading}
      error={error}
      isEmpty={serie.length === 0 || variacaoVazia(serie)}
      emptyMessage="Sem mês anterior para comparar."
      onRetry={reload}
      chartHeight="h-72"
      className={className}
    >
      <VariacaoChart data={serie} />
    </ChartCard>
  );
}
