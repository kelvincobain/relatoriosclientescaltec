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
        "print-card bg-slate-900/70 border border-slate-800/80 rounded-[8px] shadow-lg backdrop-blur-sm p-4 flex flex-col justify-between transition-all hover:shadow-black/20",
        variant === "large" ? "min-h-[140px]" : "min-h-[80px]",
        className
      )}
    >
      <header className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">
          {label}
        </span>
        {icon ? <span className="text-amber-500/80">{icon}</span> : null}
      </header>

      <div className="flex flex-col flex-1 justify-center py-1">
        <p className={cn(
          "font-black tracking-tighter text-slate-100 leading-none",
          variant === "large" ? "text-4xl md:text-5xl" : "text-xl"
        )}>
          {value}
          {unit ? (
            <span className="ml-1 text-[10px] text-slate-400 font-medium">
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