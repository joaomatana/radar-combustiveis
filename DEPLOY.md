# Deploy — radar-combustiveis

Arquitetura em produção:

```
ANP (CSV) ──cron semanal (GitHub Actions)──► Neon (Postgres)
                                               │  raw.precos → dbt → public.mart_*
                                               ▼
       Vercel (SPA React)  ──HTTPS──►  Render (API Fastify)  ──pooled + SSL──►  Neon
```

- **Neon** — Postgres gerenciado (free; o compute escala a zero após ~5 min ociosos).
- **Render** — hospeda a API (free; dorme após ~15 min sem tráfego, acorda em ~50 s).
- **Vercel** — hospeda a SPA estática (build do Vite).
- **GitHub Actions** — cron semanal que baixa a ANP e roda o dbt direto no Neon.

> O ELT **só roda no GitHub Actions** (não nos servidores). A API e a SPA apenas **leem** os marts.
> Todos os deploys e o cron seguem o branch **default do repo (`master`)** — crons do GitHub só
> disparam no branch default.

## Pré-requisitos
Contas em **Neon**, **Render** e **Vercel**, todas ligadas a este repositório no GitHub.

## Matriz de variáveis

### GitHub → Settings → Secrets and variables → Actions
Quatro secrets, a partir do endpoint **DIRECT** do Neon (sem `-pooler`):

| Secret | Valor |
| --- | --- |
| `NEON_HOST` | host direct, ex. `ep-xxx.us-east-2.aws.neon.tech` |
| `NEON_USER` | usuário do Neon |
| `NEON_PASSWORD` | senha do Neon |
| `NEON_DATABASE` | nome do banco (ex. `neondb`) |

O `cron-elt.yml` usa esses 4 secrets tanto no loader (`POSTGRES_*` + `RADAR_ALLOW_PROD=1` +
`POSTGRES_SSLMODE=require`) quanto no dbt (`PGHOST/PGUSER/PGPASSWORD/PGDATABASE` + `PGSCHEMA=public`).

### Render → Environment (API)
| Var | Valor |
| --- | --- |
| `DATABASE_URL` | string **POOLED** do Neon (host com `-pooler`), ex. `postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb` |
| `CORS_ORIGIN` | origem exata do Vercel, ex. `https://radar-combustiveis.vercel.app` (sem barra final) |

Não setar `PORT` (o Render injeta `$PORT`). A versão do Node vem do `.node-version` (22).
Aceita lista separada por vírgula em `CORS_ORIGIN` (prod + domínio custom, p.ex.).

### Vercel → Settings → Environment Variables (escopo **Production**)
| Var | Valor |
| --- | --- |
| `VITE_API_URL` | URL pública da API no Render, ex. `https://radar-api.onrender.com` |

`VITE_API_URL` é *baked* no bundle durante o build — trocar exige **redeploy** do Vercel, e a origem
precisa estar liberada no `CORS_ORIGIN` da API.

## Ordem de deploy
1. **Neon** — criar projeto (região perto de você). Copiar a connection string **pooled** (p/ a API),
   a **direct** (p/ o cron) e user/senha/db.
2. **GitHub secrets** — adicionar `NEON_HOST/USER/PASSWORD/DATABASE` (a partir do endpoint **direct**).
3. **Primeira carga** — _Actions → ELT semanal (ANP → Neon) → Run workflow_, marcar **`full = true`**
   (backfill da série inteira). Conferir o `dbt build` **verde** no log → cria `public.mart_*` no Neon.
4. **Render** — _New → Blueprint_ (lê o `render.yaml`) ou _New → Web Service_ apontando p/ o repo.
   Setar `DATABASE_URL` (**pooled**) e `CORS_ORIGIN` (a URL planejada do Vercel). Deploy → anotar a URL
   (ex. `https://radar-api.onrender.com`).
5. **Vercel** — _Add New → Project_ importando o repo. **Root Directory = raiz** (não `web/`). Setar
   `VITE_API_URL` = URL do Render (Production). Deploy → anotar a URL (ex. `https://...vercel.app`).
6. **Ajustar CORS** — se a URL real do Vercel diferir, atualizar `CORS_ORIGIN` no Render e
   _Manual Deploy → Clear cache & deploy_.
7. **Smoke test:**
   - `GET <api>/health` → `{"status":"ok"}`.
   - `GET <api>/api/filtros` → JSON com `ufs/produtos/periodos` (**prova a cadeia de schema**).
   - Abrir a URL do Vercel → o dashboard carrega. No 1º acesso, enquanto o Render acorda (~50 s),
     aparece "Acordando a API (plano gratuito, ~50 s)…".

## Garantia da cadeia de schema (não mexer)
A API consulta `FROM public.mart_*` (qualificado **em código**). O dbt escreve os marts no schema do
target, e o cron passa `PGSCHEMA=public`. **Mantenha `PGSCHEMA=public`** — se mudar, o dbt escreve em
outro schema e a API não acha os marts (erro só em runtime, não no deploy).

## Operação
- **Atualização semanal:** o `cron-elt.yml` roda toda segunda 09:00 UTC (06:00 BRT), janela default do
  loader (~3 anos). Sem ação manual.
- **Backfill / re-carga manual:** _Actions → Run workflow_ (com `full=true` p/ a série inteira).
- **Cold start:** o Render free dorme após ~15 min sem tráfego; o 1º acesso leva ~50 s (o Neon acorda em
  ~0,5 s — o gargalo é o Render). A SPA mostra a dica de "acordando" e o cliente tolera o erro com
  "Tentar de novo". **Sem** pinger 24/7 — manter a API acordada o tempo todo estouraria as 750 h/mês do
  plano free.
- **Repo público:** o GitHub **desativa** crons agendados após 60 dias sem atividade no repo; um push reativa.
- **"Render verde" ≠ "dados carregados":** o `/health` não toca o banco (de propósito, p/ não falhar com o
  Neon dormindo), então a API pode estar de pé sem marts. Use `GET /api/filtros` como prova de que o cron
  populou o Neon.
