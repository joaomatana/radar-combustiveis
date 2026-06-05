"""Extrai a Série Histórica de Preços de Combustíveis da ANP e carrega no Postgres.

STAGE 1: placeholder. Sem lógica de extração/carga ainda.

TODO (ETAPA 2):
- Baixar os CSVs da ANP (requests + User-Agent de browser).
- Normalizar encoding (UTF-8 / Latin-1) e gravar no schema `raw` do Postgres.
- Carregar via psycopg/COPY como fonte do dbt.
- CLI (argparse): --full, --ano-inicio, --produtos, --sem-download.
"""

from __future__ import annotations


def main() -> None:
    """Ponto de entrada da extração (a implementar na ETAPA 2)."""
    raise NotImplementedError("Extração da ANP será implementada na ETAPA 2.")


if __name__ == "__main__":
    main()
