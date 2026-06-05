const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pctPlain = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const pctSigned = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

/** Formata em Reais. null/undefined/NaN → "—". Ex.: 5.83 → "R$ 5,83". */
export function formatBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return brl.format(value);
}

/**
 * Variação percentual. A API manda pontos percentuais (2.06 = +2,06%), então
 * dividimos por 100 p/ o style:"percent". `sign` força o "+" em positivos.
 * null/undefined/NaN → "—".
 */
export function formatPct(value: number | null | undefined, opts?: { sign?: boolean }): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return (opts?.sign ? pctSigned : pctPlain).format(value / 100);
}

/** Período (ano, mês 1..12) → "jan/2026". Mês fora de 1..12 → "—". */
export function formatPeriodo(ano: number, mes: number): string {
  const abrev = MESES[mes - 1];
  return abrev === undefined ? "—" : `${abrev}/${ano}`;
}
