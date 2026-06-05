import cors from "@fastify/cors";
import type { HealthResponse } from "@radar/contracts";
import Fastify, { type FastifyInstance } from "fastify";
import { config } from "./lib/config";
import { closeDb } from "./lib/db";
import { registerErrorHandler } from "./lib/errors";
import { type MartsRepository, PgMartsRepository } from "./marts/repository";
import { martsRoutes } from "./marts/routes";

export interface BuildAppOptions {
  readonly logger?: boolean;
  readonly marts?: MartsRepository;
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false });
  const marts = opts.marts ?? new PgMartsRepository();

  app.register(cors, { origin: config.corsOrigin });
  registerErrorHandler(app);

  app.get("/health", async (): Promise<HealthResponse> => ({ status: "ok" }));
  app.register(martsRoutes(marts), { prefix: "/api" });

  // Fecha o pool quando o app fecha (test app.close() / shutdown do server).
  // Só relevante quando o repo default (pg) abriu o pool; closeDb é idempotente.
  app.addHook("onClose", async () => {
    await closeDb();
  });

  return app;
}
