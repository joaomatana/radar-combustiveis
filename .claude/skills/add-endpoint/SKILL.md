---
name: add-endpoint
description: Cria uma nova rota Fastify completa — handler, schema de validação, tipo compartilhado em packages/contracts e teste. Use ao adicionar qualquer endpoint na api.
---
Ao adicionar um endpoint na api:
1. Defina o tipo do contrato (request/response) em packages/contracts e exporte-o; api e web consomem o MESMO tipo (nunca duplicar shape).
2. Crie a rota Fastify com handler tipado e schema de validação (Zod ou JSON Schema do Fastify) para body/params/query.
3. Trate erros explicitamente e responda com status corretos; sem `any`.
4. Escreva um teste da rota (status, payload, input inválido) e rode `pnpm --filter api test` — só finalize com o teste passando.
