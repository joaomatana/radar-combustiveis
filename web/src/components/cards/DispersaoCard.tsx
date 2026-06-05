import type { Produto, Uf } from "@radar/contracts";
import { useMemo } from "react";
import { fetchDispersao } from "../../api/marts";
import { useAsync } from "../../hooks/useAsync";
import { toDispersaoSerie } from "../../lib/charts";
import { ChartCard } from "../ChartCard";
import { DispersaoChart } from "../charts/DispersaoChart";

export function DispersaoCard({
  uf,
  produto,
  className,
}: {
  uf: Uf;
  produto: Produto;
  className?: string;
}) {
  const { data, loading, error, reload } = useAsync(
    (signal) => fetchDispersao({ uf, produto }, signal),
    [uf, produto],
  );
  const serie = useMemo(() => toDispersaoSerie(data ?? []), [data]);
  const semDispersao = serie.length === 0 || serie.every((p) => p.valor === null);

  return (
    <ChartCard
      eyebrow="Dispersão"
      title={`${produto} · ${uf}`}
      subtitle="Coef. de variação dos preços entre municípios"
      accent="petro"
      loading={loading}
      error={error}
      isEmpty={semDispersao}
      emptyMessage="Sem dispersão calculável (precisa de ≥2 municípios)."
      onRetry={reload}
      chartHeight="h-72"
      className={className}
    >
      <DispersaoChart data={serie} />
    </ChartCard>
  );
}
