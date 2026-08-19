import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "print-card rounded-xl border border-border bg-card p-6 shadow-md transition-all hover:shadow-lg",
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="print-text text-sm font-semibold tracking-wide text-foreground uppercase">
            {title}
          </h3>
          {subtitle ? (
            <p className="print-muted mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ label = "Sem dados para o período selecionado" }: { label?: string }) {
  return (
    <div className="print-muted flex h-[220px] items-center justify-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
