import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "print-card bg-slate-800/50 border border-slate-700/80 rounded-xl p-6 flex flex-col justify-center min-h-[140px] transition-all hover:shadow-md shadow-sm",
        className
      )}
    >
      <header className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
        {icon ? <span className="text-indigo-400">{icon}</span> : null}
      </header>

      <div className="flex flex-col">
        <p className="text-3xl font-bold text-white tracking-tight leading-none">
          {value}
        </p>
        {unit ? (
          <span className="mt-1 text-sm font-medium text-slate-400">
            {unit}
          </span>
        ) : null}
      </div>

      {hint ? (
        <div className="mt-3 pt-2 border-t border-slate-700/50">
          <p className="text-xs font-medium text-indigo-400">
            {hint}
          </p>
        </div>
      ) : null}
    </div>
  );
}
