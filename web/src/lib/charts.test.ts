import type { PrecoMedioRow, VariacaoRow } from "@radar/contracts";
import { describe, expect, it } from "vitest";
import { precoDominio, toPrecoSerie, toRankingUf, toVariacaoSerie, variacaoVazia } from "./charts";

const precoBase: PrecoMedioRow = {
  id: "a",
  uf: "SP",
  produto: "GASOLINA",
  ano: 2026,
  mes: 1,
  preco_medio_venda: 5.9,
  preco_min_venda: 5.5,
  preco_max_venda: 6.4,
  qtd_coletas: 10,
  qtd_municipios: 3,
};

const varJan: VariacaoRow = {
  id: "a",
  uf: "SP",
  produto: "GASOLINA",
  ano: 2026,
  mes: 1,
  preco_medio_venda: 5.9,
  preco_mes_anterior: null,
  variacao_pct: null,
};

const varFev: VariacaoRow = {
  id: "b",
  uf: "SP",
  produto: "GASOLINA",
  ano: 2026,
  mes: 2,
  preco_medio_venda: 6.1,
  preco_mes_anterior: 5.9,
  variacao_pct: 2.89,
};

describe("toPrecoSerie", () => {
  it("emite bandaDelta = max − min (não o max cru)", () => {
    const serie = toPrecoSerie([precoBase]);
    const p = serie[0];
    expect(p?.bandaDelta).toBeCloseTo(0.9);
    expect(p?.periodo).toBe("jan/2026");
    expect(p?.valor).toBe(5.9);
  });
});

describe("toVariacaoSerie / variacaoVazia", () => {
  it("mapeia variacao_pct null → valor null (lacuna no gráfico)", () => {
    const serie = toVariacaoSerie([varJan, varFev]);
    expect(serie[0]?.valor).toBeNull();
    expect(serie[1]?.valor).toBe(2.89);
  });

  it("variacaoVazia é true só quando toda a série é nula", () => {
    expect(variacaoVazia(toVariacaoSerie([varJan, varFev]))).toBe(false);
    expect(variacaoVazia(toVariacaoSerie([varJan]))).toBe(true);
  });
});

describe("toRankingUf", () => {
  it("ordena ascendente por valor e preserva a UF", () => {
    const ranking = toRankingUf([
      { ...precoBase, uf: "RJ", preco_medio_venda: 7.0 },
      { ...precoBase, uf: "SP", preco_medio_venda: 5.9 },
    ]);
    expect(ranking.map((r) => r.uf)).toEqual(["SP", "RJ"]);
  });
});

describe("precoDominio", () => {
  it("aplica folga e nunca vai abaixo de 0", () => {
    const [lo, hi] = precoDominio([{ min: 5, max: 6 }]);
    expect(lo).toBeLessThan(5);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeGreaterThan(6);
  });

  it("array vazio → [0, 1]", () => {
    expect(precoDominio([])).toEqual([0, 1]);
  });
});
