import type { ReactNode } from "react";

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
  const isLarge = variant === "large";

  return (
    <div
      className={`print-card relative overflow-hidden rounded-xl border border-border bg-card shadow-md transition-all hover:shadow-lg p-6 ${className}`}
    >
      <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-primary/5 blur-3xl" />
      <div className="flex items-center justify-between">
        <span
          className="print-muted text-[12px] font-semibold tracking-wider text-muted-foreground uppercase"
        >
          {label}
        </span>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p
        className={`print-text leading-none font-bold tracking-tight text-foreground ${
          isLarge ? "mt-6 text-6xl" : "mt-4 text-4xl"
        }`}
      >
        {value}
        {unit ? (
          <span
            className={`print-muted ml-2 font-medium text-muted-foreground ${
              isLarge ? "text-2xl" : "text-base"
            }`}
          >
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? (
        <p
          className={`print-muted font-medium text-muted-foreground ${
            isLarge ? "mt-5 text-lg" : "mt-3 text-sm"
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
