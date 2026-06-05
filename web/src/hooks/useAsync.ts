import { type DependencyList, useCallback, useEffect, useRef, useState } from "react";

export type AsyncFn<T> = (signal: AbortSignal) => Promise<T>;

export interface AsyncState<T> {
  readonly data: T | undefined;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly reload: () => void;
}

/**
 * Executa `fn` ao montar e quando `deps` mudam (troca de filtro).
 * - Ignora resposta obsoleta (corrida): só a última execução escreve o state (runId).
 * - Aborta a requisição anterior (AbortController).
 * - StrictMode-safe: o cleanup aborta a 1ª execução do double-invoke do React 19 dev.
 */
export function useAsync<T>(fn: AsyncFn<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const runIdRef = useRef(0);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps vêm do caller; nonce força reload.
  useEffect(() => {
    const runId = ++runIdRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    fn(controller.signal)
      .then((result) => {
        if (runId === runIdRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || runId !== runIdRef.current) {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}
