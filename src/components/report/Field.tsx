import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}
