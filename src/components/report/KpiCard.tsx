import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon,
  className,
  variant = "small",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
  variant?: "small" | "large";
}) {
  return (
    <div
      className={cn(
        "print-card bg-slate-900/70 border border-slate-800/80 rounded-xl shadow-lg backdrop-blur-sm p-5 flex flex-col justify-between min-h-[320px] transition-all hover:shadow-black/20",
        className
      )}
    >
      <header className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon ? <span className="text-amber-500">{icon}</span> : null}
      </header>

      <div className="flex flex-col flex-1 justify-center py-4">
        <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 my-auto">
          {value}
          {unit ? (
            <span className="ml-2 text-xs text-slate-400">
              {unit}
            </span>
          ) : null}
        </p>
      </div>

      {hint ? (
        <p className="text-sm font-medium text-[#F59E0B]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}