# radar-combustiveis
Monorepo: pipeline (Python/dbt/Postgres) + api (Fastify/TS) + web (React/TS). Dashboard de preços da ANP via ELT local semanal (só os marts são publicados no Neon).
## Regras
- TypeScript estrito em api/ e web/. Nunca `any`.
- Pipeline: ELT em camadas (staging → marts) com dbt no Postgres. Todo mart precisa de teste.
- Contrato da API tipado em packages/contracts; web e api consomem os MESMOS tipos. Nunca duplicar shape.
- Postgres local via docker-compose; o ELT (extract + dbt) roda SÓ no local. NUNCA rodar extract/dbt contra o Neon — a única escrita no Neon é o `pipeline/publish/publish_marts.py` (copia os 3 marts do local).
- Toda mudança em api/web precisa de teste antes de "pronto". Conventional Commits.
## Comandos
- DB local: `docker compose up -d`
- Pipeline: `cd pipeline/dbt && dbt build` (target dev/local)
- API: `pnpm --filter api dev`  | Web: `pnpm --filter web dev`  | Testes: `pnpm -r test`
- Refresh (local): `python pipeline/extract/extract_anp.py` → `cd pipeline/dbt && dbt build` → `python pipeline/publish/publish_marts.py` (publica os marts no Neon; precisa `NEON_DATABASE_URL`)
