/**
 * Cores dos gráficos (Recharts não lê classes Tailwind → passamos hex). Espelham
 * os tokens de index.css @theme; reler via useTheme p/ recolorir ao alternar tema.
 */
export function chartColors(isDark: boolean) {
  return {
    grid: isDark ? "#262b2e" : "#e7e5e0",
    axis: isDark ? "#9ca3a3" : "#78716c",
    flame: "#f97316",
    petro: "#0e7c66",
    up: "#dc2626",
    down: "#16a34a",
  } as const;
}
