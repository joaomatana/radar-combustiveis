import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsync } from "./useAsync";

/** Sonda: expõe o estado do hook no DOM (sem API real). */
function Probe({ fn, deps }: { fn: (signal: AbortSignal) => Promise<string>; deps: unknown[] }) {
  const { data, loading, error } = useAsync(fn, deps);
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="data">{data ?? ""}</span>
      <span data-testid="error">{error?.message ?? ""}</span>
    </div>
  );
}

describe("useAsync", () => {
  it("resolve: data preenchida e loading=false", async () => {
    const fn = vi.fn(async () => "ok");
    render(<Probe fn={fn} deps={[]} />);
    await waitFor(() => expect(screen.getByTestId("data").textContent).toBe("ok"));
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("rejeita: captura erro e zera loading", async () => {
    const fn = vi.fn(async () => {
      throw new Error("falhou");
    });
    render(<Probe fn={fn} deps={[]} />);
    await waitFor(() => expect(screen.getByTestId("error").textContent).toBe("falhou"));
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it("ignora resposta obsoleta quando deps mudam no meio do voo", async () => {
    const deferred: Array<(v: string) => void> = [];
    const fn = vi.fn(
      (_signal: AbortSignal) =>
        new Promise<string>((resolve) => {
          deferred.push(resolve);
        }),
    );

    const { rerender } = render(<Probe fn={fn} deps={["a"]} />);
    rerender(<Probe fn={fn} deps={["b"]} />);
    expect(fn).toHaveBeenCalledTimes(2);

    // Resolve a 2ª (mais recente) e depois a 1ª (obsoleta): o guard mantém "novo".
    await act(async () => {
      deferred[1]?.("novo");
      deferred[0]?.("antigo");
    });

    await waitFor(() => expect(screen.getByTestId("data").textContent).toBe("novo"));
  });
});
