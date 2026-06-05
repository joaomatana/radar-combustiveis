import { Inbox, RotateCw, TriangleAlert } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { Skeleton } from "./ui/Skeleton";

interface StateWrapperProps {
  loading: boolean;
  error: Error | undefined;
  /** true quando a requisição terminou sem dados úteis (0 linhas, série toda nula...). */
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  /** altura mínima p/ o estado não "pular" entre loading/conteúdo. */
  minHeight?: string;
  /** mostra a dica de cold start (Render free ~50s) após alguns segundos de loading. */
  wakeHint?: boolean;
  children: ReactNode;
}

/** Casca de estado assíncrono: loading | error (+retry) | empty | conteúdo. */
export function StateWrapper({
  loading,
  error,
  isEmpty = false,
  emptyMessage = "Sem dados para a seleção atual.",
  onRetry,
  minHeight = "16rem",
  wakeHint = false,
  children,
}: StateWrapperProps) {
  if (loading) {
    return <LoadingState minHeight={minHeight} wakeHint={wakeHint} />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 text-center"
        style={{ minHeight }}
      >
        <TriangleAlert className="size-6 text-up" aria-hidden="true" />
        <p className="max-w-xs text-sm text-muted">
          Não foi possível carregar os dados.
          <span className="block text-xs opacity-70">{error.message}</span>
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5",
              "text-sm font-medium text-fg transition-colors hover:bg-flame-500/10",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-flame-500",
            )}
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Tentar de novo
          </button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 text-center"
        style={{ minHeight }}
      >
        <Inbox className="size-6 text-muted" aria-hidden="true" />
        <p className="max-w-xs text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Loading com dica de cold start: após ~4s sem resposta, avisa que a API (Render
 *  free) pode estar "acordando" — evita um skeleton em branco por ~50s no 1º acesso. */
function LoadingState({ minHeight, wakeHint }: { minHeight: string; wakeHint: boolean }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!wakeHint) {
      return;
    }
    const id = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(id);
  }, [wakeHint]);

  return (
    <div className="flex flex-col gap-3" style={{ minHeight }} aria-busy="true">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-full min-h-[10rem] flex-1 rounded-lg" />
      {slow ? (
        <p className="text-center text-xs text-muted">Acordando a API (plano gratuito, ~50s)…</p>
      ) : null}
    </div>
  );
}
