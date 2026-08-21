import { useEffect } from "react";
import { Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

interface SearchBarProps {
  options: { label: string; value: string; type: string }[];
  onSelect: (value: string, type: string) => void;
}

export function AdvancedSearch({ options, onSelect }: SearchBarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto relative group">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button 
            className="w-full h-14 bg-card border border-border rounded-xl px-5 flex items-center gap-3 text-muted-foreground hover:border-primary/50 transition-all shadow-2xl backdrop-blur-md text-left"
            onClick={() => setOpen(true)}
          >
            <Search className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium">Buscar por cliente, cidade ou UF...</span>
            <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border bg-card shadow-2xl" align="start">
          <Command className="bg-card">
            <CommandInput placeholder="Digite para filtrar..." className="h-12 border-none ring-0 focus:ring-0" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup heading="Clientes">
                {options.filter(o => o.type === 'client').map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onSelect(option.value, 'client');
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer py-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {option.label.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Cliente</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Cidades">
                {options.filter(o => o.type === 'city').map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onSelect(option.value, 'city');
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer py-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">
                      C
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Cidade</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
