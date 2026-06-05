import { z } from "zod";

/** Produtos acompanhados pela ANP (rótulos exatos da série mensal). */
export const PRODUTOS = [
  "GASOLINA",
  "GASOLINA ADITIVADA",
  "ETANOL",
  "DIESEL",
  "DIESEL S10",
  "GNV",
  "GLP",
] as const;

/** Unidades federativas do Brasil (27). */
export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

/** Macrorregiões do IBGE. */
export const REGIOES = ["N", "NE", "CO", "SE", "S"] as const;

export const produtoSchema = z.enum(PRODUTOS);
export const ufSchema = z.enum(UFS);
export const regiaoSchema = z.enum(REGIOES);

export type Produto = z.infer<typeof produtoSchema>;
export type Uf = z.infer<typeof ufSchema>;
export type Regiao = z.infer<typeof regiaoSchema>;
