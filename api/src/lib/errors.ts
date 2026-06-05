import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

/** Erro de aplicação com status HTTP e código estável para o cliente. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  constructor(statusCode: number, message: string, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** Registra o handler de erros: ZodError→400, AppError→status, resto→500. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({ error: "validação", code: "VALIDATION", issues: error.issues });
      return;
    }
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ error: error.message, code: error.code });
      return;
    }
    // Fallback caso surja uma 2ª cópia de zod (instanceof falha entre cópias).
    if (error instanceof Error && error.name === "ZodError") {
      reply.status(400).send({ error: "validação", code: "VALIDATION" });
      return;
    }
    app.log.error({ err: error }, "erro não tratado");
    reply.status(500).send({ error: "erro interno", code: "INTERNAL" });
  });
}
