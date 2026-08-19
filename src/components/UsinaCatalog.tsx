import React, { useState, useMemo } from 'react';
import { Search, MapPin, ExternalLink, Factory, Leaf, X } from 'lucide-react';
import { ClientLogo } from './ClientLogo';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Usina {
  Usina_Cliente: string;
  Cidade: string;
  UF: string;
  Dominio_Oficial: string;
  URL_Logo_Oficial: string;
}

interface UsinaCatalogProps {
  data: Usina[];
  onSelect?: (usina: Usina) => void;
  className?: string;
}

export const UsinaCatalog: React.FC<UsinaCatalogProps> = ({ data, onSelect, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUF, setSelectedUF] = useState<string>('all');

  const ufs = useMemo(() => {
    const uniqueUFs = Array.from(new Set(data.map((u) => u.UF))).sort();
    return uniqueUFs;
  }, [data]);

  const filteredUsinas = useMemo(() => {
    return data.filter((usina) => {
      const matchesSearch = 
        usina.Usina_Cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usina.Cidade.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUF = selectedUF === 'all' || usina.UF === selectedUF;
      
      return matchesSearch && matchesUF;
    });
  }, [data, searchTerm, selectedUF]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar usina ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-slate-400 whitespace-nowrap">Filtrar por UF:</span>
          <Select value={selectedUF} onValueChange={setSelectedUF}>
            <SelectTrigger className="w-[100px] bg-slate-800 border-slate-700 text-slate-200">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
              <SelectItem value="all">Todas</SelectItem>
              {ufs.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsinas.map((usina, idx) => (
          <UsinaCard 
            key={`${usina.Usina_Cliente}-${idx}`} 
            usina={usina} 
            onClick={() => onSelect?.(usina)}
          />
        ))}
      </div>

      {filteredUsinas.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 text-slate-500">
            <Search className="h-8 w-8" />
          </div>
          <p className="text-slate-400 font-medium">Nenhuma usina encontrada com os termos selecionados.</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedUF('all'); }}
            className="text-emerald-500 hover:text-emerald-400 text-sm font-bold underline underline-offset-4"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  );
};

const UsinaCard: React.FC<{ usina: Usina; onClick?: () => void }> = ({ usina, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="flex justify-center mb-6">
        <div className="relative">
          <ClientLogo 
            clientName={usina.Usina_Cliente} 
            className="w-24 h-24 shadow-lg group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute -inset-2 bg-emerald-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="space-y-3 flex-grow">
        <h3 className="text-white font-bold leading-tight group-hover:text-emerald-400 transition-colors">
          {usina.Usina_Cliente}
        </h3>
        
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
          <span>{usina.Cidade} — {usina.UF}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <a 
          href={`https://${usina.Dominio_Oficial}`} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-700 hover:text-white transition-colors"
        >
          {usina.Dominio_Oficial}
          <ExternalLink className="h-3 w-3" />
        </a>
        
        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-emerald-600 transition-all duration-300">
          <Factory className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
};
