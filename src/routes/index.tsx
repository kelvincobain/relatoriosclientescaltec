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


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md">
        <p className="mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                {entry.name}
              </span>
              <span className="text-sm font-bold text-foreground">
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
  
  const yearTotals = useMemo(() => totals(yearRows), [yearRows]);
  const monthTotals = useMemo(() => totals(periodRows), [periodRows]);
  const avgDischargeYear = useMemo(() => averageDischarge(yearRows), [yearRows]);

  const ready = Boolean(city && client);

  return (
    <div className="print-sheet min-h-screen bg-slate-950">
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

      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur print:static print:bg-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <img
              src={logoDark.url}
              alt="Caltec 80 anos"
              className="h-14 w-auto print:hidden"
            />
            <img
              src={logoPrint.url}
              alt="Caltec 80 anos"
              className="hidden h-16 w-auto print:block"
            />
            <div className="border-l border-border pl-4">
              <p className="print-muted text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                Relatório do cliente — Cal industrial
              </p>
              <h1 className="print-text text-lg font-semibold text-foreground">
                Relatório Logístico
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
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Upload className="mr-2 h-4 w-4" />
                Atualizar base
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
                  const foundRow = rows.find(r => 
                    norm(r[COL.client]) === norm(value) && 
                    (!city || norm(r[COL.city]) === norm(city))
                  ) || rows.find(r => norm(r[COL.client]) === norm(value));

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
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {!ready ? (
           <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
               <Search className="h-8 w-8" />
             </div>
             <div className="max-w-md">
               <h2 className="text-xl font-bold text-white">Selecione uma localização e cliente</h2>
               <p className="text-slate-400">Escolha os filtros acima para visualizar os indicadores operacionais da Caltec.</p>
             </div>
           </div>
        ) : (
          <div className="space-y-8">
             {/* Main layout removed for brevity, check other parts for full content */}
             {/* Content continues ... */}
             <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:col-span-2">
                <ChartCard 
                  title="CANCELAMENTOS MENSAIS" 
                  subtitle={`Realizados (sem reagendamento) · ${year ?? ""}`}
                  action={
                    <div className="text-2xl font-bold text-amber-500">
                      {(() => {
                        const filteredData = filterPeriod(calRows, selection);
                        let total = 0;
                        const grupos: Record<string, { statusList: string[] }> = {};
                        filteredData.forEach((row: any) => {
                          const cliente = (row[COL.client] || '').toString().trim();
                          const cidade = (row[COL.city] || '').toString().trim();
                          const dataRaw = (row[COL.plannedDelivery] || '').toString().trim();
                          const status = (row[COL.status] || '').toString().toLowerCase().trim();
                          if (!cliente || !cidade || !dataRaw) return;
                          const dataSemHora = dataRaw.split(' ')[0] || ''; 
                          const chave = `${cliente}|${cidade}|${dataSemHora}`;
                          if (!grupos[chave]) grupos[chave] = { statusList: [] };
                          grupos[chave].statusList.push(status);
                        });
                        Object.values(grupos).forEach(grupo => {
                          if (grupo.statusList.length > 0 && grupo.statusList.every(s => s.includes('cancelado'))) total++;
                        });
                        return total;
                      })()}
                    </div>
                  }
                >
                  {(() => {
                    const filteredData = filterPeriod(calRows, selection);
                    const cancelamentosPorMes: Record<string, number> = {
                      'Jan': 0, 'Fev': 0, 'Mar': 0, 'Abr': 0, 'Mai': 0, 'Jun': 0,
                      'Jul': 0, 'Ago': 0, 'Set': 0, 'Out': 0, 'Nov': 0, 'Dez': 0
                    };
                    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    const grupos: Record<string, { statusList: string[], mes: string }> = {};

                    filteredData.forEach((row: any) => {
                      const cliente = (row[COL.client] || '').toString().trim();
                      const cidade = (row[COL.city] || '').toString().trim();
                      const dataRaw = (row[COL.plannedDelivery] || '').toString().trim();
                      const status = (row[COL.status] || '').toString().toLowerCase().trim();

                      if (!cliente || !cidade || !dataRaw) return;

                      const dataSemHora = dataRaw.split(' ')[0] || ''; 
                      const chave = `${cliente}|${cidade}|${dataSemHora}`;

                      if (!grupos[chave]) {
                        const partes = dataSemHora.split('/');
                        const mesIndex = partes.length > 1 ? parseInt(partes[1], 10) - 1 : 0;
                        grupos[chave] = {
                          statusList: [],
                          mes: nomesMeses[mesIndex] || 'Jan'
                        };
                      }
                      grupos[chave].statusList.push(status);
                    });

                    Object.values(grupos).forEach(grupo => {
                      const isReal = grupo.statusList.length > 0 && grupo.statusList.every(s => s.includes('cancelado'));
                      if (isReal) {
                        cancelamentosPorMes[grupo.mes as keyof typeof cancelamentosPorMes]++;
                      }
                    });

                    const chartData = Object.keys(cancelamentosPorMes)
                      .map(mes => ({ name: mes, quantidade: cancelamentosPorMes[mes as keyof typeof cancelamentosPorMes] }))
                      .filter(item => item.quantidade > 0);

                    return chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                          <XAxis dataKey="name" {...X_AXIS_PROPS} />
                          <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                          <Bar
                            name="Cancelamentos Reais"
                            dataKey="quantidade"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                          >
                            <LabelList
                              dataKey="quantidade"
                              position="top"
                              fill="#FFFFFF"
                              style={{ fontSize: 13, fontWeight: 700 }}
                              dy={-8}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState label="0 cancelamentos identificados no período" />
                    );
                  })()}
                </ChartCard>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  );
}

async function handleUpload(file: File) { /* ... stub ... */ }
