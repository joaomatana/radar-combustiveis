import { type Filtros, martQuerySchema } from "@radar/contracts";
import type { FastifyInstance } from "fastify";
import type { MartsRepository } from "./repository";

/** Plugin das rotas de marts. Recebe o repositório por injeção (testável). */
export function martsRoutes(marts: MartsRepository) {
  return async (app: FastifyInstance): Promise<void> => {
    app.get("/preco-medio", (req) => marts.precoMedio(martQuerySchema.parse(req.query)));
    app.get("/variacao", (req) => marts.variacao(martQuerySchema.parse(req.query)));
    app.get("/dispersao", (req) => marts.dispersao(martQuerySchema.parse(req.query)));
    app.get("/filtros", (): Promise<Filtros> => marts.filtros());
  };
}
