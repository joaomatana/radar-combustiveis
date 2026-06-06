"""Publica os marts (public.mart_*) do Postgres LOCAL no Neon.

O ELT roda local (gov.br bloqueia o runner do GitHub; o raw inteiro não cabe no
teto do Neon free). Só os 3 marts pequenos vão pro Neon: CREATE IF NOT EXISTS
(espelhando o tipo de cada coluna do local) + TRUNCATE + COPY, tudo numa transação
(atômico). Origem = POSTGRES_*/DATABASE_URL (local); destino = NEON_DATABASE_URL
(endpoint DIRECT, com sslmode=require).
"""

from __future__ import annotations

import io
import os
import sys

import psycopg2

MARTS = ("mart_preco_medio_uf_mes", "mart_variacao_preco", "mart_dispersao_revenda")


def conexao_local() -> "psycopg2.extensions.connection":
    dsn = os.environ.get("DATABASE_URL")
    if dsn:
        return psycopg2.connect(dsn)
    return psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=os.environ.get("POSTGRES_PORT", "5433"),
        user=os.environ.get("POSTGRES_USER", "radar"),
        password=os.environ.get("POSTGRES_PASSWORD", "radar"),
        dbname=os.environ.get("POSTGRES_DB", "radar"),
    )


def conexao_neon() -> "psycopg2.extensions.connection":
    dsn = os.environ.get("NEON_DATABASE_URL")
    if not dsn:
        sys.exit("ERRO: defina NEON_DATABASE_URL (string DIRECT do Neon, com sslmode=require).")
    return psycopg2.connect(dsn)


def _ident(con) -> tuple[str | None, str | None, str | None]:
    p = con.get_dsn_parameters()
    return (p.get("host"), p.get("port"), p.get("dbname"))


def _colunas(cur, mart: str) -> list[tuple[str, str]]:
    cur.execute(
        "select a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod) "
        "from pg_attribute a "
        "where a.attrelid = %s::regclass and a.attnum > 0 and not a.attisdropped "
        "order by a.attnum",
        (f"public.{mart}",),
    )
    return cur.fetchall()


def publicar(src, dst, mart: str) -> int:
    with src.cursor() as scur:
        cols = _colunas(scur, mart)
        ddl = ",\n  ".join(f'"{nome}" {tipo}' for nome, tipo in cols)
        collist = ", ".join(f'"{nome}"' for nome, _ in cols)  # lista explícita: robusto a ordem divergente
        buf = io.StringIO()
        scur.copy_expert(f'COPY public."{mart}" ({collist}) TO STDOUT WITH (FORMAT csv)', buf)
        buf.seek(0)
    with dst.cursor() as dcur:
        dcur.execute(f'CREATE TABLE IF NOT EXISTS public."{mart}" (\n  {ddl}\n);')
        dcur.execute(f'TRUNCATE public."{mart}";')
        dcur.copy_expert(f'COPY public."{mart}" ({collist}) FROM STDIN WITH (FORMAT csv)', buf)
        dcur.execute(f'SELECT count(*) FROM public."{mart}";')
        return dcur.fetchone()[0]


def main() -> None:
    src = conexao_local()
    dst = conexao_neon()
    if _ident(src) == _ident(dst):
        sys.exit("ERRO: origem == destino. NEON_DATABASE_URL deve apontar pro Neon, não o local.")
    try:
        for mart in MARTS:
            n = publicar(src, dst, mart)
            print(f"  {mart}: {n} linhas")
        # 1 commit no fim: o TRUNCATE pega ACCESS EXCLUSIVE, então um SELECT concorrente
        # espera o commit e já lê os novos dados (sem estado parcial).
        dst.commit()
    except Exception:
        dst.rollback()
        raise
    finally:
        src.close()
        dst.close()
    print("Marts publicados no Neon.")


if __name__ == "__main__":
    main()
