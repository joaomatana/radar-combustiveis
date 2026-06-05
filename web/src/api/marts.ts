import type {
  DispersaoRow,
  Filtros,
  MartQuery,
  PrecoMedioRow,
  VariacaoRow,
} from "@radar/contracts";
import { apiGet } from "./client";

/** Normaliza MartQuery → params de query (todos opcionais). */
function martParams(q: MartQuery): Record<string, string | number | undefined> {
  return { uf: q.uf, produto: q.produto, ano: q.ano, mes: q.mes };
}

export function fetchFiltros(signal?: AbortSignal): Promise<Filtros> {
  return apiGet<Filtros>("/api/filtros", { signal });
}

export function fetchPrecoMedio(q: MartQuery, signal?: AbortSignal): Promise<PrecoMedioRow[]> {
  return apiGet<PrecoMedioRow[]>("/api/preco-medio", { params: martParams(q), signal });
}

export function fetchVariacao(q: MartQuery, signal?: AbortSignal): Promise<VariacaoRow[]> {
  return apiGet<VariacaoRow[]>("/api/variacao", { params: martParams(q), signal });
}

export function fetchDispersao(q: MartQuery, signal?: AbortSignal): Promise<DispersaoRow[]> {
  return apiGet<DispersaoRow[]>("/api/dispersao", { params: martParams(q), signal });
}
