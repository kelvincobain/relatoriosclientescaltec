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
        "print-card bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between min-h-[340px] transition-all hover:shadow-xl hover:shadow-black/40",
        className,
      )}
    >

      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>
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