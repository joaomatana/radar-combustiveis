import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  sourcemap: true,
  // @radar/contracts resolve para .ts-fonte; precisa ser BUNDLADO (transpilado e
  // inlined) — senão `node dist/server.js` tenta importar .ts em runtime e quebra.
  // zod/fastify/pg/@fastify/cors continuam externos (resolvidos do node_modules).
  noExternal: ["@radar/contracts"],
});
