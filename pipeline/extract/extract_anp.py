"""Extração da Série Histórica de Preços de Combustíveis da ANP → Postgres (schema raw).

Porta do downloader irmão (dbt-dados-publicos): descoberta/filtro/download/encoding
idênticos; a CARGA muda de DuckDB read_csv para psycopg2 COPY. O loader é DONO de
raw.precos (o dbt só lê). Defaults = .env dev → roda local sem setar env.
"""

from __future__ import annotations

import argparse
import io
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd
import psycopg2
import requests

LISTING_URL = (
    "https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/"
    "serie-historica-de-precos-de-combustiveis"
)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/csv,*/*",
    "Accept-Language": "pt-BR,pt;q=0.9",
}

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "pipeline" / "extract" / "raw"
FIXTURES_DIR = REPO_ROOT / "pipeline" / "extract" / "fixtures"

HREF_RE = re.compile(r'href="([^"]+\.csv)"', re.IGNORECASE)
YEAR_RE = re.compile(r"(20\d{2})")

# Nomes/ordem EXATOS dos headers ANP que o staging referencia (stg_anp__precos quota-os).
CANONICAL_COLS = [
    "Regiao - Sigla",
    "Estado - Sigla",
    "Municipio",
    "Revenda",
    "CNPJ da Revenda",
    "Nome da Rua",
    "Numero Rua",
    "Complemento",
    "Bairro",
    "Cep",
    "Produto",
    "Data da Coleta",
    "Valor de Venda",
    "Valor de Compra",
    "Unidade de Medida",
    "Bandeira",
]
META_COLS = ["_arquivo_origem", "_loaded_at"]
TARGET_COLS = CANONICAL_COLS + META_COLS


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Baixa e carrega os preços de combustíveis da ANP no Postgres (raw.precos)."
    )
    p.add_argument("--ano-inicio", type=int, default=datetime.now().year - 2)
    p.add_argument("--full", action="store_true", help="Toda a série (ignora --ano-inicio).")
    p.add_argument("--produtos", default="gasolina-etanol,diesel-gnv,glp")
    p.add_argument("--listar", action="store_true", help="Lista os arquivos sem baixar.")
    p.add_argument("--sem-download", action="store_true", help="Só carrega os CSVs em raw/.")
    p.add_argument(
        "--fixtures-dir",
        nargs="?",
        const=str(FIXTURES_DIR),
        default=None,
        help="Carrega deste dir (default fixtures/) em vez de raw/. Implica --sem-download.",
    )
    return p.parse_args()


def produto_de(url: str) -> str:
    nome = url.rsplit("/", 1)[-1].lower()
    if "gasolina" in nome:
        return "gasolina-etanol"
    if "diesel" in nome:
        return "diesel-gnv"
    if "glp" in nome:
        return "glp"
    return "outros"


def ano_de(url: str) -> int | None:
    m = YEAR_RE.search(url)
    return int(m.group(1)) if m else None


def descobrir(session: requests.Session) -> list[str]:
    html = session.get(LISTING_URL, timeout=90).text
    return sorted({u for u in HREF_RE.findall(html) if "/shpc/dsan/" in u})


def filtrar(urls: list[str], args: argparse.Namespace) -> list[str]:
    produtos = {p.strip() for p in args.produtos.split(",") if p.strip()}
    out = []
    for u in urls:
        if produto_de(u) not in produtos:
            continue
        ano = ano_de(u)
        if not args.full and (ano is None or ano < args.ano_inicio):
            continue
        out.append(u)
    return out


def decodificar(blob: bytes) -> str:
    for enc in ("utf-8-sig", "latin-1"):
        try:
            return blob.decode(enc)
        except UnicodeDecodeError:
            continue
    return blob.decode("latin-1", errors="replace")


def baixar(session: requests.Session, url: str) -> Path:
    dest = RAW_DIR / url.rsplit("/", 1)[-1]
    if dest.exists() and ano_de(url) != datetime.now().year:
        return dest
    resp = session.get(url, timeout=180)
    resp.raise_for_status()
    dest.write_text(decodificar(resp.content), encoding="utf-8")
    return dest


def conexao() -> "psycopg2.extensions.connection":
    dsn = os.environ.get("DATABASE_URL")
    host = (urlparse(dsn).hostname or "") if dsn else os.environ.get("POSTGRES_HOST", "localhost")
    port = os.environ.get("POSTGRES_PORT", "5433")
    if "neon.tech" in host and os.environ.get("RADAR_ALLOW_PROD") != "1":
        sys.exit(
            f"ABORTADO: host '{host}' parece prod (Neon). Use o Postgres local "
            "(ou RADAR_ALLOW_PROD=1 para forçar)."
        )
    try:
        if dsn:
            return psycopg2.connect(dsn)
        return psycopg2.connect(
            host=host,
            port=port,
            user=os.environ.get("POSTGRES_USER", "radar"),
            password=os.environ.get("POSTGRES_PASSWORD", "radar"),
            dbname=os.environ.get("POSTGRES_DB", "radar"),
            # Neon exige SSL; local roda sem. O cron seta POSTGRES_SSLMODE=require p/ ser
            # explícito (paridade com sslmode: require do dbt). Default prefer = local ok.
            sslmode=os.environ.get("POSTGRES_SSLMODE", "prefer"),
        )
    except UnicodeDecodeError as e:
        # Windows pt-BR: libpq devolve a mensagem de erro em cp1252 e o psycopg2
        # estoura ao decodificar como utf-8. Decodifica e dá um erro claro.
        msg = e.object.decode("latin-1", "replace")
        sys.exit(
            f"ERRO ao conectar no Postgres em {host}:{port} — {msg}\n"
            "Dica: o container subiu (docker compose up -d)? Outro Postgres na porta?"
        )
    except psycopg2.OperationalError as e:
        sys.exit(
            f"ERRO ao conectar no Postgres em {host}:{port} — {str(e).strip()}\n"
            "Dica: docker compose up -d e confira credenciais/porta."
        )


def criar_tabela(cur) -> None:
    cols = ",\n        ".join(f'"{c}" text' for c in CANONICAL_COLS)
    cur.execute("CREATE SCHEMA IF NOT EXISTS raw;")
    cur.execute("DROP TABLE IF EXISTS raw.precos;")
    cur.execute(
        f"CREATE TABLE raw.precos (\n        {cols},\n"
        "        _arquivo_origem text,\n        _loaded_at timestamptz\n        );"
    )


def normalizar(path: Path, loaded_at: datetime) -> io.StringIO:
    puladas = {"n": 0}

    def _bad(_line):  # conta + pula linhas malformadas (sem drop silencioso)
        puladas["n"] += 1
        return None

    # engine="python" é exigido p/ o callable on_bad_lines; ok p/ job batch.
    df = pd.read_csv(
        path,
        sep=";",
        dtype=str,
        keep_default_na=False,
        encoding="utf-8-sig",
        engine="python",
        on_bad_lines=_bad,
    )
    if puladas["n"]:
        print(f"    {puladas['n']} linha(s) malformada(s) puladas em {path.name}")
    df = df.reindex(columns=CANONICAL_COLS)  # union_by_name: alinha por nome
    df["_arquivo_origem"] = path.name
    df["_loaded_at"] = loaded_at.isoformat()
    buf = io.StringIO()
    df[TARGET_COLS].to_csv(buf, sep=";", index=False, header=False, lineterminator="\n")
    buf.seek(0)
    return buf


def carregar(con, csv_dir: Path, loaded_at: datetime) -> int:
    arquivos = sorted(csv_dir.glob("*.csv"))
    cols = ", ".join(f'"{c}"' for c in TARGET_COLS)
    with con.cursor() as cur:
        criar_tabela(cur)
        for i, path in enumerate(arquivos, 1):
            print(f"  COPY [{i}/{len(arquivos)}] {path.name}")
            cur.copy_expert(
                f"COPY raw.precos ({cols}) FROM STDIN "
                "WITH (FORMAT csv, DELIMITER ';', NULL '', QUOTE '\"')",
                normalizar(path, loaded_at),
            )
        cur.execute("SELECT count(*) FROM raw.precos;")
        total = cur.fetchone()[0]
    con.commit()
    return total


def main() -> None:
    args = parse_args()
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    csv_dir = RAW_DIR
    if args.fixtures_dir is not None:
        csv_dir = Path(args.fixtures_dir)
        args.sem_download = True

    if not args.sem_download:
        with requests.Session() as session:
            session.headers.update(HEADERS)
            urls = filtrar(descobrir(session), args)
            print(f"Selecionados: {len(urls)} arquivos")
            if args.listar:
                for u in urls:
                    print(f"  {ano_de(u)}  {produto_de(u):16}  {u.rsplit('/', 1)[-1]}")
                return
            for i, u in enumerate(urls, 1):
                print(f"[{i}/{len(urls)}] {baixar(session, u).name}")

    if not list(csv_dir.glob("*.csv")):
        print(f"Nenhum CSV em {csv_dir}.")
        return

    con = conexao()
    try:
        total = carregar(con, csv_dir, datetime.now(timezone.utc))
    finally:
        con.close()
    print(f"raw.precos: {total} linhas")


if __name__ == "__main__":
    main()
