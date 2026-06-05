import { Flame } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { ThemeToggle } from "./components/ui/ThemeToggle";

/** Casca da aplicação: header fixo (marca + nota ANP + tema) e o Dashboard no main. */
export function App() {
  return (
    <div className="min-h-dvh bg-bg text-fg antialiased">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-flame-500/15 text-flame-500">
              <Flame className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-fg">
                Radar · Combustíveis
              </span>
              <span className="text-[11px] text-muted">
                Fonte: ANP — Série Histórica de Preços de Combustíveis
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <Dashboard />
      </main>
    </div>
  );
}
