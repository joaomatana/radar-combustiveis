/** Contratos compartilhados do radar-combustiveis (api ↔ web). */

/** Resposta de GET /health. */
export interface HealthResponse {
  readonly status: "ok";
}

// STAGE 1: placeholders dos marts; preenchidos quando a camada analítica existir.

/** Preço médio por UF e mês (mart_preco_medio_uf_mes). */
export interface MartPrecoMedioUfMes {
  readonly _placeholder?: never;
}

/** Variação de preço entre períodos (mart_variacao_preco). */
export interface MartVariacaoPreco {
  readonly _placeholder?: never;
}

/** Dispersão de preço entre revendas (mart_dispersao_revenda). */
export interface MartDispersaoRevenda {
  readonly _placeholder?: never;
}
