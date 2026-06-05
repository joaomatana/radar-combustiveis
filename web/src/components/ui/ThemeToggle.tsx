import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { cn } from "../../lib/cn";

/** Alterna light/dark via useTheme (estado compartilhado). Ícone reflete o tema. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={isDark}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-border",
        "bg-surface text-fg transition-colors hover:bg-flame-500/10",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-flame-500",
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
