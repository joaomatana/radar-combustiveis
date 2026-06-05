import { buildApp } from "./app";

const app = buildApp({ logger: true });
const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";

app
  .listen({ port, host })
  .then((address) => app.log.info(`api ouvindo em ${address}`))
  .catch((err: unknown) => {
    app.log.error({ err }, "falha ao iniciar a api");
    process.exit(1);
  });
