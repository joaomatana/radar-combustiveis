// Verificação heurística pós-build: garante que o zod NÃO vazou para o bundle de
// produção do web. O web deve importar SÓ tipos de @radar/contracts (import type ...);
// qualquer value-import (z, *Schema, UFS, PRODUTOS) puxaria o zod p/ o bundle.
// Roda após `vite build` (cwd = web/); sai != 0 se achar assinatura do zod.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ASSETS_DIR = join(process.cwd(), "dist", "assets");

// Strings literais do runtime do zod — sobrevivem à minificação (minifier não renomeia
// string literals). Improváveis de colidir com código de um dashboard de combustível.
const ZOD_SIGNATURES = ["Invalid enum value", "ZodError", "ZodType", "invalid_type", "addIssue"];

async function listJsFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".js"))
      .map((e) => join(dir, e.name));
  } catch {
    console.error(`[check-no-zod] diretório não encontrado: ${dir}. Rode 'vite build' antes.`);
    process.exit(2);
  }
}

async function main() {
  const files = await listJsFiles(ASSETS_DIR);
  const hits = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const found = ZOD_SIGNATURES.filter((sig) => content.includes(sig));
    if (found.length > 0) {
      hits.push({ file, found });
    }
  }
  if (hits.length > 0) {
    console.error("[check-no-zod] zod parece ter vazado para o bundle de produção:");
    for (const hit of hits) {
      console.error(`  - ${hit.file}: ${hit.found.join(", ")}`);
    }
    console.error(
      "\nCausa provável: value-import de @radar/contracts (ex.: import { z, ufSchema, UFS }).\n" +
        "Use APENAS 'import type { ... }' no web; domínios vêm de GET /api/filtros.",
    );
    process.exit(1);
  }
  console.log(`[check-no-zod] OK — ${files.length} arquivo(s) escaneado(s), zod não detectado.`);
}

main().catch((err) => {
  console.error("[check-no-zod] erro inesperado:", err);
  process.exit(2);
});
