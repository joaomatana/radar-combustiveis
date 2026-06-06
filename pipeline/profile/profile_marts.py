"""Perfil dos marts (public.mart_*) — sanidade de dados como artefato visível.

Lê os 3 marts do Postgres (local/CI) e gera um Markdown com shape, % de nulos por
coluna, describe() das medidas, domínios (UF/produto) e cobertura de período. Só
pandas + psycopg2 (já no requirements). READ-ONLY — não escreve no banco.
(No espírito do projeto irmão `dataprof`, mas self-contained.)
"""

from __future__ import annotations

import os
from decimal import Decimal
from pathlib import Path

import pandas as pd
import psycopg2

MARTS = ("mart_preco_medio_uf_mes", "mart_variacao_preco", "mart_dispersao_revenda")
OUT = Path(__file__).resolve().parent / "profile.md"


def conexao() -> "psycopg2.extensions.connection":
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


def carrega(cur, mart: str) -> pd.DataFrame:
    cur.execute(f'SELECT * FROM public."{mart}"')
    cols = [d[0] for d in cur.description]
    df = pd.DataFrame(cur.fetchall(), columns=cols)
    for c in df.columns:  # psycopg2 devolve numeric como Decimal -> float p/ estatística
        if df[c].map(lambda v: isinstance(v, Decimal)).any():
            df[c] = df[c].astype(float)
    return df


def perfil(mart: str, df: pd.DataFrame) -> str:
    out = [f"## `{mart}`", "", f"- **linhas:** {len(df)}", f"- **colunas:** {len(df.columns)}"]
    if {"ano", "mes"} <= set(df.columns) and len(df):
        o = df.sort_values(["ano", "mes"]).iloc[0]
        h = df.sort_values(["ano", "mes"]).iloc[-1]
        out.append(f"- **período:** {int(o.ano)}-{int(o.mes):02d} -> {int(h.ano)}-{int(h.mes):02d}")
    for dim in ("uf", "produto"):
        if dim in df.columns:
            vals = sorted(df[dim].dropna().unique().tolist())
            out.append(f"- **{dim}** ({len(vals)}): {', '.join(map(str, vals))}")
    nulos = (df.isna().mean() * 100).round(1)
    nz = nulos[nulos > 0]
    out.append("- **nulos:** " + ("nenhum" if nz.empty else ", ".join(f"{c}={v}%" for c, v in nz.items())))
    num = df.select_dtypes("number").drop(columns=["ano", "mes"], errors="ignore")  # ano/mes são dims
    if not num.empty:
        out += ["", "```", num.describe().round(3).to_string(), "```"]
    return "\n".join(out) + "\n"


def main() -> None:
    con = conexao()
    try:
        with con.cursor() as cur:
            blocos = [perfil(m, carrega(cur, m)) for m in MARTS]
    finally:
        con.close()
    relatorio = "# Data profile — marts\n\n" + "\n".join(blocos)
    OUT.write_text(relatorio, encoding="utf-8")
    print(relatorio)
    print(f"\n(perfil salvo em {OUT})")


if __name__ == "__main__":
    main()
