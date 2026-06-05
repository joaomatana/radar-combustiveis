import { describe, expect, it } from "vitest";
import { parseCorsOrigin } from "./config";

describe("parseCorsOrigin", () => {
  it("origem única → string", () => {
    expect(parseCorsOrigin("https://radar.vercel.app")).toBe("https://radar.vercel.app");
  });

  it("lista separada por vírgula → array (com trim)", () => {
    expect(parseCorsOrigin("https://radar.vercel.app, http://localhost:5173")).toEqual([
      "https://radar.vercel.app",
      "http://localhost:5173",
    ]);
  });

  it("vírgula sobrando → ignora vazios e devolve string", () => {
    expect(parseCorsOrigin("https://a.app,")).toBe("https://a.app");
  });
});
