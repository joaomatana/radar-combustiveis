import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { cn } from "../../lib/cn";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  hint?: string;
  className?: string;
}

/**
 * <select> nativo estilizado e acessível (label por id). Genérico no tipo do valor
 * p/ preservar Uf/Produto. As options vêm de um domínio fechado, então o cast no
 * handler é seguro.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  className,
}: SelectProps<T>) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-wide text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value as T)}
          className={cn(
            "w-full appearance-none rounded-lg border border-border bg-surface",
            "py-2 pl-3 pr-9 text-sm font-medium text-fg",
            "transition-colors hover:border-fg/20",
            "focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/40",
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
      {hint ? <p className="text-[11px] text-muted/80">{hint}</p> : null}
    </div>
  );
}
