import { describe, expect, it } from "vitest";
import { resolveSsl } from "./ssl";

// Prova o hardening de SSL sem DB vivo: o Neon exige TLS, o Postgres local não.
// "Verde local" nunca exercita o caminho SSL — este teste trava a decisão.
describe("resolveSsl — TLS explícito p/ Neon, plaintext local", () => {
  it("host neon.tech (pooled) → TLS verificado", () => {
    expect(resolveSsl("postgresql://u:p@ep-x-pooler.us-east-2.aws.neon.tech/db")).toEqual({
      rejectUnauthorized: true,
    });
  });

  it("host neon.tech (direct) → TLS verificado", () => {
    expect(resolveSsl("postgresql://u:p@ep-x.us-east-2.aws.neon.tech/db")).toEqual({
      rejectUnauthorized: true,
    });
  });

  it("?sslmode=require em host genérico → TLS verificado", () => {
    expect(resolveSsl("postgresql://u:p@db.exemplo.com:5432/db?sslmode=require")).toEqual({
      rejectUnauthorized: true,
    });
  });

  it("Postgres local (sem neon/sslmode) → plaintext (false)", () => {
    expect(resolveSsl("postgresql://radar:radar@localhost:5433/radar")).toBe(false);
  });
});
