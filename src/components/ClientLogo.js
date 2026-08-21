import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
export const ClientLogo = ({ clientName = '', groupName = undefined, urlLogo = undefined, className = 'w-24 h-12' }) => {
    const [imgError, setImgError] = useState(false);
    const name = (clientName || groupName || '').toUpperCase();
    // Se tiver URL e não deu erro, usa a imagem
    if (urlLogo && !imgError) {
        return (_jsx("div", { className: cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm overflow-hidden", className), children: _jsx("img", { src: urlLogo, alt: name, className: "w-full h-full object-contain", onError: () => setImgError(true), crossOrigin: "anonymous", referrerPolicy: "no-referrer" }) }));
    }
    // Fallback baseado em SVG para grandes grupos conhecidos (mesmo que a URL falhe)
    if (name.includes('RAIZEN')) {
        return (_jsx("div", { className: cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm", className), children: _jsx("svg", { viewBox: "0 0 160 50", className: "w-full h-full", children: _jsx("text", { x: "50%", y: "34", textAnchor: "middle", fill: "#721C8A", fontFamily: "sans-serif", fontWeight: "900", fontSize: "28", children: "ra\u00EDzen" }) }) }));
    }
    if (name.includes('TEREOS')) {
        return (_jsx("div", { className: cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm", className), children: _jsx("svg", { viewBox: "0 0 160 50", className: "w-full h-full", children: _jsx("text", { x: "50%", y: "34", textAnchor: "middle", fill: "#E2001A", fontFamily: "sans-serif", fontWeight: "900", fontSize: "26", letterSpacing: "1", children: "TEREOS" }) }) }));
    }
    if (name.includes('SAO MARTINHO') || name.includes('SÃO MARTINHO')) {
        return (_jsx("div", { className: cn("bg-white rounded-lg p-2 border border-slate-700/40 flex items-center justify-center shadow-sm", className), children: _jsxs("svg", { viewBox: "0 0 180 50", className: "w-full h-full", children: [
                    _jsx("circle", { cx: "20", cy: "25", r: "10", fill: "#007A33" }), _jsx("text", { x: "100", y: "32", textAnchor: "middle", fill: "#007A33", fontFamily: "sans-serif", fontWeight: "800", fontSize: "18", children: "S\u00C3O MARTINHO" })
                ] }) }));
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
    return (_jsxs("div", { className: cn("bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center shadow-lg p-1 group-hover:from-emerald-900 group-hover:to-slate-900 transition-all duration-500 relative overflow-hidden", className), children: [
            _jsx(Factory, { className: "absolute inset-0 m-auto opacity-10 text-emerald-500 w-12 h-12 -rotate-12" }), _jsx("div", { className: "relative z-10 flex flex-col items-center justify-center h-full w-full", children: _jsx("span", { className: "text-[10px] text-slate-400 font-bold uppercase text-center px-1 leading-tight group-hover:text-emerald-200 transition-colors", children: cleanNameForAvatar }) })
        ] }));
};
