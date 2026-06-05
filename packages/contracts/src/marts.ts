import { z } from "zod";
import { produtoSchema, ufSchema } from "./enums";

/**
 * Linhas dos marts como a API as devolve. A API faz cast numeric/bigint → number
 * no SQL, então todo campo numérico chega como `number`; texto continua `string`.
 * A nulabilidade espelha os modelos dbt (pipeline/dbt/models/marts).
 */

/** mart_preco_medio_uf_mes: preço médio (ponderado) por UF/produto/ano/mês. */
export const precoMedioRowSchema = z.object({
  id: z.string(),
  uf: ufSchema,
  produto: produtoSchema,
  ano: z.number().int(),
  mes: z.number().int(),
  preco_medio_venda: z.number(),
  preco_min_venda: z.number(),
  preco_max_venda: z.number(),
  qtd_coletas: z.number().int(),
  qtd_municipios: z.number().int(),
});

/** mart_variacao_preco: variação % mês a mês (campos nulos no 1º mês da série). */
export const variacaoRowSchema = z.object({
  id: z.string(),
  uf: ufSchema,
  produto: produtoSchema,
  ano: z.number().int(),
  mes: z.number().int(),
  preco_medio_venda: z.number(),
  preco_mes_anterior: z.number().nullable(),
  variacao_pct: z.number().nullable(),
});

/** mart_dispersao_revenda: dispersão dos preços entre municípios. */
export const dispersaoRowSchema = z.object({
  id: z.string(),
  uf: ufSchema,
  produto: produtoSchema,
  ano: z.number().int(),
  mes: z.number().int(),
  qtd_municipios: z.number().int(),
  qtd_coletas: z.number().int(),
  preco_min_venda: z.number(),
  preco_max_venda: z.number(),
  amplitude_venda: z.number(),
  desvio_padrao_municipal: z.number().nullable(),
  coef_variacao_pct: z.number().nullable(),
  margem_media: z.number().nullable(),
});

export type PrecoMedioRow = z.infer<typeof precoMedioRowSchema>;
export type VariacaoRow = z.infer<typeof variacaoRowSchema>;
export type DispersaoRow = z.infer<typeof dispersaoRowSchema>;
