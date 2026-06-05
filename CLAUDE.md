# radar-combustiveis
Monorepo: pipeline (Python/dbt/Postgres) + api (Fastify/TS) + web (React/TS). Dashboard de preços da ANP via ELT semanal.
## Regras
- TypeScript estrito em api/ e web/. Nunca `any`.
- Pipeline: ELT em camadas (staging → marts) com dbt no Postgres. Todo mart precisa de teste.
- Contrato da API tipado em packages/contracts; web e api consomem os MESMOS tipos. Nunca duplicar shape.
- Postgres local via docker-compose; prod (Neon) só via env. NUNCA rodar pipeline/migração contra prod localmente.
- Toda mudança em api/web precisa de teste antes de "pronto". Conventional Commits.
## Comandos
- DB local: `docker compose up -d`
- Pipeline: `cd pipeline/dbt && dbt build` (target dev/local)
- API: `pnpm --filter api dev`  | Web: `pnpm --filter web dev`  | Testes: `pnpm -r test`
