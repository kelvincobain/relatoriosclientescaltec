import React from 'react';
import { Factory } from 'lucide-react';

interface ClientLogoProps {
  clientName?: string;
  className?: string;
}

export const ClientLogo: React.FC<ClientLogoProps> = ({ clientName = '', className = 'w-24 h-12' }) => {
  const name = clientName.toUpperCase().replace(/\\/g, '/');

  // 1. RAIZEN
  if (name.includes('RAIZEN')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#721C8A" fontFamily="sans-serif" fontWeight="900" fontSize="28">raízen</text>
        </svg>
      </div>
    );
  }

  // 2. TEREOS
  if (name.includes('TEREOS')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#E2001A" fontFamily="sans-serif" fontWeight="900" fontSize="26" letterSpacing="1">TEREOS</text>
        </svg>
      </div>
    );
  }

  // 3. SÃO MARTINHO
  if (name.includes('SAO MARTINHO') || name.includes('SÃO MARTINHO')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 180 50" className="w-full h-full">
          <circle cx="20" cy="25" r="10" fill="#007A33" />
          <text x="100" y="32" textAnchor="middle" fill="#007A33" fontFamily="sans-serif" fontWeight="800" fontSize="18">SÃO MARTINHO</text>
        </svg>
      </div>
    );
  }

  // 4. ADECOAGRO
  if (name.includes('ADECOAGRO')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="33" textAnchor="middle" fill="#00843D" fontFamily="sans-serif" fontWeight="800" fontSize="22">adecoagro</text>
        </svg>
      </div>
    );
  }

  // 5. CERRADINHO BIO
  if (name.includes('CERRADINHO')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="28" textAnchor="middle" fill="#1B8338" fontFamily="sans-serif" fontWeight="900" fontSize="18">CERRADINHO</text>
          <text x="50%" y="42" textAnchor="middle" fill="#F39200" fontFamily="sans-serif" fontWeight="700" fontSize="12" letterSpacing="2">BIO</text>
        </svg>
      </div>
    );
  }

  // 6. PEDRA AGROINDUSTRIAL
  if (name.includes('PEDRA')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#006837" fontFamily="sans-serif" fontWeight="900" fontSize="24">PEDRA</text>
        </svg>
      </div>
    );
  }

  // 7. COCAL
  if (name.includes('COCAL')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#007236" fontFamily="sans-serif" fontWeight="900" fontSize="26">COCAL</text>
        </svg>
      </div>
    );
  }

  // 8. CRV INDUSTRIAL
  if (name.includes('CRV')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#0054A6" fontFamily="sans-serif" fontWeight="900" fontSize="28">CRV</text>
        </svg>
      </div>
    );
  }

  // 9. IPIRANGA AGROINDUSTRIAL
  if (name.includes('IPIRANGA')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="32" textAnchor="middle" fill="#003B71" fontFamily="sans-serif" fontWeight="900" fontSize="22">IPIRANGA</text>
        </svg>
      </div>
    );
  }

  // 10. CLEALCO
  if (name.includes('CLEALCO')) {
    return (
      <div className={`bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm ${className}`}>
        <svg viewBox="0 0 160 50" className="w-full h-full">
          <text x="50%" y="34" textAnchor="middle" fill="#008542" fontFamily="sans-serif" fontWeight="900" fontSize="24">CLEALCO</text>
        </svg>
      </div>
    );
  }

  // SELO EXECUTIVO PARA DEMAIS USINAS (NUNCA QUEBRA E MANTÉM PADRÃO DE HIGH TECH)
  const cleanName = name
    .replace(/USINA|DESTILARIA|AGROINDUSTRIAL|INDUSTRIA|COMERCIO|S\/A|S\.A|LTDA|EPP/g, '')
    .trim();

  return (
    <div className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center shadow-lg p-1 group-hover:from-emerald-900 group-hover:to-slate-900 transition-all duration-500 relative overflow-hidden ${className}`}>
      <Factory className="absolute inset-0 m-auto opacity-30 text-emerald-500 w-12 h-12 -rotate-12" />
      
      <div className="relative z-10 flex flex-col items-center justify-end h-full w-full pb-1">
        <div className="h-0.5 w-8 bg-emerald-500/50 rounded-full mb-1" />
        <span className="text-[8px] text-slate-300 font-black tracking-widest uppercase truncate max-w-[80px] px-1 drop-shadow-md">
          {cleanName.split(' ')[0]}
        </span>
      </div>
    </div>
  );
};