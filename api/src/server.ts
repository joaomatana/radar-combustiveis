import { buildApp } from "./app";
import { config } from "./lib/config";
import { closeDb } from "./lib/db";

const app = buildApp({ logger: true });

async function shutdown(signal: string): Promise<void> {
  app.log.info(`recebido ${signal}, encerrando…`);
  try {
    await app.close(); // dispara o hook onClose → closeDb()
  } catch (err) {
    app.log.error({ err }, "erro ao encerrar");
  } finally {
    process.exit(0);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

try {
  const address = await app.listen({ port: config.port, host: config.host });
  app.log.info(`api ouvindo em ${address}`);
} catch (err) {
  app.log.error({ err }, "falha ao iniciar a api");
  await closeDb();
  process.exit(1);
}
