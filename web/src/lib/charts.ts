import type { DispersaoRow, PrecoMedioRow, VariacaoRow } from "@radar/contracts";
import { formatPeriodo } from "./format";

/** Ponto base de série temporal: rótulo do período + valor (null = lacuna no gráfico). */
export interface SeriePonto {
  periodo: string;
  ano: number;
  mes: number;
  valor: number | null;
}

/** Ponto de preço médio com banda min/max. `bandaDelta` = max − min (altura da banda). */
export interface PrecoPonto extends SeriePonto {
  min: number;
  max: number;
  bandaDelta: number;
  qtdMunicipios: number;
  qtdColetas: number;
}

/** Linhas (já ordenadas por ano,mes na API) → série de preço médio com banda. */
export function toPrecoSerie(rows: readonly PrecoMedioRow[]): PrecoPonto[] {
  return rows.map((r) => ({
    periodo: formatPeriodo(r.ano, r.mes),
    ano: r.ano,
    mes: r.mes,
    valor: r.preco_medio_venda,
    min: r.preco_min_venda,
    max: r.preco_max_venda,
    // Emite o DELTA (não o max cru): a banda é desenhada empilhando min + bandaDelta.
    bandaDelta: r.preco_max_venda - r.preco_min_venda,
    qtdMunicipios: r.qtd_municipios,
    qtdColetas: r.qtd_coletas,
  }));
}

export interface VariacaoPonto extends SeriePonto {
  precoAnterior: number | null;
  preco: number;
}

export function toVariacaoSerie(rows: readonly VariacaoRow[]): VariacaoPonto[] {
  return rows.map((r) => ({
    periodo: formatPeriodo(r.ano, r.mes),
    ano: r.ano,
    mes: r.mes,
    valor: r.variacao_pct,
    precoAnterior: r.preco_mes_anterior,
    preco: r.preco_medio_venda,
  }));
}

/** true quando toda a série de variação é nula (ex.: só existe o 1º mês). */
export function variacaoVazia(serie: readonly VariacaoPonto[]): boolean {
  return serie.every((p) => p.valor === null);
}

export interface DispersaoPonto extends SeriePonto {
  amplitude: number;
  desvio: number | null;
  precoMin: number;
  precoMax: number;
}

export function toDispersaoSerie(rows: readonly DispersaoRow[]): DispersaoPonto[] {
  return rows.map((r) => ({
    periodo: formatPeriodo(r.ano, r.mes),
    ano: r.ano,
    mes: r.mes,
    valor: r.coef_variacao_pct,
    amplitude: r.amplitude_venda,
    desvio: r.desvio_padrao_municipal,
    precoMin: r.preco_min_venda,
    precoMax: r.preco_max_venda,
  }));
}

/** Ranking de UFs: preço médio por UF (produto+período). Ordena ascendente. */
export interface RankingPonto {
  uf: string;
  valor: number;
  min: number;
  max: number;
}

export function toRankingUf(rows: readonly PrecoMedioRow[]): RankingPonto[] {
  return rows
    .map((r) => ({
      uf: r.uf,
      valor: r.preco_medio_venda,
      min: r.preco_min_venda,
      max: r.preco_max_venda,
    }))
    .sort((a, b) => a.valor - b.valor);
}

/** Domínio Y com folga de ~6% p/ a série não encostar nas bordas. */
export function precoDominio(pontos: readonly { min: number; max: number }[]): [number, number] {
  if (pontos.length === 0) {
    return [0, 1];
  }
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const p of pontos) {
    if (p.min < lo) lo = p.min;
    if (p.max > hi) hi = p.max;
  }
  const pad = (hi - lo) * 0.06 || hi * 0.06 || 0.1;
  return [Math.max(0, lo - pad), hi + pad];
}
