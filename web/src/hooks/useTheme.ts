import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "radar-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Store de módulo: o tema é estado COMPARTILHADO entre todos os consumidores
// (ThemeToggle + os charts). Com useState local por hook, alternar o tema não
// recoloriria os gráficos (cada cópia teria estado próprio).
let current: Theme = readInitial();
const listeners = new Set<() => void>();

function apply(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

apply(current); // aplica o tema inicial ao carregar o módulo

function setTheme(theme: Theme): void {
  current = theme;
  apply(theme);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tema light/dark compartilhado (.dark no <html>, persistido, default prefers-color-scheme). */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => "light" as Theme,
  );
  const toggle = useCallback(() => {
    setTheme(current === "light" ? "dark" : "light");
  }, []);
  return { theme, toggle };
}
