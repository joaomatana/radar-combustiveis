import { z } from "zod";
import { produtoSchema, ufSchema } from "./enums";

/**
 * Query params compartilhados pelos endpoints de marts. Chegam como string na
 * URL → z.coerce.number() para ano/mes. Todos opcionais (ausência = sem filtro).
 */
export const martQuerySchema = z.object({
  uf: ufSchema.optional(),
  produto: produtoSchema.optional(),
  ano: z.coerce.number().int().optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
});
export type MartQuery = z.infer<typeof martQuerySchema>;

/** Período (ano, mês) disponível na série. */
export const periodoSchema = z.object({
  ano: z.number().int(),
  mes: z.number().int().min(1).max(12),
});
export type Periodo = z.infer<typeof periodoSchema>;

/**
 * Resposta de GET /api/filtros: domínios para popular os controles do dashboard
 * + uma seleção default sugerida (período mais recente). `default` é null se não
 * houver dados nos marts.
 */
export const filtrosSchema = z.object({
  ufs: z.array(ufSchema),
  produtos: z.array(produtoSchema),
  periodos: z.array(periodoSchema),
  default: z.object({ uf: ufSchema, produto: produtoSchema, periodo: periodoSchema }).nullable(),
});
export type Filtros = z.infer<typeof filtrosSchema>;
