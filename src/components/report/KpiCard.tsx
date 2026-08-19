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
        "print-card bg-[#1E293B] border border-[#334155] rounded-xl p-5 flex flex-col justify-between min-h-[320px] transition-all hover:shadow-lg",
        className
      )}
    >
      <header className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          {label}
        </span>
        {icon ? <span className="text-[#F59E0B]">{icon}</span> : null}
      </header>

      <div className="flex flex-col flex-1 justify-center py-4">
        <p className="text-4xl font-extrabold text-white my-auto">
          {value}
          {unit ? (
            <span className="ml-2 text-xl font-medium text-[#94A3B8]">
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