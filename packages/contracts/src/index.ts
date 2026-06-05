import { z } from "zod";

export * from "./enums";
export * from "./marts";
export * from "./queries";

/** Resposta de GET /health. */
export const healthResponseSchema = z.object({ status: z.literal("ok") });
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** Envelope de erro padrão da API (alinhado ao errorHandler do Fastify). */
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  issues: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
