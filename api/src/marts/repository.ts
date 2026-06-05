import {
  type DispersaoRow,
  type Filtros,
  type MartQuery,
  type PrecoMedioRow,
  produtoSchema,
  ufSchema,
  type VariacaoRow,
} from "@radar/contracts";
import { query } from "../lib/db";

/** Porta de acesso aos marts (read-only). Implementada por pg; fakeável em teste. */
export interface MartsRepository {
  precoMedio(q: MartQuery): Promise<PrecoMedioRow[]>;
  variacao(q: MartQuery): Promise<VariacaoRow[]>;
  dispersao(q: MartQuery): Promise<DispersaoRow[]>;
  filtros(): Promise<Filtros>;
}

/**
 * Monta o WHERE a partir dos filtros opcionais, SEMPRE parametrizado ($1..$N) —
 * nunca interpola valores na string (anti SQL injection). Os nomes de coluna são
 * literais fixos no código (não vêm do usuário).
 */
function buildWhere(q: MartQuery): { clause: string; params: unknown[] } {
  const cond: string[] = [];
  const params: unknown[] = [];
  if (q.uf !== undefined) {
    params.push(q.uf);
    cond.push(`uf = $${params.length}`);
  }
  if (q.produto !== undefined) {
    params.push(q.produto);
    cond.push(`produto = $${params.length}`);
  }
  if (q.ano !== undefined) {
    params.push(q.ano);
    cond.push(`ano = $${params.length}`);
  }
  if (q.mes !== undefined) {
    params.push(q.mes);
    cond.push(`mes = $${params.length}`);
  }
  return { clause: cond.length > 0 ? `WHERE ${cond.join(" AND ")}` : "", params };
}

const ORDER = "ORDER BY ano, mes, uf, produto";

/** Implementação pg-backed. CASTs explícitos: numeric->::float8, bigint->::int. */
export class PgMartsRepository implements MartsRepository {
  async precoMedio(q: MartQuery): Promise<PrecoMedioRow[]> {
    const { clause, params } = buildWhere(q);
    return query<PrecoMedioRow>(
      `SELECT id, uf, produto, ano, mes,
         preco_medio_venda::float8 AS preco_medio_venda,
         preco_min_venda::float8 AS preco_min_venda,
         preco_max_venda::float8 AS preco_max_venda,
         qtd_coletas::int AS qtd_coletas,
         qtd_municipios::int AS qtd_municipios
       FROM public.mart_preco_medio_uf_mes ${clause} ${ORDER}`,
      params,
    );
  }

  async variacao(q: MartQuery): Promise<VariacaoRow[]> {
    const { clause, params } = buildWhere(q);
    return query<VariacaoRow>(
      `SELECT id, uf, produto, ano, mes,
         preco_medio_venda::float8 AS preco_medio_venda,
         preco_mes_anterior::float8 AS preco_mes_anterior,
         variacao_pct::float8 AS variacao_pct
       FROM public.mart_variacao_preco ${clause} ${ORDER}`,
      params,
    );
  }

  async dispersao(q: MartQuery): Promise<DispersaoRow[]> {
    const { clause, params } = buildWhere(q);
    return query<DispersaoRow>(
      `SELECT id, uf, produto, ano, mes,
         qtd_municipios::int AS qtd_municipios,
         qtd_coletas::int AS qtd_coletas,
         preco_min_venda::float8 AS preco_min_venda,
         preco_max_venda::float8 AS preco_max_venda,
         amplitude_venda::float8 AS amplitude_venda,
         desvio_padrao_municipal::float8 AS desvio_padrao_municipal,
         coef_variacao_pct::float8 AS coef_variacao_pct,
         margem_media::float8 AS margem_media
       FROM public.mart_dispersao_revenda ${clause} ${ORDER}`,
      params,
    );
  }

  async filtros(): Promise<Filtros> {
    const [ufRows, prodRows, perRows] = await Promise.all([
      query<{ uf: string }>("SELECT DISTINCT uf FROM public.mart_preco_medio_uf_mes ORDER BY uf"),
      query<{ produto: string }>(
        "SELECT DISTINCT produto FROM public.mart_preco_medio_uf_mes ORDER BY produto",
      ),
      query<{ ano: number; mes: number }>(
        "SELECT DISTINCT ano, mes FROM public.mart_preco_medio_uf_mes ORDER BY ano, mes",
      ),
    ]);
    // Valida + tipa as listas (dbt já garante via accepted_values; aqui estreita p/ Uf/Produto).
    const ufs = ufSchema.array().parse(ufRows.map((r) => r.uf));
    const produtos = produtoSchema.array().parse(prodRows.map((r) => r.produto));
    const periodos = perRows.map((r) => ({ ano: r.ano, mes: r.mes }));

    const uf0 = ufs[0];
    const prod0 = produtos[0];
    const ultimo = periodos.at(-1);
    const padrao =
      uf0 && prod0 && ultimo
        ? {
            uf: ufs.includes("SP") ? "SP" : uf0,
            produto: produtos.includes("GASOLINA") ? "GASOLINA" : prod0,
            periodo: ultimo,
          }
        : null;

    return { ufs, produtos, periodos, default: padrao };
  }
}
