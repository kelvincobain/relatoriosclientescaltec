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
        "print-card bg-card border border-border rounded-[12px] shadow-lg backdrop-blur-sm p-4 flex flex-col justify-between items-center text-center min-h-[120px] h-full transition-all hover:border-primary/30 relative group overflow-hidden",
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
      
      <header className="flex items-center justify-center w-full">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </span>
        {icon && !badge ? <span className="ml-2 text-primary">{icon}</span> : null}
      </header>

      <div className="flex flex-col flex-1 justify-center py-2 w-full overflow-hidden">
        <div className="flex flex-col items-center">
          <p className={cn(
            "font-bold tracking-tight text-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full font-mono",
            variant === "large" ? "text-3xl md:text-5xl" : "text-3xl"
          )} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </p>
          {unit ? (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mt-1">
              {unit}
            </span>
          ) : null}
        </div>
        
        {progress && (
          <div className="mt-3 w-full">
            <div className="h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000" 
                style={{ 
                  width: `${progress.value}%`,
                  backgroundColor: progress.color 
                }}
              />
            </div>
            <p className="mt-1.5 text-[9px] font-medium text-muted-foreground">
              {progress.value.toFixed(0)}% do total
            </p>
          </div>
        )}
      </div>

      {hint ? (
        <p className="text-xs font-medium text-primary mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
}