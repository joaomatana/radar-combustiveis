import type { Produto, Uf } from "@radar/contracts";
import { useMemo } from "react";
import { fetchPrecoMedio } from "../../api/marts";
import { useAsync } from "../../hooks/useAsync";
import { toPrecoSerie } from "../../lib/charts";
import { ChartCard } from "../ChartCard";
import { PrecoMedioChart } from "../charts/PrecoMedioChart";

export function PrecoMedioCard({
  uf,
  produto,
  className,
}: {
  uf: Uf;
  produto: Produto;
  className?: string;
}) {
  const { data, loading, error, reload } = useAsync(
    (signal) => fetchPrecoMedio({ uf, produto }, signal),
    [uf, produto],
  );
  const serie = useMemo(() => toPrecoSerie(data ?? []), [data]);

  return (
    <ChartCard
      eyebrow="Preço médio"
      title={`${produto} · ${uf}`}
      subtitle="Média de venda ao longo do tempo (faixa min–max)"
      accent="flame"
      loading={loading}
      error={error}
      isEmpty={serie.length === 0}
      onRetry={reload}
      chartHeight="h-72 lg:h-80"
      className={className}
    >
      <PrecoMedioChart data={serie} />
    </ChartCard>
  );
}
