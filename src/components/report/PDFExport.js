import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoPrint from '@/assets/caltec-logo-print.png.asset.json';
import { ChartCard } from './ChartCard';
import { KpiCard } from './KpiCard';
import { ClientLogo } from '../ClientLogo';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, ReferenceLine, Cell, LabelList } from 'recharts';
import { formatNumber } from '@/lib/report-metrics';
// Helper for charts in PDF (static, no animation)
const PDFChartContainer = ({ children, height = 280 }) => (_jsx("div", { style: { height, width: '100%', position: 'relative' }, children: _jsx(ResponsiveContainer, { width: "100%", height: height, children: children }) }));
export const PrintOnlyReport = React.forwardRef((props, ref) => {
    const { client, city, state, year, lastUpdateDate, monthly, yearTotals, truckLabel, truckKey, otdByMonth, otdYear, serviceStats, carriers, dischargeByMonth, avgDischargeYear, bands, cancelsMonthly, selection, DISCHARGE_START_MONTH, MONTH_LABELS, GRID, GRID_DASH, X_AXIS_PROPS, Y_AXIS_HIDDEN } = props;
    if (!client)
        return null;
    return (_jsxs("div", { ref: ref, className: "hidden print:block w-[210mm] mx-auto bg-[#0B0F19] text-white p-[15mm] min-h-screen", style: {
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
        }, children: [
            _jsxs("header", { className: "flex justify-between items-start border-b border-slate-700 pb-6 mb-8", children: [
                    _jsxs("div", { className: "flex items-center gap-6", children: [
                            _jsx("img", { src: logoPrint.url, alt: "Caltec", className: "h-16 w-auto" }), _jsxs("div", { className: "border-l border-slate-700 pl-6", children: [
                                    _jsx("p", { className: "text-[10px] tracking-[0.2em] text-slate-400 uppercase", children: "Relat\u00F3rio do cliente \u2014 Cal industrial" }), _jsx("h1", { className: "text-xl font-bold text-white", children: "Relat\u00F3rio Log\u00EDstico" }), lastUpdateDate && (_jsxs("p", { className: "text-[10px] font-medium text-blue-400 mt-0.5", children: ["Atualizado at\u00E9: ", lastUpdateDate.toLocaleDateString('pt-BR')] }))] })
                        ] }), _jsxs("div", { className: "text-right", children: [
                            _jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: "Documento Oficial" }), _jsx("p", { className: "text-sm font-bold text-white mt-1", children: new Date().toLocaleDateString('pt-BR') })
                        ] })
                ] }), _jsxs("section", { className: "bg-[#131C2E] border border-slate-700 rounded-2xl p-6 mb-8 flex items-center gap-6", children: [
                    _jsx("div", { className: "bg-white p-2 rounded-xl border border-white/10 w-24 h-24 flex items-center justify-center shrink-0", children: _jsx(ClientLogo, { clientName: client, className: "w-full h-full" }) }), _jsxs("div", { children: [
                            _jsx("h2", { className: "text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2", children: client }), _jsxs("p", { className: "text-sm font-bold text-slate-400 uppercase tracking-[0.2em]", children: [city, " \u2014 ", state] })
                        ] })
                ] }), _jsxs("div", { className: "space-y-8", children: [
                    _jsxs("div", { className: "space-y-4 break-inside-avoid", children: [
                            _jsx("h3", { className: "text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500", children: "Fluxo de Volume" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
                                    _jsx(ChartCard, { title: "Volume por m\u00EAs", subtitle: `Toneladas · ${year}`, className: "min-h-0 h-auto py-6", children: _jsx(PDFChartContainer, { children: _jsxs(BarChart, { data: monthly, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                    _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.ceil(dataMax * 1.5)] }), _jsx(Bar, { dataKey: "tons", fill: "#38BDF8", radius: [4, 4, 0, 0], children: _jsx(LabelList, { dataKey: "tons", position: "top", formatter: (v) => v > 0 ? `${formatNumber(v, 2)}t` : "", style: { fontSize: 10, fill: "#94A3B8", fontWeight: 600 }, dy: -8 }) })
                                                ] }) }) }), _jsx(KpiCard, { label: "Volume no ano", value: formatNumber(yearTotals.tons, 2), unit: "Toneladas", variant: "large", className: "min-h-0 h-auto py-6" })
                                ] })
                        ] }), _jsxs("div", { className: "space-y-4 break-inside-avoid", children: [
                            _jsx("h3", { className: "text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500", children: "Fluxo de Carregamentos" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
                                    _jsx(ChartCard, { title: "Caminh\u00F5es por m\u00EAs", subtitle: `${truckLabel} · ${year}`, className: "min-h-0 h-auto py-6", children: _jsx(PDFChartContainer, { children: _jsxs(BarChart, { data: monthly, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                    _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.ceil(dataMax * 1.5)] }), _jsx(Bar, { dataKey: truckKey, fill: "#8B5CF6", radius: [4, 4, 0, 0], children: _jsx(LabelList, { dataKey: truckKey, position: "top", formatter: (v) => v > 0 ? v : "", style: { fontSize: 10, fill: "#94A3B8", fontWeight: 600 }, dy: -8 }) })
                                                ] }) }) }), _jsx(KpiCard, { label: "Caminh\u00F5es no ano", value: formatNumber(yearTotals.loads), unit: "Viagens", variant: "large", className: "min-h-0 h-auto py-6" })
                                ] })
                        ] }), _jsxs("div", { className: "space-y-4 break-inside-avoid", children: [
                            _jsx("h3", { className: "text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500", children: "N\u00EDvel de Servi\u00E7o (OTD)" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
                                    _jsx(ChartCard, { title: "OTD do Per\u00EDodo", subtitle: `Aderência por mês · ${year}`, className: "min-h-0 h-auto py-6", children: _jsx(PDFChartContainer, { children: _jsxs(BarChart, { data: otdByMonth, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                    _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, 115] }), _jsxs(Bar, { dataKey: "rate", radius: [4, 4, 0, 0], children: [otdByMonth.map((entry, index) => (_jsx(Cell, { fill: entry.rate >= 98 ? "#10b981" : "#ef4444" }, `cell-${index}`))), _jsx(LabelList, { dataKey: "rate", position: "top", formatter: (v) => (v > 0 ? `${formatNumber(v, 1)}%` : ""), fill: "#FFFFFF", style: { fontSize: 10, fontWeight: 700 }, dy: -8 })
                                                        ] })
                                                ] }) }) }), _jsxs("div", { className: "bg-[#131C2E] border border-slate-700 rounded-2xl p-6 flex justify-between items-center", children: [
                                            _jsxs("div", { children: [
                                                    _jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1", children: "OTD Acumulado" }), _jsxs("p", { className: `text-4xl font-black ${otdYear.rate >= 98 ? 'text-emerald-500' : 'text-red-500'}`, children: [formatNumber(otdYear.rate ?? 0, 1), "%"] })
                                                ] }), _jsxs("div", { className: "text-right text-[10px] font-bold text-slate-400 space-y-1", children: [
                                                    _jsxs("p", { children: ["Aderente: ",
                                                            _jsx("span", { className: "text-emerald-500", children: formatNumber(otdYear.adherent) })
                                                        ] }), _jsxs("p", { children: ["Atraso: ",
                                                            _jsx("span", { className: "text-red-500", children: formatNumber(otdYear.notAdherent) })
                                                        ] }), _jsxs("p", { className: "pt-1 border-t border-slate-700 mt-1", children: ["Total: ",
                                                            _jsx("span", { className: "text-white", children: formatNumber(otdYear.total) })
                                                        ] })
                                                ] })
                                        ] })
                                ] })
                        ] }), _jsxs("div", { className: "space-y-4 break-inside-avoid", children: [
                            _jsx("h3", { className: "text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500", children: "Tempo de Atendimento" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                                    _jsx(KpiCard, { label: "No Prazo", value: String(serviceStats.onTime), unit: "Cargas", className: "min-h-0 h-auto py-6", badge: { text: "On Time", variant: "success" } }), _jsx(KpiCard, { label: "Antecipado/Urgente", value: String(serviceStats.urgent), unit: "Cargas", className: "min-h-0 h-auto py-6", badge: { text: "Urgente", variant: "warning" } })
                                ] })
                        ] }), _jsxs("div", { className: "space-y-4 break-inside-avoid", children: [
                            _jsx("h3", { className: "text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500", children: "Performance de Descarga" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
                                    _jsx(ChartCard, { title: "Tempo m\u00E9dio de descarga", subtitle: "Horas por m\u00EAs", className: "min-h-0 h-auto py-6", children: _jsx(PDFChartContainer, { children: _jsxs(AreaChart, { data: dischargeByMonth, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                    _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.max(35, Math.ceil(dataMax * 1.5))] }), _jsx(ReferenceLine, { y: 5, stroke: "#F59E0B", strokeDasharray: "5 5", label: { value: "SLA: 5h", fill: '#F59E0B', fontSize: 10, fontWeight: 700 } }), _jsx(Area, { type: "monotone", dataKey: "hours", stroke: "#F59E0B", strokeWidth: 3, fill: "#F59E0B", fillOpacity: 0.1, children: _jsx(LabelList, { dataKey: "hours", position: "top", formatter: (v) => v > 0 ? `${formatNumber(v, 1)}h` : "", style: { fontSize: 10, fill: "#94A3B8", fontWeight: 600 }, dy: -10 }) })
                                                ] }) }) }), _jsx(KpiCard, { label: "Tempo M\u00E9dio Ano", value: formatNumber(avgDischargeYear, 1), unit: "Horas", variant: "large", className: "min-h-0 h-auto py-6" })
                                ] })
                        ] }), _jsxs("div", { className: "space-y-4 break-inside-avoid", children: [
                            _jsx("h3", { className: "text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500", children: "Cancelamentos" }), _jsx(ChartCard, { title: "Cancelamentos Mensais", subtitle: "Ocorr\u00EAncias", className: "min-h-0 h-auto py-6", children: _jsx(PDFChartContainer, { children: _jsxs(BarChart, { data: cancelsMonthly, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                            _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.ceil(dataMax * 1.5)] }), _jsx(Bar, { dataKey: "cancellations", fill: "#f59e0b", radius: [4, 4, 0, 0], children: _jsx(LabelList, { dataKey: "cancellations", position: "top", style: { fontSize: 12, fill: "#FFFFFF", fontWeight: 700 }, dy: -8 }) })
                                        ] }) }) })
                        ] })
                ] }), _jsxs("footer", { className: "mt-12 pt-6 border-t border-slate-700 flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest", children: [
                    _jsx("span", { children: "caltec.com.br \u00B7 Documento Gerado Automaticamente" }), _jsx("span", { children: "\u00A9 2026 Caltec Log\u00EDstica" })
                ] })
        ] }));
});
export const PDFExportButton = ({ contentRef }) => {
    const reactToPrintFn = useReactToPrint({ contentRef });
    return (_jsxs(Button, { size: "sm", onClick: () => reactToPrintFn(), className: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all", children: [
            _jsx(FileDown, { className: "mr-2 h-4 w-4" }),
            "Gerar PDF"] }));
};
