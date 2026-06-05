import type {
  DispersaoRow,
  Filtros,
  MartQuery,
  PrecoMedioRow,
  VariacaoRow,
} from "@radar/contracts";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app";
import type { MartsRepository } from "./repository";

const precoMedioFixture: readonly PrecoMedioRow[] = [
  {
    id: "sp-gasolina-2024-01",
    uf: "SP",
    produto: "GASOLINA",
    ano: 2024,
    mes: 1,
    preco_medio_venda: 5.83,
    preco_min_venda: 5.39,
    preco_max_venda: 6.49,
    qtd_coletas: 1240,
    qtd_municipios: 312,
  },
  {
    id: "sp-etanol-2024-01",
    uf: "SP",
    produto: "ETANOL",
    ano: 2024,
    mes: 1,
    preco_medio_venda: 3.71,
    preco_min_venda: 3.19,
    preco_max_venda: 4.29,
    qtd_coletas: 1180,
    qtd_municipios: 305,
  },
];

const variacaoFixture: readonly VariacaoRow[] = [
  {
    id: "sp-gasolina-2024-01",
    uf: "SP",
    produto: "GASOLINA",
    ano: 2024,
    mes: 1,
    preco_medio_venda: 5.83,
    preco_mes_anterior: null,
    variacao_pct: null,
  },
  {
    id: "sp-gasolina-2024-02",
    uf: "SP",
    produto: "GASOLINA",
    ano: 2024,
    mes: 2,
    preco_medio_venda: 5.95,
    preco_mes_anterior: 5.83,
    variacao_pct: 2.06,
  },
];

const dispersaoFixture: readonly DispersaoRow[] = [
  {
    id: "sp-gasolina-2024-01",
    uf: "SP",
    produto: "GASOLINA",
    ano: 2024,
    mes: 1,
    qtd_municipios: 312,
    qtd_coletas: 1240,
    preco_min_venda: 5.39,
    preco_max_venda: 6.49,
    amplitude_venda: 1.1,
    desvio_padrao_municipal: 0.21,
    coef_variacao_pct: 3.6,
    margem_media: null,
  },
];

const filtrosFixture: Filtros = {
  ufs: ["SP", "RJ"],
  produtos: ["GASOLINA", "ETANOL"],
  periodos: [
    { ano: 2024, mes: 1 },
    { ano: 2024, mes: 2 },
  ],
  default: { uf: "SP", produto: "GASOLINA", periodo: { ano: 2024, mes: 2 } },
};

/** Repositório falso: devolve fixtures, sem tocar no Postgres. */
const fakeRepo: MartsRepository = {
  precoMedio: async (_q: MartQuery): Promise<PrecoMedioRow[]> => [...precoMedioFixture],
  variacao: async (_q: MartQuery): Promise<VariacaoRow[]> => [...variacaoFixture],
  dispersao: async (_q: MartQuery): Promise<DispersaoRow[]> => [...dispersaoFixture],
  filtros: async (): Promise<Filtros> => filtrosFixture,
};

describe("rotas de marts (repo injetado, sem DB)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp({ marts: fakeRepo });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/preco-medio → 200 com array de linhas tipadas (números, não strings)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/preco-medio" });
    expect(res.statusCode).toBe(200);

    const body = res.json<PrecoMedioRow[]>();
    expect(body).toHaveLength(2);
    const [first] = body;
    expect(first?.uf).toBe("SP");
    expect(typeof first?.preco_medio_venda).toBe("number");
    expect(typeof first?.qtd_coletas).toBe("number");
    expect(first?.preco_medio_venda).toBeCloseTo(5.83);
  });

  it("aceita filtros válidos (?uf=SP&produto=GASOLINA&ano=2024&mes=1) → 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/preco-medio?uf=SP&produto=GASOLINA&ano=2024&mes=1",
    });
    expect(res.statusCode).toBe(200);
  });

  it("rejeita UF inválida (?uf=ZZ) → 400 com envelope de erro", async () => {
    const res = await app.inject({ method: "GET", url: "/api/preco-medio?uf=ZZ" });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: string; code: string; issues?: unknown }>();
    expect(body.code).toBe("VALIDATION");
    expect(body.issues).toBeDefined();
  });

  it("rejeita mês fora de 1..12 (?mes=13) → 400", async () => {
    const res = await app.inject({ method: "GET", url: "/api/preco-medio?mes=13" });
    expect(res.statusCode).toBe(400);
  });

  it("rejeita ano não-numérico (?ano=abc) → 400", async () => {
    const res = await app.inject({ method: "GET", url: "/api/preco-medio?ano=abc" });
    expect(res.statusCode).toBe(400);
  });

  it("GET /api/variacao → 200 e trata variacao_pct/preco_mes_anterior nulos", async () => {
    const res = await app.inject({ method: "GET", url: "/api/variacao" });
    expect(res.statusCode).toBe(200);

    const body = res.json<VariacaoRow[]>();
    const primeiro = body.find((r) => r.mes === 1);
    expect(primeiro?.preco_mes_anterior).toBeNull();
    expect(primeiro?.variacao_pct).toBeNull();
    const segundo = body.find((r) => r.mes === 2);
    expect(segundo?.variacao_pct).toBeCloseTo(2.06);
  });

  it("GET /api/dispersao → 200 com margem_media nula tolerada", async () => {
    const res = await app.inject({ method: "GET", url: "/api/dispersao" });
    expect(res.statusCode).toBe(200);
    const [row] = res.json<DispersaoRow[]>();
    expect(row?.margem_media).toBeNull();
    expect(typeof row?.amplitude_venda).toBe("number");
  });

  it("GET /api/filtros → 200 com domínios + default", async () => {
    const res = await app.inject({ method: "GET", url: "/api/filtros" });
    expect(res.statusCode).toBe(200);
    const body = res.json<Filtros>();
    expect(Array.isArray(body.ufs)).toBe(true);
    expect(Array.isArray(body.periodos)).toBe(true);
    expect(body.default?.uf).toBe("SP");
    expect(body.default?.periodo).toEqual({ ano: 2024, mes: 2 });
  });
});
