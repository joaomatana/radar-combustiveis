import { describe, expect, it } from "vitest";
import { formatBRL, formatPct, formatPeriodo } from "./format";

describe("formatBRL", () => {
  it("formata em Reais com 2 casas", () => {
    // Tolerante ao espaço (NBSP) que o Intl pt-BR insere após "R$".
    expect(formatBRL(5.83)).toContain("R$");
    expect(formatBRL(5.83)).toContain("5,83");
    expect(formatBRL(1234.5)).toContain("1.234,50");
  });

  it("usa travessão para null/undefined/NaN", () => {
    expect(formatBRL(null)).toBe("—");
    expect(formatBRL(undefined)).toBe("—");
    expect(formatBRL(Number.NaN)).toBe("—");
  });
});

describe("formatPct", () => {
  it("trata pontos percentuais (÷100), 1 casa e sinal", () => {
    expect(formatPct(2.06, { sign: true })).toMatch(/^\+2,1\s?%$/);
    expect(formatPct(-1.5)).toMatch(/^-1,5\s?%$/);
    expect(formatPct(3.6)).toMatch(/^3,6\s?%$/);
  });

  it("usa travessão para null/undefined/NaN", () => {
    expect(formatPct(null)).toBe("—");
    expect(formatPct(undefined)).toBe("—");
    expect(formatPct(Number.NaN)).toBe("—");
  });
});

describe("formatPeriodo", () => {
  it("formata ano/mês como abrev/ano", () => {
    expect(formatPeriodo(2026, 1)).toBe("jan/2026");
    expect(formatPeriodo(2024, 12)).toBe("dez/2024");
  });

  it("usa travessão para mês fora de 1..12", () => {
    expect(formatPeriodo(2026, 0)).toBe("—");
    expect(formatPeriodo(2026, 13)).toBe("—");
  });
});
