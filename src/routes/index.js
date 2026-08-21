import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PDFExportButton, PrintOnlyReport } from "@/components/report/PDFExport";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { Printer, RefreshCcw, Truck, Upload, Info, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/caltec-logo-dark.png.asset.json";
import logoPrint from "@/assets/caltec-logo-print.png.asset.json";
import heroAsset from "@/assets/hero-caltec.png.asset.json";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartCard, EmptyState } from "@/components/report/ChartCard";
import { ClientLogo } from "@/components/ClientLogo";
import { KpiCard } from "@/components/report/KpiCard";
import { COL, COCKPIT_COL, MONTH_LABELS, DISCHARGE_START_MONTH, norm, parseDate, parseWorkbook, str, dischargeHours, isCancelled, } from "@/lib/report-data";
import { averageDischarge, cancellationStats, cancellationsMonthly, carrierRanking, dischargeBands, dischargeMonthly, filterPeriod, formatNumber, formatCarrierName, getStates, getCities, getClients, getYears, monthlySeries, otdStats, scopeRows, scopeRowsAllProducts, totals, DISCHARGE_BANDS, yearlySeries, getClientInfo, getServiceTimeData, serviceTimeStats, } from "@/lib/report-metrics";
export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "Relatório do Cliente — Caltec | Cal Industrial" },
            {
                name: "description",
                content: "Relatório one page de operações de Cal industrial da Caltec: volume em toneladas, caminhões, OTD, tempo de descarga e cancelamentos por cidade e cliente.",
            },
            { property: "og:title", content: "Relatório do Cliente — Caltec | Cal Industrial" },
            {
                property: "og:description",
                content: "Painel de indicadores logísticos de Cal industrial: volume, OTD, tempo de descarga e cancelamentos por cliente.",
            },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
        ],
    }),
    component: ReportPage,
});
const AXIS = {
    stroke: "#334155",
    fontSize: 10,
    tickLine: false,
    axisLine: false,
    tick: { fill: "#94A3B8", fontWeight: 500 },
    interval: 0,
};
const X_AXIS_PROPS = {
    ...AXIS,
    padding: { left: 10, right: 10 }
};
const Y_AXIS_HIDDEN = {
    ...AXIS,
    width: 0,
    tick: false,
    axisLine: false,
    tickLine: false,
    hide: true
};
const GRID = "rgba(51, 65, 85, 0.2)";
const GRID_DASH = "3 3";
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        if (isMobile)
            return null;
        return (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md", children: [
                _jsx("p", { className: "mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest", children: label }), _jsx("div", { className: "space-y-1.5", children: payload.map((entry, index) => (_jsxs("div", { className: "flex items-center justify-between gap-4", children: [
                            _jsxs("span", { className: "flex items-center gap-1.5 text-xs font-medium text-foreground/80", children: [
                                    _jsx("div", { className: "h-2 w-2 rounded-full", style: { backgroundColor: entry.color || entry.fill } }), entry.name] }), _jsxs("span", { className: "text-sm font-bold text-foreground", children: [entry.name === "Volume" || entry.name === "Tons" || entry.name === "Peso"
                                        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(entry.value) + ' t'
                                        : entry.value, entry.unit || ""] })
                        ] }, index))) })
            ] }));
    }
    return null;
};
function ReportPage() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    const [dataset, setDataset] = useState(null);
    // Make dataset available for debugging in preview
    useEffect(() => {
        if (dataset) {
            window.dataset = dataset;
        }
    }, [dataset]);
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [client, setClient] = useState("");
    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(null);
    const [countDistinctPlates, setCountDistinctPlates] = useState(false);
    const [adminMode, setAdminMode] = useState(false);
    const fileInput = useRef(null);
    const cockpitFileInput = useRef(null);
    const contentRef = useRef(null);
    const [drillDownData, setDrillDownData] = useState({ open: false, title: "", rows: [] });
    const openDrillDown = (title, data) => {
        setDrillDownData({ open: true, title, rows: data });
    };
    useEffect(() => {
        async function init() {
            try {
                console.log("[Dashboard] Init started");
                const { loadDatasetFromIDB, saveDatasetToIDB } = await import("@/lib/report-persistence");
                const { getDefaultDataset, saveDataset } = await import("@/lib/report-data");
                console.log("[Dashboard] Initializing dataset...");
                let stored = await loadDatasetFromIDB();
                if (stored && stored.rows && stored.rows.length > 0) {
                    console.log("[Dashboard] Loaded from IDB:", stored.rows.length);
                    setDataset(stored);
                }
                else {
                    console.log("[Dashboard] IndexedDB empty, using default dataset");
                    const defaultDataset = await getDefaultDataset();
                    setDataset(defaultDataset);
                    // Also persist to IDB for future loads and legacy localStorage for safety
                    await saveDatasetToIDB(defaultDataset);
                    saveDataset(defaultDataset);
                }
            }
            catch (err) {
                console.error("[Dashboard] Init error:", err);
                const { getDefaultDataset } = await import("@/lib/report-data");
                const defaultDataset = await getDefaultDataset();
                setDataset(defaultDataset);
            }
        }
        init();
    }, []);
    useEffect(() => {
        setAdminMode(true);
        // Enable dark theme mode
        document.documentElement.classList.add('dark');
    }, []);
    const rows = dataset?.rows ?? [];
    const cockpitRows = dataset?.cockpitRows ?? [];
    const allRows = dataset?.rows ?? [];
    useEffect(() => {
        // We want the filters to be clear by default to improve speed and user control.
        // The previous auto-selection logic is removed to ensure it stays on the home page with clear filters.
    }, [dataset]);
    const states = useMemo(() => getStates(rows), [rows]);
    const cities = useMemo(() => getCities(rows, state), [rows, state]);
    const clients = useMemo(() => getClients(rows, city), [rows, city]);
    const years = useMemo(() => getYears(rows, city, client), [rows, city, client]);
    useEffect(() => {
        if (years.length && (year === null || !years.includes(year))) {
            if (years.includes(2026))
                setYear(2026);
            else
                setYear(years[years.length - 1] ?? null);
        }
    }, [years, year]);
    const selection = useMemo(() => ({ city, client, year, month }), [city, client, year, month]);
    const calRows = useMemo(() => scopeRows(rows, city, client), [rows, city, client]);
    const allScoped = useMemo(() => scopeRowsAllProducts(rows, city, client), [rows, city, client]);
    const yearRows = useMemo(() => filterPeriod(calRows, { ...selection, month: null }), [calRows, selection]);
    const periodRows = useMemo(() => filterPeriod(calRows, selection), [calRows, selection]);
    const monthly = useMemo(() => monthlySeries(calRows, year).filter(m => m.loads > 0 || m.tons > 0), [calRows, year]);
    const yearly = useMemo(() => yearlySeries(calRows, allScoped, selection), [calRows, allScoped, selection]);
    const carriers = useMemo(() => carrierRanking(yearRows), [yearRows]);
    const otdPeriod = useMemo(() => otdStats(periodRows), [periodRows]);
    const otdByMonth = useMemo(() => {
        return monthlySeries(calRows, year)
            .map(m => {
            const monthRows = filterPeriod(calRows, { ...selection, month: m.monthIndex });
            return {
                month: m.month,
                rate: otdStats(monthRows).rate || 0,
                total: otdStats(monthRows).total || 0,
            };
        })
            .filter(m => m.total > 0);
    }, [calRows, year, selection]);
    const otdYear = useMemo(() => otdStats(yearRows), [yearRows]);
    const dischargeByMonth = useMemo(() => dischargeMonthly(calRows, year).filter(m => !m.hidden), [calRows, year]);
    const bands = useMemo(() => dischargeBands(yearRows), [yearRows]);
    const cancels = useMemo(() => cancellationStats(calRows, allScoped, { ...selection, month: null }), [calRows, allScoped, selection]);
    const cancelsMonthly = useMemo(() => cancellationsMonthly(allScoped, selection), [allScoped, selection]);
    const yearTotals = useMemo(() => totals(yearRows), [yearRows]);
    const monthTotals = useMemo(() => totals(periodRows), [periodRows]);
    const avgDischargeYear = useMemo(() => averageDischarge(yearRows), [yearRows]);
    const serviceTimeData = useMemo(() => {
        return import.meta.env.SSR ? [] : getServiceTimeData(calRows, cockpitRows, selection);
    }, [calRows, cockpitRows, selection]);
    const serviceStats = useMemo(() => serviceTimeStats(serviceTimeData), [serviceTimeData]);
    const lastUpdateDate = useMemo(() => {
        const allDates = [];
        // Datas da Base Ojo
        rows.forEach(r => {
            const d = parseDate(r[COL.arrived]) || parseDate(r[COL.finished]) || parseDate(r[COL.pickup]) || parseDate(r[COL.plannedDelivery]);
            if (d)
                allDates.push(d);
        });
        // Datas da Base Cockpit
        cockpitRows.forEach(r => {
            const dInc = parseDate(r[COCKPIT_COL.inclusion] || r["Data Inclusão"] || r["Data Inclusao"]);
            const dCar = parseDate(r[COCKPIT_COL.loading] || r["Data Carregamento"]);
            if (dInc)
                allDates.push(dInc);
            if (dCar)
                allDates.push(dCar);
        });
        if (!allDates.length)
            return null;
        return new Date(Math.max(...allDates.map(d => d.getTime())));
    }, [rows, cockpitRows]);
    const ready = Boolean(rows.length > 0 && city && client);
    const truckKey = countDistinctPlates ? "plates" : "loads";
    const truckLabel = countDistinctPlates ? "Placas distintas" : "Carregamentos";
    const handleUpload = async (file, type) => {
        try {
            const parsed = await parseWorkbook(file);
            if (!parsed.length) {
                toast.error("Nenhuma linha encontrada no arquivo.");
                return;
            }
            const { mergeDatasets } = await import("@/lib/report-persistence");
            const currentRows = dataset?.rows ?? [];
            const currentCockpit = dataset?.cockpitRows ?? [];
            let nextRows = currentRows;
            let nextCockpit = currentCockpit;
            if (type === 'ojo') {
                nextRows = mergeDatasets(currentRows, parsed);
            }
            else {
                nextCockpit = mergeDatasets(currentCockpit, parsed);
            }
            const next = {
                rows: nextRows,
                cockpitRows: nextCockpit,
                fileName: file.name,
                updatedAt: new Date().toISOString(),
                isSample: false,
            };
            console.log(`[Dashboard] Updating ${type} dataset...`, {
                rows: next.rows.length,
                cockpit: next.cockpitRows.length
            });
            const { saveDatasetToIDB } = await import("@/lib/report-persistence");
            setDataset(next);
            await saveDatasetToIDB(next);
            if (type === 'ojo') {
                setCity("");
                setState("");
                setClient("");
                setYear(2026);
                setMonth(null);
            }
            toast.success(`${type === 'ojo' ? 'Base Ojo' : 'Base Cockpit'} atualizada e persistida: ${formatNumber(parsed.length)} novas linhas.`);
        }
        catch (error) {
            console.error(error);
            toast.error("Não foi possível ler o arquivo. Envie um Excel (.xlsx) ou CSV.");
        }
    };
    async function handleResetBase() {
        const { clearDatasetIDB } = await import("@/lib/report-persistence");
        const { getDefaultDataset } = await import("@/lib/report-data");
        await clearDatasetIDB();
        const defaultDataset = await getDefaultDataset();
        setDataset(defaultDataset);
        setCity("");
        setState("");
        setClient("");
        toast.success("Base de dados restaurada para o padrão nativo.");
    }
    return (_jsxs("div", { className: "print-sheet min-h-screen bg-slate-950 overflow-y-auto", children: [dataset?.rows?.length === 0 && (_jsx("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm", children: _jsxs("div", { className: "rounded-lg border border-border bg-card p-6 shadow-lg", children: [
                        _jsx("h2", { className: "text-xl font-bold", children: "Carregando dados..." }), _jsx("p", { className: "mt-2 text-muted-foreground", children: "Inicializando base nativa Caltec." })
                    ] }) })), _jsx("p", { className: "sr-only", children: "modelo celular o topo ficou cortado ajusta" }), _jsx("input", { ref: fileInput, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: (event) => {
                    const file = event.target.files?.[0];
                    if (file)
                        void handleUpload(file, 'ojo');
                    event.target.value = "";
                } }), _jsx("input", { ref: cockpitFileInput, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: (event) => {
                    const file = event.target.files?.[0];
                    if (file)
                        void handleUpload(file, 'cockpit');
                    event.target.value = "";
                } }), _jsx("header", { className: "sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur print:static print:bg-transparent", children: _jsxs("div", { className: "mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-5 py-4", children: [
                        _jsx("div", { className: "flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left", children: _jsxs("div", { className: "flex items-center gap-4", children: [
                                    _jsx("img", { src: logoDark.url, alt: "Caltec 80 anos", className: "h-12 sm:h-14 w-auto print:hidden" }), _jsx("img", { src: logoPrint.url, alt: "Caltec 80 anos", className: "hidden h-16 w-auto print:block" }), _jsxs("div", { className: "border-l border-border pl-4", children: [
                                            _jsx("p", { className: "print-muted text-[10px] sm:text-[11px] tracking-[0.2em] text-muted-foreground uppercase", children: "Relat\u00F3rio do cliente \u2014 Cal industrial" }), _jsx("h1", { className: "print-text text-base sm:text-lg font-semibold text-foreground", children: "Relat\u00F3rio Log\u00EDstico" }), lastUpdateDate && (_jsxs("p", { className: "text-[10px] font-medium text-blue-400 mt-0.5 animate-pulse", children: ["Base atualizada at\u00E9: ", lastUpdateDate.toLocaleDateString('pt-BR')] }))] })
                                ] }) }), _jsxs("div", { className: "no-print flex flex-wrap items-center justify-center gap-3", children: [
                                _jsxs("div", { className: "flex flex-wrap justify-center gap-2", children: [
                                        _jsxs(Button, { variant: "outline", size: "sm", onClick: () => fileInput.current?.click(), className: "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all", children: [
                                                _jsx(Upload, { className: "mr-2 h-4 w-4" }),
                                                "Base Ojo"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => cockpitFileInput.current?.click(), className: "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all", children: [
                                                _jsx(Upload, { className: "mr-2 h-4 w-4" }),
                                                "Base Cockpit"] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleResetBase, className: "text-slate-500 hover:text-red-400 transition-all ml-2", title: "Restaurar Base Padr\u00E3o", children: _jsx(RefreshCcw, { className: "h-4 w-4" }) })
                                    ] }), _jsx(PDFExportButton, { contentRef: contentRef }), _jsx("div", { className: "hidden", children: _jsx(PrintOnlyReport, { ref: contentRef, client: client, city: city, state: state, year: year, lastUpdateDate: lastUpdateDate, monthly: monthly, yearTotals: yearTotals, truckLabel: truckLabel, truckKey: truckKey, otdByMonth: otdByMonth, otdYear: otdYear, serviceStats: serviceStats, carriers: carriers, dischargeByMonth: dischargeByMonth, avgDischargeYear: avgDischargeYear, bands: bands, cancelsMonthly: cancelsMonthly, selection: selection, DISCHARGE_START_MONTH: DISCHARGE_START_MONTH, MONTH_LABELS: MONTH_LABELS, GRID: GRID, GRID_DASH: GRID_DASH, X_AXIS_PROPS: X_AXIS_PROPS, Y_AXIS_HIDDEN: Y_AXIS_HIDDEN }) })
                            ] })
                    ] }) }), _jsx("div", { className: "no-print border-t border-border bg-slate-900/30", children: _jsxs("div", { className: "mx-auto flex flex-col md:flex-row md:flex-nowrap items-stretch md:items-center gap-2 md:gap-4 px-5 py-4 overflow-x-auto whitespace-nowrap", children: [
                        _jsx(Field, { label: "Estado (UF)", className: "w-full md:flex-1 md:min-w-[100px] md:max-w-[140px]", children: _jsxs(Select, { value: state, onValueChange: (value) => {
                                    setState(value);
                                    setCity("");
                                    setClient("");
                                }, children: [
                                    _jsx(SelectTrigger, { className: "w-full relative z-50", children: _jsx(SelectValue, { placeholder: "UF" }) }), _jsx(SelectContent, { children: states.map((option) => (_jsx(SelectItem, { value: option, children: option }, option))) })
                                ] }) }), _jsx(Field, { label: "Cidade", className: "w-full md:flex-[2] md:min-w-[200px]", children: _jsxs(Select, { value: city, onValueChange: (value) => {
                                    setCity(value);
                                    setClient("");
                                    const foundRow = rows.find(r => norm(r[COL.city]) === norm(value));
                                    if (foundRow)
                                        setState(str(foundRow[COL.uf]));
                                }, children: [
                                    _jsx(SelectTrigger, { className: "w-full relative z-50", children: _jsx(SelectValue, { placeholder: "Selecione a cidade" }) }), _jsx(SelectContent, { children: cities.map((option) => (_jsx(SelectItem, { value: option, children: option }, option))) })
                                ] }) }), _jsx(Field, { label: "Cliente", className: "w-full md:flex-[3] md:min-w-[250px]", children: _jsxs(Select, { value: client, onValueChange: (value) => {
                                    setClient(value);
                                    const foundRow = rows.find(r => norm(r[COL.client]) === norm(value) &&
                                        (!city || norm(r[COL.city]) === norm(city))) || rows.find(r => norm(r[COL.client]) === norm(value));
                                    if (foundRow) {
                                        setCity(str(foundRow[COL.city]));
                                        setState(str(foundRow[COL.uf]));
                                    }
                                }, children: [
                                    _jsx(SelectTrigger, { className: "w-full relative z-50", children: _jsx(SelectValue, { placeholder: "Selecione o cliente" }) }), _jsx(SelectContent, { children: clients.map((option) => (_jsx(SelectItem, { value: option, children: option }, option))) })
                                ] }) }), _jsx(Field, { label: "Ano", className: "w-full md:flex-1 md:min-w-[100px] md:max-w-[120px]", children: _jsxs(Select, { value: year ? String(year) : "", onValueChange: (value) => setYear(Number(value)), disabled: !years.length, children: [
                                    _jsx(SelectTrigger, { className: "w-full relative z-50", children: _jsx(SelectValue, { placeholder: "Ano" }) }), _jsxs(SelectContent, { children: [
                                            _jsx(SelectItem, { value: "2026", children: "2026" }), years.filter(y => y !== 2026).map((option) => (_jsx(SelectItem, { value: String(option), children: option }, option)))] })
                                ] }) }), _jsx(Field, { label: "M\u00EAs", className: "w-full md:flex-1 md:min-w-[100px] md:max-w-[140px]", children: _jsxs(Select, { value: month ? String(month) : "all", onValueChange: (value) => setMonth(value === "all" ? null : Number(value)), disabled: false, children: [
                                    _jsx(SelectTrigger, { className: "w-[160px] relative z-50", children: _jsx(SelectValue, { placeholder: "Ano completo" }) }), _jsxs(SelectContent, { children: [
                                            _jsx(SelectItem, { value: "all", children: "Ano completo" }), MONTH_LABELS.map((label, index) => (_jsx(SelectItem, { value: String(index + 1), children: label }, label)))] })
                                ] }) }), _jsxs(Button, { variant: "ghost", size: "sm", className: "mb-0.5 ml-2 text-muted-foreground hover:text-foreground", onClick: () => {
                                setState("");
                                setCity("");
                                setClient("");
                                setMonth(null);
                                setYear(2026);
                            }, children: [
                                _jsx(XCircle, { className: "mr-2 h-4 w-4" }),
                                "Limpar Filtros"] }), _jsxs("div", { className: "w-full md:w-auto md:ml-auto flex items-center justify-between md:justify-end gap-4", children: [month !== null && (_jsxs("div", { className: "flex flex-col items-end gap-1", children: [
                                        _jsx("div", { className: "text-[10px] font-bold text-amber-500 uppercase tracking-wider leading-none", children: "Total no M\u00EAs" }), _jsxs("div", { className: "text-sm font-black text-white leading-none", children: [formatNumber(monthTotals.tons, 2), _jsx("span", { className: "text-[10px] ml-0.5 text-slate-400", children: "t" })
                                            ] })
                                    ] })), _jsxs("button", { type: "button", onClick: () => setCountDistinctPlates((v) => !v), className: "flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-foreground shadow-sm", children: [
                                        _jsx(Truck, { className: "h-3.5 w-3.5" }), _jsxs("span", { children: ["Caminh\u00F5es: ",
                                                _jsx("span", { className: "text-primary", children: truckLabel })
                                            ] })
                                    ] }), _jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-sm", children: [
                                        _jsx(Info, { className: "h-3.5 w-3.5 text-primary" }), _jsx("span", { children: dataset
                                                ? `${dataset.fileName} · ${formatNumber(rows.length)} linhas`
                                                : "—" })
                                    ] })
                            ] })
                    ] }) }), _jsx("main", { className: "mx-auto max-w-7xl px-3 md:px-5 py-4 md:py-6", children: !ready ? (_jsxs("div", { className: "flex min-h-[75vh] flex-col items-center justify-start gap-12 pt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000", children: [
                        _jsxs("div", { className: "w-full max-w-5xl mx-auto h-[480px] rounded-2xl overflow-hidden border border-[#334155] bg-[#0F172A] shadow-2xl relative group", children: [
                                _jsx("img", { src: heroAsset.url, alt: "Empresa Caltec", className: "w-full h-full object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-80" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent opacity-80" })
                            ] }), _jsxs("div", { className: "max-w-md space-y-4", children: [
                                _jsxs("div", { className: "flex items-center justify-center gap-2 text-amber-500", children: [
                                        _jsx(Search, { className: "h-6 w-6" }), _jsx("h3", { className: "text-xl font-bold text-foreground", children: "Selecione um cliente para iniciar" })
                                    ] }), _jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: ["Utilize os filtros acima para navegar por ",
                                        _jsx("strong", { children: "Estado" }),
                                        ", ",
                                        _jsx("strong", { children: "Cidade" }),
                                        " e localizar o ",
                                        _jsx("strong", { children: "Cliente" }),
                                        " desejado."] })
                            ] })
                    ] })) : (_jsxs("div", { className: "space-y-6", children: [
                        _jsxs("div", { className: "flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-6 md:py-8 mb-6 md:mb-8 bg-[#1E293B]/40 rounded-3xl border border-slate-700/30 backdrop-blur-md shadow-2xl relative overflow-hidden group px-4", children: [
                                _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 opacity-50" }), _jsxs("div", { className: "relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left", children: [
                                        _jsx("div", { className: "p-1 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm", children: (() => {
                                                const info = getClientInfo(client);
                                                return (_jsx(ClientLogo, { clientName: client, groupName: info?.grupo, urlLogo: info?.logo, className: "w-24 h-24 rounded-xl overflow-hidden shadow-inner" }));
                                            })() }), _jsxs("div", { className: "flex flex-col items-center md:items-start", children: [
                                                _jsx("h2", { className: "text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2 drop-shadow-sm", children: client }), _jsxs("div", { className: "flex items-center gap-2", children: [
                                                        _jsx("div", { className: "h-1 w-8 bg-emerald-500 rounded-full" }), _jsxs("p", { className: "text-sm font-bold text-slate-400 uppercase tracking-[0.2em]", children: [city, " ",
                                                                _jsx("span", { className: "text-slate-600 mx-1", children: "\u2014" }),
                                                                " ", state] })
                                                    ] })
                                            ] })
                                    ] })
                            ] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                                _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]", children: [
                                        _jsx(ChartCard, { title: "Volume por m\u00EAs", subtitle: `Toneladas · ${year ?? ""}`, accent: true, children: yearTotals.loads ? (_jsx(ResponsiveContainer, { width: "100%", height: isMobile ? 200 : 240, style: { overflow: 'visible' }, children: _jsxs(BarChart, { data: monthly, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                        _jsx("defs", { children: _jsxs("linearGradient", { id: "volGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                                                                    _jsx("stop", { offset: "0%", stopColor: "#38BDF8" }), _jsx("stop", { offset: "100%", stopColor: "#6366F1" })
                                                                ] }) }), _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.ceil(dataMax * 1.5)] }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: 'transparent' } }), _jsx(Bar, { dataKey: "tons", name: "Volume", fill: "url(#volGradient)", radius: [4, 4, 0, 0], onClick: (data) => {
                                                                if (!data || !data.activeLabel)
                                                                    return;
                                                                const monthIdx = MONTH_LABELS.indexOf(data.activeLabel);
                                                                if (monthIdx === -1)
                                                                    return;
                                                                const filtered = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                                                                openDrillDown(`Volume: ${data.activeLabel}`, filtered);
                                                            }, className: "cursor-pointer", children: _jsx(LabelList, { dataKey: "tons", position: "top", formatter: (v) => v > 0 ? `${formatNumber(v, 2)}t` : "", style: { fontSize: 10, fill: "#94A3B8", fontWeight: 500 }, dy: -8 }) })
                                                    ] }) })) : (_jsx(EmptyState, {})) }), _jsx(KpiCard, { label: `Volume no ano`, value: formatNumber(yearTotals.tons, 2), unit: "Toneladas", variant: "large", hint: _jsxs("span", { className: "font-semibold text-primary", children: ["Volume consolidado em ", year] }), className: "h-full flex flex-col justify-center" })
                                    ] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]", children: [
                                        _jsx(ChartCard, { title: "Caminh\u00F5es por m\u00EAs", subtitle: `${truckLabel} · ${year ?? ""}`, accent: true, children: _jsx(ResponsiveContainer, { width: "100%", height: isMobile ? 200 : 240, style: { overflow: 'visible' }, children: _jsxs(BarChart, { data: monthly, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                        _jsx("defs", { children: _jsxs("linearGradient", { id: "truckGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                                                                    _jsx("stop", { offset: "0%", stopColor: "#8B5CF6" }), _jsx("stop", { offset: "100%", stopColor: "#3B82F6" })
                                                                ] }) }), _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.ceil(dataMax * 1.5)] }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: 'transparent' } }), _jsx(Bar, { dataKey: truckKey, name: truckLabel, fill: "url(#truckGradient)", radius: [4, 4, 0, 0], onClick: (data) => {
                                                                if (!data || !data.activeLabel)
                                                                    return;
                                                                const monthIdx = MONTH_LABELS.indexOf(data.activeLabel);
                                                                if (monthIdx === -1)
                                                                    return;
                                                                const filtered = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                                                                openDrillDown(`Caminhões: ${data.activeLabel}`, filtered);
                                                            }, className: "cursor-pointer", children: _jsx(LabelList, { dataKey: truckKey, position: "top", formatter: (v) => v > 0 ? v : "", style: { fontSize: 10, fill: "#94A3B8", fontWeight: 500 }, dy: -8 }) })
                                                    ] }) }) }), _jsx(KpiCard, { label: "Caminh\u00F5es no ano", value: formatNumber(countDistinctPlates ? yearTotals.plates : yearTotals.loads), unit: countDistinctPlates ? "Placas" : "Viagens", variant: "large", hint: _jsxs("span", { className: "font-semibold text-emerald-500", children: [truckLabel, " em ", year] }), className: "h-full flex flex-col justify-center" })
                                    ] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px] md:col-span-2", children: [
                                        _jsx(ChartCard, { title: "OTD do Per\u00EDodo", subtitle: `Aderência por mês · ${year ?? ""}`, accent: true, children: otdByMonth.length ? (_jsx(ResponsiveContainer, { width: "100%", height: isMobile ? 200 : 240, style: { overflow: 'visible' }, children: _jsxs(BarChart, { data: otdByMonth, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                        _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, 115] }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: 'transparent' } }), _jsxs(Bar, { name: "Ader\u00EAncia", dataKey: "rate", radius: [4, 4, 0, 0], barSize: 32, onClick: (data) => {
                                                                const label = data.activeLabel || data.month;
                                                                const monthIdx = MONTH_LABELS.indexOf(label);
                                                                if (monthIdx === -1)
                                                                    return;
                                                                const monthRows = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                                                                const filtered = monthRows.filter(r => !norm(r[COL.otd]).startsWith("aderente"));
                                                                openDrillDown(`Atrasos (Não Aderentes): ${label}`, filtered);
                                                            }, className: "cursor-pointer", children: [otdByMonth.map((entry, index) => (_jsx(Cell, { fill: entry.rate >= 98 ? "#10b981" : "#ef4444" }, `cell-${index}`))), _jsx(LabelList, { dataKey: "rate", position: "top", formatter: (v) => (v > 0 ? `${formatNumber(v, 1)}%` : ""), fill: "#FFFFFF", style: { fontSize: 10, fontWeight: 600 }, dy: -8 })
                                                            ] })
                                                    ] }) })) : (_jsx(EmptyState, {})) }), _jsx(OtdCard, { title: "OTD Geral", subtitle: `Acumulado · ${year ?? ""}`, stats: otdYear, rows: yearRows, onDrillDown: openDrillDown })
                                    ] })
                            ] }), _jsxs("div", { className: "space-y-4", children: [
                                _jsx("div", { className: "flex items-center gap-2 px-2 border-l-4 border-amber-500 pl-4", children: _jsx("h3", { className: "text-lg font-bold text-white uppercase tracking-[0.2em]", children: "Tempo M\u00E9dio de Atendimento" }) }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [
                                        _jsx(KpiCard, { variant: "large", label: "QUANTIDADE NO PRAZO", value: String(serviceStats.onTime), unit: "Cargas", badge: { text: "On Time", variant: "success" }, progress: {
                                                value: serviceStats.total > 0 ? (serviceStats.onTime / serviceStats.total) * 100 : 0,
                                                color: "#10b981"
                                            }, className: "border-emerald-500/20 shadow-emerald-500/5" }), _jsx(KpiCard, { variant: "large", label: "QUANTIDADE ANTECIPADO / URGENTE", value: String(serviceStats.urgent), unit: "Cargas", badge: { text: "Urgente", variant: "warning" }, progress: {
                                                value: serviceStats.total > 0 ? (serviceStats.urgent / serviceStats.total) * 100 : 0,
                                                color: "#f59e0b"
                                            }, className: "border-amber-500/20 shadow-amber-500/5" })
                                    ] })
                            ] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                                _jsx("div", { className: "md:col-span-2", children: _jsx(ChartCard, { title: "Ranking de Transportadoras", subtitle: `Carregamentos no ano · ${year ?? ""}`, accent: true, children: carriers.length ? (_jsx(ResponsiveContainer, { width: "100%", height: isMobile ? 200 : 240, style: { overflow: 'visible' }, children: _jsxs(BarChart, { data: carriers.slice(0, 5), layout: "vertical", margin: { top: 35, right: 35, left: 10, bottom: 10 }, children: [
                                                    _jsx(CartesianGrid, { stroke: GRID, horizontal: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { type: "number", hide: true, domain: [0, (dataMax) => Math.ceil(dataMax * 1.35)] }), _jsx(YAxis, { type: "category", dataKey: "carrier", ...AXIS, width: 140, tickFormatter: (value) => formatCarrierName(value), tick: { fill: "#94A3B8", fontSize: 10, fontWeight: 500 }, padding: { top: 10, bottom: 10 } }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: 'transparent' } }), _jsx(Bar, { name: "Cargas", dataKey: "loads", fill: "#64748B", radius: [0, 4, 4, 0], barSize: 20, onClick: (data) => {
                                                            if (!data || !data.carrier)
                                                                return;
                                                            const filtered = yearRows.filter(r => (str(r[COL.carrier]) || "CALTEC") === data.carrier);
                                                            openDrillDown(`Transportadora: ${data.carrier}`, filtered);
                                                        }, className: "cursor-pointer", children: _jsx(LabelList, { dataKey: "loads", position: "right", fill: "#FFFFFF", style: { fontSize: 10, fontWeight: 600 }, dx: 8, formatter: (v) => {
                                                                const total = carriers.reduce((s, c) => s + c.loads, 0);
                                                                const p = total ? Math.round((v / total) * 100) : 0;
                                                                return `${v} (${p}%)`;
                                                            } }) })
                                                ] }) })) : (_jsx(EmptyState, {})) }) }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px] md:col-span-2", children: [
                                        _jsx(ChartCard, { title: "Tempo m\u00E9dio de descarga por m\u00EAs", subtitle: `Horas · ${MONTH_LABELS[DISCHARGE_START_MONTH - 1]} em diante`, accent: true, children: dischargeByMonth.some((p) => p.samples > 0) ? (_jsx(ResponsiveContainer, { width: "100%", height: isMobile ? 200 : 240, style: { overflow: 'visible' }, children: _jsxs(AreaChart, { data: dischargeByMonth, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                        _jsx("defs", { children: _jsxs("linearGradient", { id: "dischargeGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                                                                    _jsx("stop", { offset: "0%", stopColor: "#F59E0B", stopOpacity: 0.8 }), _jsx("stop", { offset: "100%", stopColor: "#F59E0B", stopOpacity: 0 })
                                                                ] }) }), _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.max(35, Math.ceil(dataMax * 1.5))] }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(ReferenceLine, { y: 5, stroke: "#F59E0B", strokeDasharray: "5 5", strokeWidth: 2, label: {
                                                                value: "SLA: 5,0h",
                                                                position: 'insideBottomRight',
                                                                fill: '#F59E0B',
                                                                fontSize: 11,
                                                                fontWeight: 'bold',
                                                                dy: -10
                                                            } }), _jsx(Area, { type: "monotone", dataKey: "hours", name: "Tempo (h)", stroke: "#F59E0B", strokeWidth: 3, fill: "url(#dischargeGradient)", onClick: (data) => {
                                                                const label = data?.activeLabel || data?.month;
                                                                if (!label)
                                                                    return;
                                                                const monthIdx = MONTH_LABELS.indexOf(label);
                                                                if (monthIdx === -1)
                                                                    return;
                                                                const filtered = yearRows.filter(r => {
                                                                    if (isCancelled(r))
                                                                        return false;
                                                                    const h = dischargeHours(r);
                                                                    if (h === null || h === 0)
                                                                        return false;
                                                                    const d = parseDate(r[COL.finished]) || parseDate(r[COL.arrived]);
                                                                    return d && d.getMonth() === monthIdx;
                                                                });
                                                                openDrillDown(`Descarga — ${label}`, filtered);
                                                            }, className: "cursor-pointer", children: _jsx(LabelList, { dataKey: "hours", position: "top", formatter: (v) => v > 0 ? `${formatNumber(v, 1)}h` : "", dy: -10, style: { fontSize: 10, fill: "#94A3B8", fontWeight: 500 } }) })
                                                    ] }) })) : (_jsx(EmptyState, { label: "Sem datas de chegada/finaliza\u00E7\u00E3o preenchidas" })) }), _jsx(KpiCard, { label: "Tempo m\u00E9dio de descarga no ano", value: avgDischargeYear === null ? "—" : formatNumber(avgDischargeYear, 1), unit: "Horas", variant: "large", hint: _jsxs("span", { className: "font-semibold text-amber-500", children: ["M\u00E9dia em ", year, " (", (MONTH_LABELS[Math.max(0, DISCHARGE_START_MONTH - 1)] ?? "Maio").toLowerCase(), " em diante)"] }), className: "h-full flex flex-col justify-center" })
                                    ] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2", children: [
                                        _jsx(ChartCard, { title: "Distribui\u00E7\u00E3o do tempo de descarga", subtitle: `Carregamentos por faixa · ${month ? MONTH_LABELS[month - 1] + "/" : ""}${year ?? ""} · ${(MONTH_LABELS[Math.max(0, DISCHARGE_START_MONTH - 1)] ?? "maio").toLowerCase()} em diante`, accent: true, children: bands.some((b) => b.loads > 0) ? (_jsx(ResponsiveContainer, { width: "100%", height: isMobile ? 200 : 240, style: { overflow: 'visible' }, children: _jsxs(BarChart, { data: bands, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                        _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "band", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.ceil(dataMax * 1.5)] }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: 'transparent' } }), _jsxs(Bar, { dataKey: "loads", name: "Carregamentos", radius: [4, 4, 0, 0], onClick: (data) => {
                                                                if (!data)
                                                                    return;
                                                                const label = data.activeLabel || data.band;
                                                                const filtered = yearRows.filter(r => {
                                                                    if (isCancelled(r))
                                                                        return false;
                                                                    const h = dischargeHours(r);
                                                                    if (h === null || h === 0)
                                                                        return false;
                                                                    // Check month restriction (May onwards)
                                                                    const d = parseDate(r[COL.finished]) || parseDate(r[COL.arrived]);
                                                                    if (!d || (d.getMonth() + 1) < DISCHARGE_START_MONTH)
                                                                        return false;
                                                                    const bandDef = DISCHARGE_BANDS.find(b => b.label === label);
                                                                    return bandDef ? bandDef.test(h) : false;
                                                                });
                                                                openDrillDown(`Faixa de Descarga: ${label}`, filtered);
                                                            }, className: "cursor-pointer", children: [
                                                                _jsx(LabelList, { dataKey: "loads", position: "top", formatter: (v) => v > 0 ? v : "", style: { fontSize: 10, fill: "#FFFFFF", fontWeight: 600 }, dy: -8 }), bands.map((entry, index) => {
                                                                    const colors = {
                                                                        "Até 5h": "#10b981",
                                                                        "5h a 12h": "#f59e0b",
                                                                        "12h a 24h": "#f97316",
                                                                        "Acima de 24h": "#ef4444"
                                                                    };
                                                                    return _jsx(Cell, { fill: colors[entry.band] || "#3B82F6" }, `cell-${index}`);
                                                                })] })
                                                    ] }) })) : (_jsx(EmptyState, { label: "Sem tempos de descarga calcul\u00E1veis no per\u00EDodo" })) }), _jsx(ChartCard, { title: "CANCELAMENTOS MENSAIS", subtitle: `Realizados (sem reagendamento) · ${year ?? ""}`, accent: true, action: _jsx("div", { className: "text-2xl font-bold text-amber-500", children: formatNumber(cancelsMonthly.reduce((sum, m) => sum + m.cancellations, 0)) }), children: cancelsMonthly.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: isMobile ? 200 : 240, style: { overflow: 'visible' }, children: _jsxs(BarChart, { data: cancelsMonthly, margin: { top: 35, right: 25, left: 25, bottom: 10 }, children: [
                                                        _jsx(CartesianGrid, { stroke: GRID, vertical: false, strokeDasharray: GRID_DASH }), _jsx(XAxis, { dataKey: "month", ...X_AXIS_PROPS }), _jsx(YAxis, { ...Y_AXIS_HIDDEN, domain: [0, (dataMax) => Math.ceil(dataMax * 1.5)] }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: 'transparent' } }), _jsx(Bar, { name: "Cancelamentos Reais", dataKey: "cancellations", fill: "#f59e0b", radius: [4, 4, 0, 0], barSize: 32, onClick: (data) => {
                                                                const monthLabel = data.month;
                                                                const filtered = allRows.filter(row => {
                                                                    const status = str(row[COL.status]).toLowerCase();
                                                                    const client = str(row[COL.client]);
                                                                    const city = str(row[COL.city]);
                                                                    const date = str(row[COL.plannedDelivery]).split(' ')[0] || '';
                                                                    // Month match
                                                                    const parts = date.split('/');
                                                                    if (parts.length < 2)
                                                                        return false;
                                                                    const monthIdx = parseInt(parts[1] || '0') - 1;
                                                                    if (MONTH_LABELS[monthIdx] !== monthLabel)
                                                                        return false;
                                                                    // Check logic: must be within current filter selection
                                                                    if (year && (parseDate(row[COL.plannedDelivery])?.getFullYear() !== year))
                                                                        return false;
                                                                    // Dedupe/Check real cancellation
                                                                    const key = `${client}|${city}|${date}`;
                                                                    const group = allRows.filter((r) => {
                                                                        const rDate = str(r[COL.plannedDelivery]).split(' ')[0];
                                                                        const rClient = str(r[COL.client]);
                                                                        const rCity = str(r[COL.city]);
                                                                        return `${rClient}|${rCity}|${rDate}` === key;
                                                                    });
                                                                    const isRealCancellation = group.every(g => isCancelled(g));
                                                                    return isRealCancellation && status === "frete cancelado";
                                                                });
                                                                openDrillDown(`Cancelamentos Reais: ${monthLabel}`, filtered);
                                                            }, className: "cursor-pointer", children: _jsx(LabelList, { dataKey: "cancellations", position: "top", fill: "#FFFFFF", style: { fontSize: 13, fontWeight: 700 }, dy: -8 }) })
                                                    ] }) })) : (_jsx("div", { className: "flex h-[240px] items-center justify-center text-sm text-slate-500 italic", children: "Nenhum cancelamento no per\u00EDodo selecionado" })) })
                                    ] })
                            ] })
                    ] })) }), _jsx("footer", { className: "mx-auto max-w-7xl px-5 pb-10", children: _jsxs("div", { className: "print-muted flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground", children: [
                        _jsx("span", { children: "caltec.com.br \u00B7 Av. Agrimensor Gildo Pinheiro da Luz, 569 \u00B7 Itaperu\u00E7u - PR" }), _jsxs("span", { className: "no-print inline-flex items-center gap-1", children: [
                                _jsx(Printer, { className: "h-3 w-3" }),
                                " Use \u201CGerar PDF\u201D para o documento oficial"] })
                    ] }) }), _jsx(Dialog, { open: drillDownData.open, onOpenChange: (open) => setDrillDownData(prev => ({ ...prev, open })), children: _jsxs(DialogContent, { className: "max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#1E293B] border-[#334155] text-white", children: [
                        _jsx(DialogHeader, { className: "p-6 pb-2 border-b border-[#334155]", children: _jsxs(DialogTitle, { className: "flex items-center gap-2 text-xl font-bold", children: [
                                    _jsx(Search, { className: "h-5 w-5 text-[#F59E0B]" }), drillDownData.title] }) }), _jsx(ScrollArea, { className: "flex-1", children: _jsx("div", { className: "p-6", children: _jsxs(Table, { children: [
                                        _jsx(TableHeader, { children: _jsxs(TableRow, { className: "border-[#334155] hover:bg-transparent", children: [
                                                    _jsx(TableHead, { className: "text-[#94A3B8] font-bold uppercase text-[10px]", children: "Cod Refer\u00EAncia / NF" }), _jsx(TableHead, { className: "text-[#94A3B8] font-bold uppercase text-[10px]", children: "Datas (Coleta / Chegada / Fim)" }), _jsx(TableHead, { className: "text-[#94A3B8] font-bold uppercase text-[10px]", children: "Transportadora" }), _jsx(TableHead, { className: "text-[#94A3B8] font-bold uppercase text-[10px]", children: "Motorista / Placa" }), _jsx(TableHead, { className: "text-[#94A3B8] font-bold uppercase text-[10px]", children: "Status / Tempo Descarga" }), _jsx(TableHead, { className: "text-[#94A3B8] font-bold uppercase text-[10px]", children: "OTD / Atraso" })
                                                ] }) }), _jsx(TableBody, { children: drillDownData.rows.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, className: "text-center py-10 text-[#64748B]", children: "Nenhum registro encontrado." }) })) : (drillDownData.rows.map((row, idx) => {
                                                const otd = norm(row[COL.otd]);
                                                const isAderente = otd.startsWith("aderente");
                                                const isCancel = isCancelled(row);
                                                const h = dischargeHours(row);
                                                return (_jsxs(TableRow, { className: "border-[#334155] hover:bg-[#334155]/30", children: [
                                                        _jsx(TableCell, { className: "font-mono text-xs", children: _jsxs("div", { className: "flex flex-col gap-0.5", children: [
                                                                    _jsx("span", { className: "font-bold text-white", children: str(row[COL.reference]) || str(row["Cod Referencia"]) || str(row["cod_referencia"]) || "—" }), _jsxs("span", { className: "text-[10px] text-[#64748B]", children: ["NF: ", str(row[COL.invoice]) || str(row["NF"]) || "—"] })
                                                                ] }) }), _jsx(TableCell, { className: "text-[10px]", children: _jsxs("div", { className: "flex flex-col gap-0.5", children: [
                                                                    _jsxs("span", { className: "text-white", children: [
                                                                            _jsx("span", { className: "text-[#64748B]", children: "Col:" }),
                                                                            " ", str(row[COL.pickup]) || "—"] }), _jsxs("span", { className: "text-white", children: [
                                                                            _jsx("span", { className: "text-[#64748B]", children: "Che:" }),
                                                                            " ", str(row[COL.arrived]) || "—"] }), _jsxs("span", { className: "text-white", children: [
                                                                            _jsx("span", { className: "text-[#64748B]", children: "Fim:" }),
                                                                            " ", str(row[COL.finished]) || "—"] })
                                                                ] }) }), _jsx(TableCell, { className: "text-xs max-w-[150px] truncate", children: str(row[COL.carrier]) }), _jsxs(TableCell, { className: "text-xs", children: [
                                                                _jsx("div", { className: "font-medium", children: str(row["Motorista"]) }), _jsx("div", { className: "text-[10px] text-[#64748B]", children: str(row[COL.plate]) })
                                                            ] }), _jsx(TableCell, { className: "text-xs", children: _jsxs("div", { className: "flex flex-col gap-1", children: [isCancel ? (_jsx("span", { className: "text-red-400 font-bold uppercase text-[10px]", children: "Cancelado" })) : (_jsx("span", { className: "text-[#94A3B8] font-medium", children: str(row[COL.status]) || "Finalizado" })), h !== null && h > 0 && (_jsxs("div", { className: "text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded w-fit", children: ["Descarga: ", formatNumber(h, 1), "h"] })), _jsx("div", { className: "text-[10px] text-[#64748B] italic", children: str(row["Motivo"]) || str(row["Observação"]) })
                                                                ] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex flex-col gap-1", children: [
                                                                    _jsx("span", { className: cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase w-fit", isAderente ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"), children: str(row[COL.otd]) || "—" }), !isAderente && !isCancel && (_jsx("div", { className: "text-[10px] font-bold text-red-400", children: str(row["Atraso"]) || str(row["Justificativa Atraso"]) || "Atraso não especificado" }))] }) })
                                                    ] }, idx));
                                            })) })
                                    ] }) }) })
                    ] }) })
        ] }));
}
function Field({ label, children, className }) {
    return (_jsxs("div", { className: cn("flex flex-col gap-1.5", className), children: [
            _jsx("span", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-1", children: label }), children] }));
}
function OtdCard({ title, subtitle, stats, rows, onDrillDown, }) {
    const otdRate = stats.rate ?? 0;
    const isSuccess = otdRate >= 98;
    const data = [
        { name: "Aderente", value: stats.adherent, fill: "#10b981" },
        { name: "Não Aderente", value: stats.notAdherent, fill: "#ef4444" },
    ].filter((slice) => slice.value > 0);
    // For OTD pie colors: adherent is green (#10b981), not adherent is red (#ef4444)
    const pieData = data.map(d => ({
        ...d,
        fill: d.name === "Aderente" ? "#10b981" : "#ef4444"
    }));
    return (_jsx(ChartCard, { title: title, subtitle: subtitle, children: stats.total ? (_jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-6 h-full px-2", children: [
                _jsx("div", { className: "flex-1 w-full md:h-full min-w-[140px]", children: _jsx(ResponsiveContainer, { width: "100%", height: 170, children: _jsxs(PieChart, { margin: { top: 0, right: 0, bottom: 0, left: 0 }, children: [
                                _jsx(Pie, { data: pieData, cx: "50%", cy: "50%", dataKey: "value", innerRadius: 45, outerRadius: 70, paddingAngle: 2, strokeWidth: 0, onClick: (entry) => {
                                        const filtered = rows.filter((r) => {
                                            const otdNorm = norm(r[COL.otd]);
                                            return entry.name === "Aderente"
                                                ? otdNorm.startsWith("aderente")
                                                : !otdNorm.startsWith("aderente");
                                        });
                                        onDrillDown(`OTD Geral: ${entry.name}`, filtered);
                                    }, className: "cursor-pointer outline-none", children: pieData.map((entry) => (_jsx(Cell, { fill: entry.fill }, entry.name))) }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: false })
                            ] }) }) }), _jsxs("div", { className: "flex flex-col justify-center items-center md:items-start text-center md:text-left min-w-[120px]", children: [
                        _jsxs("p", { className: `text-3xl font-extrabold ${isSuccess ? "text-[#10b981]" : "text-[#ef4444]"}`, children: [formatNumber(stats.rate ?? 0, 1), "%"] }), _jsxs("p", { className: "text-xs text-[#94A3B8] mt-1", children: ["Aderente: ",
                                _jsx("span", { className: "font-bold text-[#10B981]", children: formatNumber(stats.adherent) })
                            ] }), _jsxs("p", { className: "text-xs text-[#94A3B8]", children: ["N\u00E3o Aderente: ",
                                _jsx("span", { className: "font-bold text-[#EF4444]", children: formatNumber(stats.notAdherent) })
                            ] }), _jsxs("p", { className: "text-xs text-[#64748B] mt-2 pt-2 border-t border-[#334155] w-full md:w-auto", children: ["Total: ",
                                _jsx("span", { className: "font-bold text-white", children: formatNumber(stats.total) })
                            ] })
                    ] })
            ] })) : (_jsx(EmptyState, {})) }));
}
