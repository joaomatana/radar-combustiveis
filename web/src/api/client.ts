import type { ApiError } from "@radar/contracts";

/** Erro tipado em respostas não-2xx ou corpo inválido. Carrega status + envelope. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: unknown;
  constructor(status: number, body: ApiError) {
    super(body.error);
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.code;
    this.issues = body.issues;
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3333").replace(/\/$/, "");

type QueryValue = string | number | undefined;

function toQueryString(params: Readonly<Record<string, QueryValue>>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Narrowing estrutural do envelope de erro (sem zod no bundle). */
function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { error?: unknown }).error === "string" &&
    typeof (value as { code?: unknown }).code === "string"
  );
}

export interface GetOptions {
  readonly params?: Readonly<Record<string, QueryValue>>;
  readonly signal?: AbortSignal;
}

/**
 * GET tipado. Os DOIS parses de JSON são guardados → nunca vaza SyntaxError cru:
 * cold start do Render (502/503 com HTML) ou 2xx com corpo inválido degradam p/
 * ApiClientError limpo. NÃO valida o corpo de sucesso com zod (regra zod-free).
 */
export async function apiGet<T>(path: string, options: GetOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}${toQueryString(options.params ?? {})}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options.signal,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    const envelope: ApiError = isApiError(body)
      ? body
      : { error: res.statusText || `HTTP ${res.status}`, code: "HTTP_ERROR" };
    throw new ApiClientError(res.status, envelope);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiClientError(res.status, {
      error: "resposta inválida do servidor (JSON esperado)",
      code: "BAD_JSON",
    });
  }
}
