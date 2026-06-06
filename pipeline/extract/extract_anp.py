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
import socket
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd
import psycopg2
import requests
import urllib3.util.connection as urllib3_cn

# Runner do GitHub Actions tem egress só-IPv4; www.gov.br resolve p/ IPv6 e não há rota
# até ele (ENETUNREACH). Força requests/urllib3 a conectar só por IPv4 — inofensivo local
# (a máquina tem IPv4); a CI da ETAPA 2 nunca pegou isso (usava --fixtures-dir, sem rede).
urllib3_cn.allowed_gai_family = lambda: socket.AF_INET

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
    # Destino ÚNICO por ano: 2024 e 2025 reusam o mesmo basename (o ano só está no path
    # da URL). Sem o prefixo, o download de um sobrescreve o do outro — ou, pior, um
    # arquivo velho de outro ano com o mesmo nome é servido do cache e nunca re-baixado.
    ano = ano_de(url)
    nome = url.rsplit("/", 1)[-1]
    dest = RAW_DIR / (f"{ano}-{nome}" if ano else nome)
    if dest.exists() and ano != datetime.now().year:
        return dest
    resp = session.get(url, timeout=180)
    resp.raise_for_status()
    dest.write_text(decodificar(resp.content), encoding="utf-8")
    return dest


def conexao() -> "psycopg2.extensions.connection":
    dsn = os.environ.get("DATABASE_URL")
    host = (urlparse(dsn).hostname or "") if dsn else os.environ.get("POSTGRES_HOST", "localhost")
    port = os.environ.get("POSTGRES_PORT", "5433")
    # O extract é LOCAL-only: o Neon guarda SÓ os marts (publicados pelo publish_marts.py),
    # nunca o raw. Bloqueio rígido, sem escape — carregar o raw no Neon estoura o teto de 512 MB.
    if "neon.tech" in host:
        sys.exit(
            f"ABORTADO: host '{host}' é o Neon (prod). O extract roda SÓ no Postgres local; "
            "o Neon recebe só os marts via pipeline/publish/publish_marts.py.\n"
            "Confira o ambiente do shell: DATABASE_URL / POSTGRES_HOST devem ser locais "
            "(o .env aponta p/ localhost, mas o extract lê o env do processo). Veja DEPLOY.md."
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
    # CREATE IF NOT EXISTS + TRUNCATE (não DROP): a partir da 2a carga, as views do dbt
    # dependem de raw.precos e um DROP sem CASCADE falha. TRUNCATE recarrega sem tocar nas
    # views (o loader é dono só de raw.precos) e é atômico com o COPY (um só commit).
    cur.execute(
        f"CREATE TABLE IF NOT EXISTS raw.precos (\n        {cols},\n"
        "        _arquivo_origem text,\n        _loaded_at timestamptz\n        );"
    )
    cur.execute("TRUNCATE raw.precos;")


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


def carregar(con, arquivos: list[Path], loaded_at: datetime) -> int:
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

    if args.fixtures_dir is not None:
        args.sem_download = True

    arquivos: list[Path] = []
    if not args.sem_download:
        with requests.Session() as session:
            session.headers.update(HEADERS)
            urls = filtrar(descobrir(session), args)
            print(f"Selecionados: {len(urls)} arquivos")
            if args.listar:
                for u in urls:
                    print(f"  {ano_de(u)}  {produto_de(u):16}  {u.rsplit('/', 1)[-1]}")
                return
            # Carrega EXATAMENTE o que foi baixado nesta run (cada arquivo único por ano),
            # não um glob de tudo em raw/ — sobras de runs antigas não entram na carga.
            for i, u in enumerate(urls, 1):
                dest = baixar(session, u)
                print(f"[{i}/{len(urls)}] {dest.name}")
                arquivos.append(dest)
    else:
        base = Path(args.fixtures_dir) if args.fixtures_dir is not None else RAW_DIR
        arquivos = sorted(base.glob("*.csv"))

    if not arquivos:
        print("Nenhum CSV para carregar.")
        return

    con = conexao()
    try:
        total = carregar(con, arquivos, datetime.now(timezone.utc))
    finally:
        con.close()
    print(f"raw.precos: {total} linhas")


if __name__ == "__main__":
    main()
