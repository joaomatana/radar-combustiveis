import type { Filtros, Periodo, Produto, Uf } from "@radar/contracts";
import { useMemo, useState } from "react";
import { fetchFiltros } from "../api/marts";
import { useAsync } from "../hooks/useAsync";
import { DispersaoCard } from "./cards/DispersaoCard";
import { PrecoMedioCard } from "./cards/PrecoMedioCard";
import { RankingUfCard } from "./cards/RankingUfCard";
import { VariacaoCard } from "./cards/VariacaoCard";
import { FilterBar } from "./FilterBar";
import { StateWrapper } from "./StateWrapper";

export interface Selection {
  uf: Uf;
  produto: Produto;
  periodo: Periodo;
}

/** Seleção inicial de filtros.default, com fallback p/ o 1º item de cada domínio. */
function initialSelection(f: Filtros): Selection | null {
  if (f.default) {
    return { uf: f.default.uf, produto: f.default.produto, periodo: f.default.periodo };
  }
  const uf = f.ufs[0];
  const produto = f.produtos[0];
  const periodo = f.periodos.at(-1);
  if (uf && produto && periodo) {
    return { uf, produto, periodo };
  }
  return null;
}

/** Container: busca /api/filtros, semeia a seleção e renderiza a barra + os cards. */
export function Dashboard() {
  const filtros = useAsync<Filtros>((signal) => fetchFiltros(signal), []);

  return (
    <StateWrapper
      loading={filtros.loading}
      error={filtros.error}
      onRetry={filtros.reload}
      minHeight="60vh"
    >
      {filtros.data ? <DashboardReady filtros={filtros.data} /> : null}
    </StateWrapper>
  );
}

/** Subcomponente com filtros já carregados (mantém os hooks fora do branch async). */
function DashboardReady({ filtros }: { filtros: Filtros }) {
  const seed = useMemo(() => initialSelection(filtros), [filtros]);
  const [selection, setSelection] = useState<Selection | null>(seed);

  if (!selection) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-lg font-semibold text-fg">Sem dados ainda</h2>
        <p className="max-w-sm text-sm text-muted">
          Os marts ainda não têm preços publicados. Rode o pipeline de ELT da ANP e atualize a
          página.
        </p>
      </div>
    );
  }

  const { uf, produto, periodo } = selection;

  return (
    <div className="flex flex-col gap-6">
      <FilterBar filtros={filtros} selection={selection} onChange={setSelection} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
        <PrecoMedioCard uf={uf} produto={produto} className="lg:col-span-8" />
        <VariacaoCard uf={uf} produto={produto} className="lg:col-span-4" />
        <DispersaoCard uf={uf} produto={produto} className="md:col-span-2 lg:col-span-6" />
        <RankingUfCard
          produto={produto}
          periodo={periodo}
          selectedUf={uf}
          className="md:col-span-2 lg:col-span-6"
        />
      </div>
    </div>
  );
}
