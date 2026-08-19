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
        "print-card bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between min-h-[320px] transition-all hover:shadow-lg hover:shadow-black/20",
        className
      )}
    >
      <header className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
        {icon ? <span className="text-[#F59E0B]">{icon}</span> : null}
      </header>

      <div className="flex flex-col flex-1 justify-center py-4">
        <p className="text-4xl font-extrabold text-white tracking-tight my-auto">
          {value}
          {unit ? (
            <span className="ml-2 text-xl font-medium text-slate-400">
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