import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, apiGet } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Mocka fetch devolvendo uma Response NOVA a cada chamada (o corpo é consumível 1x). */
function stubFetch(make: () => Response): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => make()),
  );
}

/** Captura a rejeição como valor (null se resolver). */
function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => null,
    (e: unknown) => e,
  );
}

describe("apiGet — parse defensivo do corpo (cold start do Render)", () => {
  it("502 com corpo HTML (sem envelope JSON) → ApiClientError limpo, nunca SyntaxError", async () => {
    // O caso que SÓ aparece com o Render na frente acordando: 502 + HTML.
    stubFetch(
      () =>
        new Response("<html><body>502 Bad Gateway</body></html>", {
          status: 502,
          statusText: "Bad Gateway",
          headers: { "content-type": "text/html" },
        }),
    );
    const err = await rejectionOf(apiGet("/api/filtros"));
    expect(err).toBeInstanceOf(ApiClientError);
    if (err instanceof ApiClientError) {
      expect(err.status).toBe(502);
      expect(err.code).toBe("HTTP_ERROR");
      expect(err.message.length).toBeGreaterThan(0);
    }
  });

  it("502 com statusText vazio (HTTP/2) → mensagem 'HTTP 502', não vazia", async () => {
    stubFetch(() => new Response("<html>nginx</html>", { status: 502, statusText: "" }));
    const err = await rejectionOf(apiGet("/api/filtros"));
    expect(err).toBeInstanceOf(ApiClientError);
    if (err instanceof ApiClientError) {
      expect(err.message).toBe("HTTP 502");
    }
  });

  it("não-2xx COM envelope JSON → preserva {error,code}", async () => {
    stubFetch(
      () =>
        new Response(JSON.stringify({ error: "validação", code: "VALIDATION", issues: [] }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
    );
    const err = await rejectionOf(apiGet("/api/preco-medio"));
    expect(err).toBeInstanceOf(ApiClientError);
    if (err instanceof ApiClientError) {
      expect(err.status).toBe(400);
      expect(err.code).toBe("VALIDATION");
      expect(err.message).toBe("validação");
    }
  });

  it("2xx com corpo não-JSON → ApiClientError (BAD_JSON), nunca SyntaxError", async () => {
    stubFetch(
      () => new Response("not json", { status: 200, headers: { "content-type": "text/plain" } }),
    );
    const err = await rejectionOf(apiGet("/api/filtros"));
    expect(err).toBeInstanceOf(ApiClientError);
    if (err instanceof ApiClientError) {
      expect(err.code).toBe("BAD_JSON");
    }
  });

  it("2xx com JSON válido → resolve com o corpo tipado", async () => {
    stubFetch(
      () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const data = await apiGet<{ ok: boolean }>("/api/x");
    expect(data.ok).toBe(true);
  });
});
