import React, { useState } from 'react';
import { Factory } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientLogoProps {
  clientName?: string;
  groupName?: string | null | undefined;
  urlLogo?: string | null | undefined;
  className?: string;
}

export const ClientLogo: React.FC<ClientLogoProps> = ({ 
  clientName = '', 
  groupName = undefined,
  urlLogo = undefined, 
  className = 'w-24 h-12' 
}) => {
  const [imgError, setImgError] = useState(false);
  const name = (clientName || groupName || '').toUpperCase();

  // Dicionário de Logos "Fonte da Verdade" solicitado
  const logoMap: Record<string, string> = {
    "FRUTAL BIOENERGIA LTDA": "https://upload.wikimedia.org/wikipedia/commons/1/11/Bunge_logo.svg",
    "TROPICAL BIOENERGIA S/A": "https://upload.wikimedia.org/wikipedia/commons/1/11/Bunge_logo.svg",
    "ITAPAGIPE BIOENERGIA LTDA": "https://upload.wikimedia.org/wikipedia/commons/1/11/Bunge_logo.svg",
    "BP BIOENERGIA ITUIUTABA LTDA": "https://upload.wikimedia.org/wikipedia/commons/1/11/Bunge_logo.svg",
    "MOEMA BIOENERGIA S.A.": "https://upload.wikimedia.org/wikipedia/commons/1/11/Bunge_logo.svg",
    "RAIZEN ENERGIA S.A.": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ra%C3%ADzen_logo.svg",
    "BONFIM - E2G": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ra%C3%ADzen_logo.svg",
    "RAIZEN CENTRO SUL S/A": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ra%C3%ADzen_logo.svg",
    "TEREOS AÇUCAR E ENERGIA BRASIL S.A": "https://upload.wikimedia.org/wikipedia/commons/7/75/Tereos_logo.svg",
    "TEREOS MANDU": "https://upload.wikimedia.org/wikipedia/commons/7/75/Tereos_logo.svg",
    "ATVOS": "https://www.atvos.com/wp-content/themes/atvos/assets/img/logo-atvos.png",
    "RIO CLARO AGROINDUSTRIAL SA": "https://www.atvos.com/wp-content/themes/atvos/assets/img/logo-atvos.png",
    "USINA ELDORADO S/A": "https://www.atvos.com/wp-content/themes/atvos/assets/img/logo-atvos.png",
    "SAO MARTINHO S/A": "https://www.saomartinho.com.br/wp-content/uploads/2021/04/logo-sao-martinho.png",
    "IPIRANGA AGROINDUSTRIAL S/A": "https://www.ipirangaagro.com.br/images/logo.png",
    "USINA BARRALCOOL": "https://www.barralcool.com.br/assets/images/logo.png",
    "USINA BATATAIS S/A AÇUCAR E ALCOOL": "https://www.usinabatatais.com.br/assets/logo.png"
  };

  const effectiveUrl = logoMap[name] || urlLogo;

  // Se tiver URL e não deu erro, usa a imagem
  if (effectiveUrl && !imgError) {
    return (
      <div className={cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm overflow-hidden", className)}>
        <img 
          src={effectiveUrl} 
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Fallback baseado em SVG para grandes grupos conhecidos (mesmo que a URL falhe)
  if (name.includes('RAIZEN')) {
    return (
      <div className={cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm", className)}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#721C8A" fontFamily="sans-serif" fontWeight="900" fontSize="28">raízen</text>
        </svg>
      </div>
    );
  }

  if (name.includes('TEREOS')) {
    return (
      <div className={cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm", className)}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#E2001A" fontFamily="sans-serif" fontWeight="900" fontSize="26" letterSpacing="1">TEREOS</text>
        </svg>
      </div>
    );
  }

  if (name.includes('SAO MARTINHO') || name.includes('SÃO MARTINHO')) {
    return (
      <div className={cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm", className)}>
        <svg viewBox="0 0 180 50" className="w-full h-full">
          <circle cx="20" cy="25" r="10" fill="#007A33" />
          <text x="100" y="32" textAnchor="middle" fill="#007A33" fontFamily="sans-serif" fontWeight="800" fontSize="18">SÃO MARTINHO</text>
        </svg>
      </div>
    );
  }

  // Fallback Executive Premium com iniciais do GRUPO
  const displayGroupName = groupName || clientName;
  const initials = displayGroupName
    .split(' ')
    .filter(w => !['USINA', 'AGRO', 'DE', 'DA', 'DO', 'S/A', 'SA'].includes(w.toUpperCase()))
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const cleanNameForAvatar = displayGroupName
    .replace(/USINA|DESTILARIA|AGROINDUSTRIAL|INDUSTRIA|COMERCIO|S\/A|S\.A|LTDA|EPP/g, '')
    .trim();

  return (
    <div className={cn("bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center shadow-lg p-1 group-hover:from-emerald-900 group-hover:to-slate-900 transition-all duration-500 relative overflow-hidden", className)}>
      <Factory className="absolute inset-0 m-auto opacity-10 text-emerald-500 w-12 h-12 -rotate-12" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        <span className="text-[10px] text-slate-400 font-bold uppercase text-center px-1 leading-tight group-hover:text-emerald-200 transition-colors">
          {cleanNameForAvatar}
        </span>
      </div>
    </div>
  );
};
