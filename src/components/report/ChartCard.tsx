import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  subtitle,
  action,
  className,
  children,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        "print-card bg-[#131C2E] border border-[#1E293B] rounded-[10px] shadow-lg backdrop-blur-sm p-6 flex flex-col justify-between min-h-[340px] transition-all hover:shadow-black/40",
        className,
      )}
    >

      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className={cn("pl-4 relative", accent && "border-l-2 border-amber-500")}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-[10px] text-[#64748B] mt-1 uppercase tracking-wider">{subtitle}</p>
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