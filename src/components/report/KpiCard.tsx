import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="print-card relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-md transition-all hover:shadow-lg">
      <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-primary/5 blur-3xl" />
      <div className="flex items-center justify-between">
        <span className="print-muted text-[12px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="print-text mt-4 text-4xl leading-none font-bold tracking-tight text-foreground">
        {value}
        {unit ? (
          <span className="print-muted ml-1 text-base font-medium text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? (
        <p className="print-muted mt-3 text-sm font-medium text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
