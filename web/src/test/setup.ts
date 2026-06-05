import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Desmonta a árvore React entre testes (evita vazamento de DOM/efeitos).
afterEach(() => {
  cleanup();
});
