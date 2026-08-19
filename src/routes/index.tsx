import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { FileDown, Printer, RefreshCcw, Truck, Upload, Info, Search, XCircle, Factory, Leaf, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import logoDark from "@/assets/caltec-logo-dark.png.asset.json";
import logoPrint from "@/assets/caltec-logo-print.png.asset.json";
import heroAsset from "@/assets/hero-caltec.png.asset.json";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartCard, EmptyState } from "@/components/report/ChartCard";
import { ClientLogo } from "@/components/ClientLogo";
import { KpiCard } from "@/components/report/KpiCard";
import { UsinaCatalog } from "@/components/UsinaCatalog";
import usinasData from "@/data/usinas.json";
import {
  COL,
  MONTH_LABELS,
  DISCHARGE_START_MONTH,
  clearDataset,
  loadDataset,
  norm,
  parseDate,
  rowMonth,
  parseWorkbook,
  saveDataset,
  str,
  dischargeHours,
  isCancelled,
  type Row,
  type Dataset,
} from "@/lib/report-data";
import { buildSampleRows } from "@/lib/report-sample";
import {
  averageDischarge,
  cancellationStats,
  cancellationsMonthly,
  carrierRanking,
  dischargeBands,
  dischargeMonthly,
  filterPeriod,
  formatNumber,
  formatCarrierName,
  getStates,
  getCities,
  getClients,
  getYears,
  monthlySeries,
  otdStats,
  scopeRows,
  scopeRowsAllProducts,
  totals,
  DISCHARGE_BANDS,
  yearlySeries,
  getClientInfo,
  type Selection,
} from "@/lib/report-metrics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relatório do Cliente — Caltec | Cal Industrial" },
      {
        name: "description",
        content:
          "Relatório one page de operações de Cal industrial da Caltec: volume em toneladas, caminhões, OTD, tempo de descarga e cancelamentos por cidade e cliente.",
      },
      { property: "og:title", content: "Relatório do Cliente — Caltec | Cal Industrial" },
      {
        property: "og:description",
        content:
          "Painel de indicadores logísticos de Cal industrial: volume, OTD, tempo de descarga e cancelamentos por cliente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

const AXIS = { 
  stroke: "#475569", 
  fontSize: 11, 
  tickLine: false, 
  axisLine: false,
  tick: { fill: "#94A3B8", fontWeight: 500 },
  interval: 0,
};

const X_AXIS_PROPS = {
  ...AXIS,
  padding: { left: 25, right: 25 }
};

const Y_AXIS_HIDDEN = {
  ...AXIS,
  width: 0,
  tick: false,
  axisLine: false,
  tickLine: false,
  hide: true
};

const GRID = "rgba(51, 65, 85, 0.3)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
        <p className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                {entry.name}
              </span>
              <span className="text-sm font-bold text-white">
                {entry.value}
                {entry.unit || ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};


function ReportPage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [client, setClient] = useState("");
  const [year, setYear] = useState<number | null>(2026);
  const [month, setMonth] = useState<number | null>(null);
  const [countDistinctPlates, setCountDistinctPlates] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  const [drillDownData, setDrillDownData] = useState<{
    open: boolean;
    title: string;
    rows: Row[];
  }>({ open: false, title: "", rows: [] });

  const openDrillDown = (title: string, data: Row[]) => {
    setDrillDownData({ open: true, title, rows: data });
  };

  useEffect(() => {
    // 1. First check if we have a hardcoded "factory" dataset for this specific session
    // This is useful for when the agent injects a specific dataset via server
    const stored = loadDataset();
    
    if (stored) {
      setDataset(stored);
      return;
    }
    setDataset({
      rows: buildSampleRows(),
      fileName: "Base de exemplo",
      updatedAt: new Date().toISOString(),
      isSample: true,
    });
  }, []);

  useEffect(() => {
    setAdminMode(
      typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("admin") !== "0",
    );
    // Enable dark theme mode
    document.documentElement.classList.add('dark');
  }, []);

  const rows = dataset?.rows ?? [];
  const allRows = dataset?.rows ?? [];
  const states = useMemo(() => getStates(rows), [rows]);
  const cities = useMemo(() => getCities(rows, state), [rows, state]);
  const clients = useMemo(() => getClients(rows, city), [rows, city]);
  const years = useMemo(() => getYears(rows, city, client), [rows, city, client]);

  useEffect(() => {
    if (years.length && (year === null || !years.includes(year))) {
      // Preference for 2026, then latest
      if (years.includes(2026)) setYear(2026);
      else setYear(years[years.length - 1] ?? null);
    }
  }, [years, year]);

  const selection: Selection = { city, client, year, month };
  const calRows = useMemo(() => scopeRows(rows, city, client), [rows, city, client]);
  const allScoped = useMemo(
    () => scopeRowsAllProducts(rows, city, client),
    [rows, city, client],
  );

  const yearRows = useMemo(
    () => filterPeriod(calRows, { ...selection, month: null }),
    [calRows, year, city, client],
  );
  const periodRows = useMemo(() => filterPeriod(calRows, selection), [calRows, year, month, city, client]);

  const monthly = useMemo(() => monthlySeries(calRows, year).filter(m => m.loads > 0 || m.tons > 0), [calRows, year]);
  const yearly = useMemo(
    () => yearlySeries(calRows, allScoped, selection),
    [calRows, allScoped, city, client],
  );
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
  const bands = useMemo(() => {
    return dischargeBands(yearRows);
  }, [yearRows]);
  const cancels = useMemo(
    () => cancellationStats(calRows, allScoped, { ...selection, month: null }),
    [calRows, allScoped, year, city, client],
  );
  const cancelsMonthly = useMemo(
    () => cancellationsMonthly(calRows, allScoped, selection).filter(m => m.cancellations > 0),
    [calRows, allScoped, year, city, client],
  );
  const yearTotals = useMemo(() => totals(yearRows), [yearRows]);
  const monthTotals = useMemo(() => totals(periodRows), [periodRows]);
  const avgDischargeYear = useMemo(() => averageDischarge(yearRows), [yearRows]);

  const ready = Boolean(city && client);
  const truckKey = countDistinctPlates ? "plates" : "loads";
  const truckLabel = countDistinctPlates ? "Placas distintas" : "Carregamentos";

  async function handleUpload(file: File) {
    try {
      const parsed = await parseWorkbook(file);
      if (!parsed.length) {
        toast.error("Nenhuma linha encontrada no arquivo.");
        return;
      }

      // IMPORTANTE: Realizar varredura por duplicados usando Código de Referência e chaves de negócio (UPSERT/APPEND)
      const { mergeDatasets } = await import("@/lib/report-persistence");
      const currentRows = dataset?.rows ?? [];
      const merged = mergeDatasets(currentRows, parsed);

      const next: Dataset = {
        rows: merged,
        fileName: file.name,
        updatedAt: new Date().toISOString(),
        isSample: false,
      };
      setDataset(next);
      saveDataset(next);
      setCity("");
      setState("");
      setClient("");
      setYear(2026);
      setMonth(null);
      toast.success(`Base atualizada: ${formatNumber(merged.length)} linhas (${formatNumber(parsed.length)} novas processadas).`);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível ler o arquivo. Envie um Excel (.xlsx) ou CSV.");
    }
  }

  return (
    <div className="print-sheet min-h-screen bg-slate-950 text-slate-200">
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
          event.target.value = "";
        }}
      />

      {/* Cabeçalho superior simplificado */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur print:static print:bg-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <img
              src={logoDark.url}
              alt="Caltec"
              className="h-10 w-auto print:hidden"
            />
            <div className="border-l border-slate-700 pl-4">
              <p className="text-[10px] tracking-[0.2em] text-slate-500 uppercase font-bold">
                Logística Cal Industrial
              </p>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">
                Industrial <span className="text-indigo-500">Premium</span>
              </h1>
            </div>
          </div>

          <div className="no-print flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCatalog(!showCatalog)}
              className={cn(
                "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all",
                showCatalog && "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500"
              )}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Catálogo de Usinas
            </Button>
            {adminMode && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInput.current?.click()}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload de Dados
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </header>
      {/* Filtros horizontais alinhados */}
      <div className="no-print border-t border-border bg-slate-900/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-3 px-5 py-4">

            <Field label="Estado (UF)">
              <Select
                value={state}
                onValueChange={(value) => {
                  setState(value);
                  setCity("");
                  setClient("");
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Cidade">
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value);
                  setClient("");
                  // Bidi logic: find UF from the actual rows to ensure it matches the spreadsheet case
                  const foundRow = rows.find(r => norm(r[COL.city]) === norm(value));
                  if (foundRow) setState(str(foundRow[COL.uf]));
                }}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Cliente">
              <Select 
                value={client} 
                onValueChange={(value) => {
                  setClient(value);
                  // Bidi logic: find City/UF from actual rows
                  const foundRow = rows.find(r => norm(r[COL.client]) === norm(value));
                  if (foundRow) {
                    setCity(str(foundRow[COL.city]));
                    setState(str(foundRow[COL.uf]));
                  }
                }} 


              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Ano">
              <Select
                value={year ? String(year) : ""}
                onValueChange={(value) => setYear(Number(value))}
                disabled={!ready || !years.length}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  {years.filter(y => y !== 2026).map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Mês">
              <Select
                value={month ? String(month) : "all"}
                onValueChange={(value) => setMonth(value === "all" ? null : Number(value))}
                disabled={!ready}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Ano completo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ano completo</SelectItem>
                  {MONTH_LABELS.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            
            <Button
              variant="ghost"
              size="sm"
              className="mb-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setState("");
                setCity("");
                setClient("");
                setMonth(null);
                setYear(2026);
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>

            <div className="ml-auto flex items-center gap-4">
              {month !== null && (
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider leading-none">Total no Mês</div>
                  <div className="text-sm font-black text-white leading-none">{formatNumber(monthTotals.tons, 2)}<span className="text-[10px] ml-0.5 text-slate-400">t</span></div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setCountDistinctPlates((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-foreground shadow-sm"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Caminhões: <span className="text-primary">{truckLabel}</span></span>
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-sm">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>
                  {dataset
                    ? `${dataset.isSample ? "Dados de Exemplo" : dataset.fileName} · ${formatNumber(rows.length)} linhas`
                    : "—"}
                </span>
              </div>
            </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {showCatalog ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Catálogo de Usinas</h2>
                <p className="text-slate-400 font-medium">Diretório completo de clientes Cal Industrial</p>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowCatalog(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
            <UsinaCatalog 
              data={usinasData as any} 
              onSelect={(usina) => {
                setState(usina.uf);
                setCity(usina.cidade);
                setClient(usina.usina);
                setShowCatalog(false);
                toast.success(`Cliente selecionado: ${usina.usina}`);
              }}
            />
          </div>
        ) : !ready ? (
          <div className="flex min-h-[75vh] flex-col items-center justify-start gap-12 pt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Hero Banner Container */}
            <div className="w-full max-w-5xl mx-auto h-[480px] rounded-2xl overflow-hidden border border-[#334155] bg-[#0F172A] shadow-2xl relative group">
              <img 
                src={heroAsset.url} 
                alt="Empresa Caltec" 
                className="w-full h-full object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent opacity-80" />
            </div>

            <div className="max-w-md space-y-4">
              <div className="flex items-center justify-center gap-2 text-amber-500">
                <Search className="h-6 w-6" />
                <h3 className="text-xl font-bold text-foreground">
                  Selecione um cliente para iniciar
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Utilize os filtros acima para navegar por <strong>Estado</strong>, <strong>Cidade</strong> e localizar o <strong>Cliente</strong> desejado.
              </p>
              {/* Removido duplicata do botão de atualizar dados */}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Banner de Identificação do Cliente */}
            <div className="flex items-center gap-6 py-6 px-8 mb-8 bg-slate-900/50 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-6">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                  {(() => {
                    const info = getClientInfo(client);
                    return (
                      <ClientLogo 
                        clientName={client} 
                        groupName={info?.grupo}
                        urlLogo={info?.logo}
                        className="w-16 h-12" 
                      />
                    );
                  })()}
                </div>
                
                <div className="flex flex-col items-start">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">
                    {client}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {city} • {state}
                  </p>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 5.1 Volume (Grid Modular: 2/3 Gráfico, 1/3 Card) */}
              <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ChartCard title="Volume por mês" subtitle={`Toneladas · ${year ?? ""}`}>
                    {yearTotals.loads ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={monthly} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorTons" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="month" {...X_AXIS_PROPS} />
                          <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.25]} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4f46e5', strokeWidth: 1 }} />
                          <Area 
                            type="monotone" 
                            dataKey="tons" 
                            stroke="#4f46e5" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorTons)"
                            onClick={(data: any) => {
                              const label = data?.activeLabel || data?.month;
                              if (!label) return;
                              const monthIdx = MONTH_LABELS.indexOf(label);
                              if (monthIdx === -1) return;
                              const filtered = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                              openDrillDown(`Volume: ${label}`, filtered);
                            }}
                          >
                            <LabelList 
                              dataKey="tons" 
                              position="top" 
                              formatter={(v: number) => v > 0 ? `${formatNumber(v, 2)}t` : ""} 
                              style={{ fontSize: 13, fill: "#F8FAFC", fontWeight: 700 }} 
                              dy={-15} 
                            />
                          </Area>
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState />
                    )}
                  </ChartCard>
                </div>
                <div className="lg:col-span-1">
                  <KpiCard
                    label="Volume no ano"
                    value={formatNumber(yearTotals.tons, 2)}
                    unit="Toneladas"
                    hint={<span className="font-semibold text-indigo-400">Consolidado {year}</span>}
                    className="h-full"
                  />
                </div>
              </div>

              {/* 5.2 Caminhões (Grid Modular: 2/3 Gráfico, 1/3 Card) */}
              <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ChartCard title="Caminhões por mês" subtitle={`${truckLabel} · ${year ?? ""}`}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={monthly} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.2]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar 
                          dataKey={truckKey} 
                          name={truckLabel} 
                          fill="#6366f1" 
                          radius={[6, 6, 0, 0]}
                          onClick={(data) => {
                            const label = data?.activeLabel || data?.month;
                            if (!label) return;
                            const monthIdx = MONTH_LABELS.indexOf(label);
                            if (monthIdx === -1) return;
                            const filtered = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                            openDrillDown(`Caminhões: ${label}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList 
                            dataKey={truckKey} 
                            position="top" 
                            formatter={(v: number) => v > 0 ? v : ""} 
                            style={{ fontSize: 13, fill: "#F8FAFC", fontWeight: 700 }} 
                            dy={-15} 
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
                <div className="lg:col-span-1">
                  <KpiCard
                    label="Caminhões no ano"
                    value={formatNumber(countDistinctPlates ? yearTotals.plates : yearTotals.loads)}
                    unit={countDistinctPlates ? "Placas distintas" : "Viagens totais"}
                    hint={<span className="font-semibold text-indigo-400">Frota consolidada {year}</span>}
                    className="h-full"
                  />
                </div>
              </div>

            {/* OTD e Ranking (Otimização Inferior) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Aderência OTD" subtitle={`Performance mensal · ${year ?? ""}`}>
                {otdByMonth.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={otdByMonth} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                      <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, 115]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar
                        name="Aderência"
                        dataKey="rate"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                        onClick={(data) => {
                          const label = data.activeLabel || data.month;
                          const monthIdx = MONTH_LABELS.indexOf(label);
                          if (monthIdx === -1) return;
                          const monthRows = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                          const filtered = monthRows.filter(r => !norm(r[COL.otd]).startsWith("aderente"));
                          openDrillDown(`Atrasos (Não Aderentes): ${label}`, filtered);
                        }}
                        className="cursor-pointer"
                      >
                        {otdByMonth.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.rate >= 98 ? "#10b981" : "#EF4444"} />
                        ))}
                        <LabelList
                          dataKey="rate"
                          position="top"
                          formatter={(v: number) => (v > 0 ? `${formatNumber(v, 1)}%` : "")}
                          fill="#F8FAFC"
                          style={{ fontSize: 13, fontWeight: 700 }}
                          dy={-15}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </ChartCard>

              <OtdCard 
                title="OTD Geral" 
                subtitle={`Visão acumulada · ${year ?? ""}`} 
                stats={otdYear} 
                rows={yearRows}
                onDrillDown={openDrillDown}
              />
            </div>

            {/* Ranking Transportadoras */}
            <div>
              <ChartCard title="Ranking de Transportadoras" subtitle={`Top 5 Carregamentos · ${year ?? ""}`}>
                {carriers.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={carriers.slice(0, 5)} layout="vertical" margin={{ top: 25, right: 80, left: 0, bottom: 20 }}>
                      <CartesianGrid stroke={GRID} horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="carrier"
                        {...AXIS}
                        width={140}
                        tickFormatter={(value) => formatCarrierName(value)}
                        tick={{ fill: "#F8FAFC", fontSize: 11, fontWeight: 700 }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar
                        name="Cargas"
                        dataKey="loads"
                        fill="#4f46e5"
                        radius={[0, 6, 6, 0]}
                        barSize={24}
                        onClick={(data) => {
                          if (!data || !data.carrier) return;
                          const filtered = yearRows.filter(r => (str(r[COL.carrier]) || "CALTEC") === data.carrier);
                          openDrillDown(`Transportadora: ${data.carrier}`, filtered);
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList
                          dataKey="loads"
                          position="right" 
                          fill="#F8FAFC"
                          style={{ fontSize: 12, fontWeight: 700 }}
                          dx={10}
                          formatter={(v: number) => {
                            const total = carriers.reduce((s, c) => s + c.loads, 0);
                            const p = total ? Math.round((v / total) * 100) : 0;
                            return `${v} (${p}%)`;
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </ChartCard>
            </div>

            {/* Tempo de Descarga (Linha Dupla) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard
                title="Tempo médio de descarga por mês"
                subtitle={`Horas · ${MONTH_LABELS[DISCHARGE_START_MONTH - 1]} em diante`}
              >
                {dischargeByMonth.some((p) => p.samples > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dischargeByMonth} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                      <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.15]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar
                        dataKey="hours"
                        name="Tempo (h)"
                        fill="#4f46e5"
                        radius={[6, 6, 0, 0]}
                        onClick={(data) => {
                          const label = data?.activeLabel || data?.month;
                          if (!label) return;
                          const monthIdx = MONTH_LABELS.indexOf(label);
                          if (monthIdx === -1) return;
                          const filtered = yearRows.filter(r => {
                            const d = parseDate(r[COL.finished]) || parseDate(r[COL.arrived]);
                            const hours = dischargeHours(r);
                            return d && d.getMonth() === monthIdx && hours !== null && hours > 0 && !isCancelled(r);
                          });
                          openDrillDown(`Embarques Descarga: ${label}`, filtered);
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList 
                          dataKey="hours" 
                          position="top" 
                          formatter={(v: number) => v > 0 ? `${formatNumber(v, 1)}h` : ""} 
                          style={{ fontSize: 13, fill: "#F8FAFC", fontWeight: 700 }} 
                          dy={-15} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState label="Sem dados de descarga no período" />
                )}
              </ChartCard>

              <ChartCard 
                title="Distribuição do Tempo" 
                subtitle={`Por faixas de horário · ${year ?? ""}`}
              >
                {bands.some((b) => b.loads > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={bands} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                      <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="band" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.15]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar
                        name="Viagens"
                        dataKey="loads"
                        fill="#6366f1"
                        radius={[6, 6, 0, 0]}
                        onClick={(data) => {
                          const label = data?.activeLabel || data?.band;
                          if (!label) return;
                          const bandInfo = DISCHARGE_BANDS.find(b => b.label === label);
                          if (!bandInfo) return;
                          const filtered = yearRows.filter(r => {
                            const h = dischargeHours(r);
                            const d = parseDate(r[COL.finished]) || parseDate(r[COL.arrived]);
                            const isAfterMay = d && (d.getMonth() + 1) >= DISCHARGE_START_MONTH;
                            return h !== null && h > 0 && isAfterMay && bandInfo.test(h) && !isCancelled(r);
                          });
                          openDrillDown(`Faixa de Descarga: ${label}`, filtered);
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList 
                          dataKey="loads" 
                          position="top" 
                          style={{ fontSize: 13, fill: "#F8FAFC", fontWeight: 700 }} 
                          dy={-15} 
                        />
                        {bands.map((entry, index) => {
                          const colors: Record<string, string> = {
                            "Até 5h": "#10b981",
                            "5h a 12h": "#FBBF24",
                            "12h a 24h": "#F97316",
                            "Acima de 24h": "#EF4444"
                          };
                          return <Cell key={`cell-${index}`} fill={colors[entry.band] || "#4f46e5"} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState label="Sem faixas de descarga calculáveis" />
                )}
              </ChartCard>
            </div>

            {/* Cancelamentos e KPIs Consolidados (Linha Dupla) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Cancelamentos Mensais" subtitle={`Perdas reais · ${year ?? ""}`}>
                {cancelsMonthly.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={cancelsMonthly} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                      <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.15]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar
                        name="Cancelados"
                        dataKey="cancellations"
                        fill="#EF4444"
                        radius={[6, 6, 0, 0]}
                        onClick={(data) => {
                          const label = data?.activeLabel || data?.month;
                          if (!label) return;
                          const monthIdx = MONTH_LABELS.indexOf(label);
                          if (monthIdx === -1) return;
                          const monthRows = filterPeriod(calRows.filter(isCancelled), { ...selection, month: monthIdx + 1 });
                          openDrillDown(`Cancelamentos: ${label}`, monthRows);
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList 
                          dataKey="cancellations" 
                          position="top" 
                          style={{ fontSize: 13, fill: "#F8FAFC", fontWeight: 700 }} 
                          dy={-15} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </ChartCard>

              <div className="flex flex-col gap-4">
                <KpiCard
                  label="Tempo Médio de Descarga"
                  value={avgDischargeYear === null ? "—" : formatNumber(avgDischargeYear, 1)}
                  unit="Horas"
                  hint={<span className="font-semibold text-indigo-400">Média anual {year}</span>}
                  className="min-h-0 flex-1"
                />
                <KpiCard
                  label="Cancelamentos Reais"
                  value={formatNumber(cancels.real)}
                  unit="Cargas perdidas"
                  hint={<span className="font-semibold text-red-400">{cancels.redone} refeitos não contabilizados</span>}
                  className="min-h-0 flex-1"
                />
              </div>
            </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-5 pb-10">
        <div className="print-muted flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>caltec.com.br · Av. Agrimensor Gildo Pinheiro da Luz, 569 · Itaperuçu - PR</span>
          <span className="no-print inline-flex items-center gap-1">
            <Printer className="h-3 w-3" /> Use “Gerar PDF” para o documento oficial
          </span>
        </div>
      </footer>
      <Dialog open={drillDownData.open} onOpenChange={(open) => setDrillDownData(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#1E293B] border-[#334155] text-white">
          <DialogHeader className="p-6 pb-2 border-b border-[#334155]">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Search className="h-5 w-5 text-[#F59E0B]" />
              {drillDownData.title}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#334155] hover:bg-transparent">
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Cod Referência / NF</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Datas (Coleta / Chegada / Fim)</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Transportadora</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Motorista / Placa</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Status / Tempo Descarga</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">OTD / Atraso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDownData.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-[#64748B]">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    drillDownData.rows.map((row, idx) => {
                      const otd = norm(row[COL.otd]);
                      const isAderente = otd.startsWith("aderente");
                      const isCancel = isCancelled(row);
                      const h = dischargeHours(row);
                      
                      return (
                        <TableRow key={idx} className="border-[#334155] hover:bg-[#334155]/30">
                          <TableCell className="font-mono text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-white">{str(row[COL.reference]) || str(row["Cod Referencia"]) || str(row["cod_referencia"]) || "—"}</span>
                              <span className="text-[10px] text-[#64748B]">NF: {str(row[COL.invoice]) || str(row["NF"]) || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-white"><span className="text-[#64748B]">Col:</span> {str(row[COL.pickup]) || "—"}</span>
                              <span className="text-white"><span className="text-[#64748B]">Che:</span> {str(row[COL.arrived]) || "—"}</span>
                              <span className="text-white"><span className="text-[#64748B]">Fim:</span> {str(row[COL.finished]) || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{str(row[COL.carrier])}</TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium">{str(row["Motorista"])}</div>
                            <div className="text-[10px] text-[#64748B]">{str(row[COL.plate])}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex flex-col gap-1">
                              {isCancel ? (
                                <span className="text-red-400 font-bold uppercase text-[10px]">Cancelado</span>
                              ) : (
                                <span className="text-[#94A3B8] font-medium">{str(row[COL.status]) || "Finalizado"}</span>
                              )}
                              {h !== null && h > 0 && (
                                <div className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded w-fit">
                                  Descarga: {formatNumber(h, 1)}h
                                </div>
                              )}
                              <div className="text-[10px] text-[#64748B] italic">{str(row["Motivo"]) || str(row["Observação"])}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase w-fit",
                                isAderente ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                              )}>
                                {str(row[COL.otd]) || "—"}
                              </span>
                              {!isAderente && !isCancel && (
                                <div className="text-[10px] font-bold text-red-400">
                                  {str(row["Atraso"]) || str(row["Justificativa Atraso"]) || "Atraso não especificado"}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</span>
      {children}
    </div>
  );
}

function OtdCard({
  title,
  subtitle,
  stats,
  rows,
  onDrillDown,
}: {
  title: string;
  subtitle: string;
  stats: { adherent: number; notAdherent: number; total: number; rate: number | null };
  rows: Row[];
  onDrillDown: (title: string, data: Row[]) => void;
}) {
  const otdRate = stats.rate ?? 0;
  const isSuccess = otdRate >= 98;
  const data = [
    { name: "Aderente", value: stats.adherent, fill: "#10B981" },
    { name: "Não Aderente", value: stats.notAdherent, fill: "#EF4444" },
  ].filter((slice) => slice.value > 0);

  // For OTD pie colors: adherent is green (#10B981), not adherent is red (#EF4444)
  const pieData = data.map(d => ({
    ...d,
    fill: d.name === "Aderente" ? "#10B981" : "#EF4444"
  }));

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {stats.total ? (
        <div className="grid grid-cols-2 items-center gap-2 h-full">
          <ResponsiveContainer width="100%" height={150} style={{ overflow: "visible" }}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                dataKey="value"
                innerRadius={40}
                outerRadius={65}
                strokeWidth={0}
                onClick={(entry) => {
                  const filtered = rows.filter((r) => {
                    const otdNorm = norm(r[COL.otd]);
                    return entry.name === "Aderente"
                      ? otdNorm.startsWith("aderente")
                      : !otdNorm.startsWith("aderente");
                  });
                  onDrillDown(`OTD Geral: ${entry.name}`, filtered);
                }}
                className="cursor-pointer outline-none"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center">
            <p className={`text-3xl font-extrabold ${isSuccess ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {formatNumber(stats.rate ?? 0, 1)}%
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Aderente: <span className="font-bold text-[#10B981]">{formatNumber(stats.adherent)}</span>
            </p>
            <p className="text-xs text-[#94A3B8]">
              Não Aderente: <span className="font-bold text-[#EF4444]">{formatNumber(stats.notAdherent)}</span>
            </p>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#334155]">
              Total: <span className="font-bold text-white">{formatNumber(stats.total)}</span>
            </p>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </ChartCard>
  );
}
