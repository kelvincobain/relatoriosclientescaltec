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
    <div className="print-card rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="print-muted text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="print-text mt-3 text-3xl leading-none font-semibold text-foreground">
        {value}
        {unit ? (
          <span className="print-muted ml-1 text-sm font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? (
        <p className="print-muted mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
