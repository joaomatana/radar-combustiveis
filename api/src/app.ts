import type { HealthResponse } from "@radar/contracts";
import Fastify, { type FastifyInstance } from "fastify";

export function buildApp(opts: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false });

  app.get("/health", async (): Promise<HealthResponse> => ({ status: "ok" }));

  return app;
}
