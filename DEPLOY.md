# Deploy — radar-combustiveis

Arquitetura em produção (refresh **local**, Neon guarda **só os marts**):

```
LOCAL (Docker Postgres) — máquina do dev:
  ANP CSV → extract_anp.py → raw.precos → dbt build (dev) → public.mart_* (local)
                                                              │  publish_marts.py
                                                              ▼  (CREATE IF NOT EXISTS + TRUNCATE + COPY)
NEON (só 3 marts):  public.{ mart_preco_medio_uf_mes, mart_variacao_preco, mart_dispersao_revenda }
                                                              ▲ pooled + SSL (lê)
                          Vercel (SPA React) ──HTTPS──► Render (API Fastify) ──► Neon
```

- **Local (Docker Postgres)** — onde o ELT pesado roda (raw inteiro + staging + marts).
- **Neon** — Postgres gerenciado (free). Guarda **só os 3 marts** (sem `raw`, sem views de staging).
- **Render** — hospeda a API (free; dorme após ~15 min, acorda em ~50 s).
- **Vercel** — hospeda a SPA estática (build do Vite).

> **Por que o ELT é local (e não no GitHub Actions):**
> 1. **gov.br bloqueia o runner** — o IP de datacenter do GitHub não baixa a série (mesmo com o fix de IPv4, o egress é barrado). Localmente, IP residencial BR, baixa normal.
> 2. **Teto do Neon free** — `raw.precos` (série inteira) não cabe / é desperdício. Só os marts (pequenos) sobem.
>
> O workflow `.github/workflows/cron-elt.yml` fica **desativado, como referência** do design ELT→prod original (secrets/SSL/`dbt --target prod`) — sem `schedule`, não auto-dispara.

## Pré-requisitos
Docker (Postgres local), Python (venv do `pipeline/`), pnpm. Contas em **Neon**, **Render** e **Vercel** ligadas ao repo.

## Matriz de variáveis

### Local — `.env` (gitignored), p/ o refresh
| Var | Valor |
| --- | --- |
| `POSTGRES_*` / `DATABASE_URL` | Postgres local (defaults de dev: `localhost:5433`, `radar/radar/radar`) |
| `NEON_DATABASE_URL` | Neon **DIRECT** (sem `-pooler`), com `?sslmode=require` — usado **só** pelo `publish_marts.py` |

### Render → Environment (API)
| Var | Valor |
| --- | --- |
| `DATABASE_URL` | Neon **POOLED** (host com `-pooler`), ex. `postgresql://user:pass@ep-xxx-pooler.<region>.aws.neon.tech/neondb` |
| `CORS_ORIGIN` | origem exata do Vercel, ex. `https://radar-combustiveis.vercel.app` (sem barra final; aceita lista por vírgula) |

Não setar `PORT` (o Render injeta `$PORT`). Node vem do `.node-version` (22). O `resolveSsl` da API liga o TLS pelo host `neon.tech`.

### Vercel → Environment Variables (escopo **Production**)
| Var | Valor |
| --- | --- |
| `VITE_API_URL` | URL pública da API no Render, ex. `https://radar-api.onrender.com` (baked no build → trocar exige redeploy; a origem precisa bater com `CORS_ORIGIN`) |

### GitHub Actions
**Nada** é necessário p/ o refresh (ele é local). Os secrets `NEON_*` só importam se você **reativar** o `cron-elt.yml` (referência).

## Setup inicial
1. **Neon** — criar projeto (região perto de você). Copiar a connection string **pooled** (p/ a Render) e a **direct** (p/ o `NEON_DATABASE_URL` local).
2. **Migração do modelo antigo (se o Neon já recebeu o ELT):** rodar uma vez no Neon, p/ deixar **só os marts** e liberar o espaço do raw:
   ```sql
   DROP SCHEMA IF EXISTS raw CASCADE;   -- derruba raw.precos + as views stg_*/int_* que dependem dele;
                                        -- as 3 public.mart_* são tabelas e sobrevivem.
   ```
   (Conferir com `\dt public.*` — deve sobrar só `mart_*`.)
3. **1ª carga (local):** `docker compose up -d` → `python pipeline/extract/extract_anp.py` → `cd pipeline/dbt && dbt build && cd ../..` → `python pipeline/publish/publish_marts.py` (com `NEON_DATABASE_URL` setado). Cria/popula os 3 marts no Neon.
4. **Render** — _New → Blueprint_ (lê o `render.yaml`) ou _Web Service_ manual. Setar `DATABASE_URL` (**pooled**) e `CORS_ORIGIN` (URL planejada do Vercel). Deploy → anotar `https://radar-api.onrender.com`.
5. **Vercel** — importar o repo, **Root Directory = raiz** (não `web/`). Setar `VITE_API_URL` = URL do Render (Production). Deploy → anotar `https://...vercel.app`.
6. **Ajustar CORS** — se a URL real do Vercel diferir, atualizar `CORS_ORIGIN` no Render e _Manual Deploy → Clear cache & deploy_.
7. **Smoke test:** `GET <api>/health` → `{"status":"ok"}`; `GET <api>/api/filtros` → JSON com `ufs/produtos/periodos` (**prova que os marts chegaram no Neon**); abrir o Vercel → dashboard carrega (1º acesso mostra "Acordando a API ~50 s" enquanto o Render acorda).

## Refresh semanal (local)
Manual, ou agendado no seu SO (Task Scheduler / cron local):
```bash
docker compose up -d
python pipeline/extract/extract_anp.py            # janela default (~3 anos) no raw local
cd pipeline/dbt && dbt build && cd ../..           # staging→marts local + 33 testes
python pipeline/publish/publish_marts.py           # publica os 3 marts no Neon (precisa NEON_DATABASE_URL)
```
Backfill da série inteira: `python pipeline/extract/extract_anp.py --full` no passo 2.

## Notas de operação
- **Atomicidade do publish:** cada mart é `CREATE IF NOT EXISTS` + `TRUNCATE` + `COPY`, os 3 num **único commit**. O `TRUNCATE` segura `ACCESS EXCLUSIVE`, então um `SELECT` concorrente da API **espera** o commit e já lê os novos dados (não lê parcial) — sub-segundo nos marts pequenos.
- **Trava do `publish_marts.py`:** exige `NEON_DATABASE_URL` e **aborta se origem == destino** (não publica o local sobre si mesmo).
- **Cold start:** Render free dorme após ~15 min; o 1º acesso leva ~50 s (Neon acorda em ~0,5 s — o gargalo é o Render). A SPA mostra a dica e tolera o erro com "Tentar de novo". **Sem** pinger 24/7 (estouraria as 750 h/mês).
- **"Render verde" ≠ "dados publicados":** o `/health` não toca o banco; a API pode estar de pé sem marts. Use `GET /api/filtros` como prova de que o último `publish` populou o Neon.
- **Cadeia de schema:** a API lê `FROM public.mart_*` (qualificado em código); o `publish` cria os marts em `public` com o mesmo schema (introspecção via `pg_catalog.format_type`). Mantém a garantia sem depender de `search_path`.
