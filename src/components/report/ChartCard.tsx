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
        "print-card bg-[#131c2e] border border-[#1e293b] rounded-[8px] shadow-lg backdrop-blur-sm p-4 flex flex-col justify-between min-h-[220px] transition-all hover:shadow-black/40",
        className,
      )}
    >

      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </section>
  );
}

export function EmptyState({ label = "Sem dados para o período selecionado" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-[#64748B]">
      {label}
    </div>
  );
}