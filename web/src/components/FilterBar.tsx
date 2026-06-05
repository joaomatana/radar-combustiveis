import type { Filtros } from "@radar/contracts";
import { formatPeriodo } from "../lib/format";
import type { Selection } from "./Dashboard";
import { Card } from "./ui/Card";
import { Select, type SelectOption } from "./ui/Select";

/** Chave string estável p/ um período (value do <select>). */
function periodoKey(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

/**
 * Barra de filtros controlada: produto + UF dirigem as séries temporais; o período
 * dirige APENAS o ranking entre UFs (rotulado para deixar isso claro).
 */
export function FilterBar({
  filtros,
  selection,
  onChange,
}: {
  filtros: Filtros;
  selection: Selection;
  onChange: (next: Selection) => void;
}) {
  const produtoOptions: SelectOption<string>[] = filtros.produtos.map((p) => ({
    value: p,
    label: p,
  }));
  const ufOptions: SelectOption<string>[] = filtros.ufs.map((u) => ({ value: u, label: u }));
  const periodoOptions: SelectOption<string>[] = filtros.periodos.map((p) => ({
    value: periodoKey(p.ano, p.mes),
    label: formatPeriodo(p.ano, p.mes),
  }));
  const selectedPeriodoKey = periodoKey(selection.periodo.ano, selection.periodo.mes);

  return (
    <Card accent="flame" className="flex flex-col gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Filtros</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select<string>
          label="Produto"
          value={selection.produto}
          options={produtoOptions}
          onChange={(value) => {
            const produto = filtros.produtos.find((p) => p === value);
            if (produto) {
              onChange({ ...selection, produto });
            }
          }}
        />
        <Select<string>
          label="UF"
          value={selection.uf}
          options={ufOptions}
          onChange={(value) => {
            const uf = filtros.ufs.find((u) => u === value);
            if (uf) {
              onChange({ ...selection, uf });
            }
          }}
        />
        <Select<string>
          label="Período"
          hint="afeta só o ranking entre UFs"
          value={selectedPeriodoKey}
          options={periodoOptions}
          onChange={(value) => {
            const periodo = filtros.periodos.find((p) => periodoKey(p.ano, p.mes) === value);
            if (periodo) {
              onChange({ ...selection, periodo });
            }
          }}
        />
      </div>
    </Card>
  );
}
