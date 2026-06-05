import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StateWrapper } from "./StateWrapper";

// A dica de cold start só faz sentido com o Render free na frente (acorda em ~50s).
// Local nunca reproduz isso; aqui adiantamos o relógio p/ provar o comportamento.
describe("StateWrapper — dica de cold start", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("com wakeHint, mostra a dica após ~4s de loading (não antes)", () => {
    render(
      <StateWrapper loading={true} error={undefined} wakeHint>
        <div>conteúdo</div>
      </StateWrapper>,
    );
    expect(screen.queryByText(/acordando a api/i)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText(/acordando a api/i)).toBeInTheDocument();
  });

  it("sem wakeHint, nunca mostra a dica", () => {
    render(
      <StateWrapper loading={true} error={undefined}>
        <div>conteúdo</div>
      </StateWrapper>,
    );
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.queryByText(/acordando a api/i)).toBeNull();
  });
});
