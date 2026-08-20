import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon,
  className,
  progress,
  badge,
  variant = "small",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
  progress?: {
    value: number; // 0-100
    color: string;
  };
  badge?: {
    text: string;
    variant: "success" | "warning" | "danger" | "default";
  };
  variant?: "small" | "large";
}) {
  return (
    <div
      className={cn(
        "print-card bg-[#131C2E] border border-[#1E293B] rounded-[10px] shadow-lg backdrop-blur-sm p-5 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-black/20 relative group overflow-hidden",
        className
      )}
    >
      {badge && (
        <div className={cn(
          "absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity",
          badge.variant === "success" && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
          badge.variant === "warning" && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
          badge.variant === "danger" && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
          badge.variant === "default" && "bg-slate-500/20 text-slate-400 border border-slate-500/30",
        )}>
          {badge.text}
        </div>
      )}
      
      <header className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
          {label}
        </span>
        {icon && !badge ? <span className="text-amber-500">{icon}</span> : null}
      </header>

      <div className="flex flex-col flex-1 justify-center py-2">
        <div className="flex items-baseline gap-1">
          <p className={cn(
            "font-bold tracking-tight text-slate-100",
            variant === "large" ? "text-4xl sm:text-5xl md:text-6xl" : "text-3xl"
          )}>
            {value}
          </p>
          {unit ? (
            <span className="text-xs font-medium text-slate-500 mb-1">
              {unit}
            </span>
          ) : null}
        </div>
        
        {progress && (
          <div className="mt-3 w-full">
            <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000" 
                style={{ 
                  width: `${progress.value}%`,
                  backgroundColor: progress.color 
                }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-slate-500">
              {progress.value.toFixed(0)}% do total
            </p>
          </div>
        )}
      </div>

      {hint ? (
        <p className="text-sm font-medium text-[#F59E0B]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}