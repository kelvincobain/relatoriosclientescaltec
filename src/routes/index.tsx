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
import usinasData from "@/data/usinas.json";
import {
  COL,
  COCKPIT_COL,
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
  isCalIndustrial,
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
  getServiceTimeData,
  serviceTimeStats,
  normalizeClientName,
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
  stroke: "#1e293b", 
  fontSize: 9, 
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

const GRID = "rgba(30, 41, 59, 0.4)";
const GRID_DASH = "3 3";

function SlaChip({ label, value, percent, color }: { label: string; value: string; percent?: number; color: 'emerald' | 'blue' | 'amber' | 'red' }) {
  const colors = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-500",
    red: "bg-red-500/10 border-red-500/20 text-red-500"
  };

  return (
    <div className={cn("flex flex-col justify-center px-3 py-1.5 rounded-[6px] border backdrop-blur-sm h-[50px]", colors[color])}>
      <span className="text-[9px] font-bold uppercase tracking-tight opacity-80 leading-tight truncate">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-black text-white">{value}</span>
        {percent !== undefined && (
          <span className="text-[10px] font-bold opacity-70">({percent}%)</span>
        )}
      </div>
    </div>
  );
}



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
                {entry.name === "Volume" || entry.name === "Tons" || entry.name === "Peso" 
                  ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(entry.value) + ' t'
                  : entry.value}
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
  
  // Make dataset available for debugging in preview
  useEffect(() => {
    if (dataset) {
      (window as any).dataset = dataset;
    }
  }, [dataset]);

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [client, setClient] = useState("");
  const [year, setYear] = useState<number | null>(2026);
  const [month, setMonth] = useState<number | null>(null);
  const [countDistinctPlates, setCountDistinctPlates] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cockpitFileInput = useRef<HTMLInputElement>(null);

  const [drillDownData, setDrillDownData] = useState<{
    open: boolean;
    title: string;
    rows: Row[];
  }>({ open: false, title: "", rows: [] });

  const openDrillDown = (title: string, data: Row[]) => {
    setDrillDownData({ open: true, title, rows: data });
  };

  useEffect(() => {
    async function init() {
      try {
        console.log("[Dashboard] Init started");
        const { loadDatasetFromIDB, saveDatasetToIDB } = await import("@/lib/report-persistence");
        const { DEFAULT_DATASET, saveDataset } = await import("@/lib/report-data");
        
        console.log("[Dashboard] DEFAULT_DATASET count:", DEFAULT_DATASET.rows.length);
        let stored = await loadDatasetFromIDB();
        
        if (stored && stored.rows && stored.rows.length > 0) {
          console.log("[Dashboard] Loaded from IDB:", stored.rows.length);
          setDataset(stored);
        } else {
          console.log("[Dashboard] IndexedDB empty, using DEFAULT_DATASET");
          setDataset(DEFAULT_DATASET);
          // Also persist to IDB for future loads and legacy localStorage for safety
          await saveDatasetToIDB(DEFAULT_DATASET);
          saveDataset(DEFAULT_DATASET);
        }
      } catch (err) {
        console.error("[Dashboard] Init error:", err);
        const { DEFAULT_DATASET } = await import("@/lib/report-data");
        setDataset(DEFAULT_DATASET);
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
    // Only auto-select if we just loaded the dataset for the first time and nothing is selected
    if (rows.length > 0 && !state && !city && !client) {
      console.log("[Dashboard] Initial auto-selection");
      
      const activeRows = rows.filter(r => isCalIndustrial(r) && !isCancelled(r));
      if (activeRows.length > 0) {
        const raizen = activeRows.find(r => 
          norm(str(r[COL.city])) === norm("PIRACICABA")
        );
        
        const valid = raizen || activeRows[0];
        if (valid) {
          const s = str(valid[COL.uf]);
          const c = str(valid[COL.city]);
          const cl = normalizeClientName(str(valid[COL.client]));
          
          setState(s);
          setCity(c);
          setClient(cl);
        }
      }
    }
  }, [dataset]);
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

  const selection: Selection = useMemo(() => ({ city, client, year, month }), [city, client, year, month]);
  
  const calRows = useMemo(() => scopeRows(rows, city, client), [rows, city, client]);
  const allScoped = useMemo(() => scopeRowsAllProducts(rows, city, client), [rows, city, client]);

  const yearRows = useMemo(
    () => filterPeriod(calRows, { ...selection, month: null }),
    [calRows, selection],
  );
  
  const periodRows = useMemo(() => filterPeriod(calRows, selection), [calRows, selection]);

  const monthly = useMemo(() => monthlySeries(calRows, year).filter(m => m.loads > 0 || m.tons > 0), [calRows, year]);
  
  const yearly = useMemo(
    () => yearlySeries(calRows, allScoped, selection),
    [calRows, allScoped, selection],
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
  
  const bands = useMemo(() => dischargeBands(yearRows), [yearRows]);
  
  const cancels = useMemo(
    () => cancellationStats(calRows, allScoped, { ...selection, month: null }),
    [calRows, allScoped, selection],
  );
  
  const cancelsMonthly = useMemo(
    () => cancellationsMonthly(allScoped, selection),
    [allScoped, selection],
  );
  const yearTotals = useMemo(() => totals(yearRows), [yearRows]);
  const monthTotals = useMemo(() => totals(periodRows), [periodRows]);
  const avgDischargeYear = useMemo(() => averageDischarge(yearRows), [yearRows]);

  const serviceTimeData = useMemo(() => {
    return import.meta.env.SSR ? [] : getServiceTimeData(calRows, cockpitRows, selection);
  }, [calRows, cockpitRows, selection]);

  const serviceStats = useMemo(() => serviceTimeStats(serviceTimeData), [serviceTimeData]);

  const lastUpdateDate = useMemo(() => {
    const allDates: Date[] = [];
    
    // Datas da Base Ojo
    rows.forEach(r => {
      const d = parseDate(r[COL.arrived]) || parseDate(r[COL.finished]) || parseDate(r[COL.pickup]) || parseDate(r[COL.plannedDelivery]);
      if (d) allDates.push(d);
    });
    
    // Datas da Base Cockpit
    cockpitRows.forEach(r => {
      const dInc = parseDate(r[COCKPIT_COL.inclusion] || r["Data Inclusão"] || r["Data Inclusao"]);
      const dCar = parseDate(r[COCKPIT_COL.loading] || r["Data Carregamento"]);
      if (dInc) allDates.push(dInc);
      if (dCar) allDates.push(dCar);
    });

    if (!allDates.length) return null;
    return new Date(Math.max(...allDates.map(d => d.getTime())));
  }, [rows, cockpitRows]);

  const ready = Boolean(rows.length > 0 && city && client);
  const truckKey = countDistinctPlates ? "plates" : "loads";
  const truckLabel = countDistinctPlates ? "Placas distintas" : "Carregamentos";

  const handleUpload = async (file: File, type: 'ojo' | 'cockpit') => {
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
      } else {
        nextCockpit = mergeDatasets(currentCockpit, parsed);
      }

      const next: Dataset = {
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
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível ler o arquivo. Envie um Excel (.xlsx) ou CSV.");
    }
  }

  async function handleResetBase() {
    const { clearDatasetIDB } = await import("@/lib/report-persistence");
    const { DEFAULT_DATASET } = await import("@/lib/report-data");
    
    await clearDatasetIDB();
    setDataset(DEFAULT_DATASET);
    setCity("");
    setState("");
    setClient("");
    toast.success("Base de dados restaurada para o padrão nativo.");
  }

  return (
    <div className="print-sheet h-screen flex flex-col overflow-hidden bg-[#0b0f19]">
      {dataset?.rows?.length === 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="text-xl font-bold">Carregando dados...</h2>
            <p className="mt-2 text-muted-foreground">Inicializando base nativa Caltec.</p>
          </div>
        </div>
      )}
      <p className="sr-only">
        {`PROMPT DE REDESIGN PREMIUM E ADEQUAÇÃO A4 LANDSCAPE (SEM ROLAGEM)

Por favor, restruture o layout visual do dashboard mantendo RIGOROSAMENTE todas as variáveis, cálculos e fontes de dados atuais. O objetivo é transformar a tela num Dashboard Executivo Premium pronto para exportação em A4 Horizontal.

1. ESTRUTURA DE TELA E IMPRESSÃO (A4 LANDSCAPE ENCAIXADO):
   - Ajuste o container principal para usar um layout de altura fixa (100vh ou proporção 16:9 em tela) para que TODO o conteúdo caiba visível na tela sem necessidade de scroll vertical.
   - Adicione regras CSS de impressão para exportação em PDF:
     @page { size: A4 landscape; margin: 8mm; }
     @media print {
       body { background-color: #0b0f19 !important; -webkit-print-color-adjust: exact; }
       .no-print { display: none !important; }
       .card { page-break-inside: avoid; }
     }

2. OTINIZAÇÃO DOS CARDS DE "TEMPO DE ATENDIMENTO" (ENXUGAR ESPAÇO):
   - Substitua os cards gigantes de "Quantidade no Prazo" e "Antecipado / Urgente" por uma BARRA DE KPIS COMPACTA (SLA Chips) em 4 colunas na horizontal:
     * Chip 1: No Prazo (SLA) -> 37 Cargas (84%)
     * Chip 2: Antecipado / Urgente -> 7 Cargas (16%)
     * Chip 3: Tempo Médio Descarga -> 27,6 Horas
     * Chip 4: Cancelamentos -> 21 Fretes
   - Altura máxima desses chips: 50px a 60px.

3. REORDENAÇÃO DOS GRÁFICOS INFERIORES:
   - Coloque os gráficos "Tempo Médio de Descarga por Mês" e "Cancelamentos Mensais" lado a lado (grid 2 colunas de 50% de largura cada).
   - Reduza a altura interna das barras dos gráficos em 40% para evitar o desperdício de espaço vertical.

4. ACABAMENTO VISUAL EXECUTIVE DARK:
   - Fundo da página: #0b0f19 (Dark Navy Profundo).
   - Card Background: #131c2e com bordas sutis em #1e293b e border-radius de 8px.
   - Tipografia: Títulos das seções em caixa alta com tom dourado/âmbar (#f59e0b) e subtextos em cinza slate (#94a3b8) para legibilidade perfeita na exportação.`}
      </p>

      <p className="sr-only">
        PROMPT DE EMBUTIMENTO DEFINITIVO E PERSISTÊNCIA DE DADOS

        Anexei nesta mensagem os dois arquivos oficiais com os nomes ajustados:

        - "Base Ojo.xlsx"

        - "Base Cockpit.xlsx"

        Por favor, execute as seguintes etapas para que a aplicação NUNCA MAIS peça upload ao abrir e mantenha os dados salvos permanentemente:

        1. EMBUTIMENTO COMO BASE PADRÃO NATIVA (SRC/DATA):

           - Converta o conteúdo completo das duas planilhas anexadas ("Base Ojo.xlsx" e "Base Cockpit.xlsx") diretamente em arquivos JSON dentro da pasta do projeto:

             * `src/data/baseOjoDefault.json`

             * `src/data/baseCockpitDefault.json`

           - Configure a aplicação para inicializar automaticamente com esses dois JSONs ao abrir a página. O dashboard DEVE abrir 100% carregado e funcional no primeiro segundo, sem exigir nenhum clique ou upload.

        2. PERSISTÊNCIA LOCAL DE LONGO PRAZO (INDEXEDDB):

           - Utilize IndexedDB (via `idb-keyval` ou `localforage`) para salvar o estado das bases no navegador.

           - Fluxo de carregamento:

             1º Se houver dados salvos no IndexedDB, carregue do IndexedDB.

             2º Se for o primeiro acesso (IndexedDB vazio), carregue os dados padrão de `src/data/`.

           - Quando eu enviar atualizações pelos botões "Base Ojo" ou "Base Cockpit", grave as novas informações diretamente no IndexedDB. Assim, recarregar a página (F5) não apagará os dados.

        3. REGRAS DE NEGÓCIO E LAYOUT MANTIDAS:

           - Remova qualquer banner ou texto de erro no topo.

           - Trate o "Peso (kg)" como Toneladas diretas (sem multiplicar por 1.000).

           - Mantenha a filtragem global ignorando status "Frete cancelado" nos cards e gráficos de volume/viagens.

           - Adicione um botão ou opção discreta "Restaurar Base Padrão" no topo.
      </p>
      <p className="sr-only">
        PROMPT DE CORREÇÃO: PARSING DE PONTO DECIMAL E FORMATAÇÃO DE PESO

        Os valores de volume estão sendo exibidos 1.000 vezes maiores que o real devido à leitura incorreta do ponto decimal (.) na coluna "Peso (kg)" da planilha Ojo.

        Por favor, corrija a função de parse e soma do peso:

        1. TRATAMENTO DA COLUNA "Peso (kg)":

        - Ao ler o valor do campo "Peso (kg)" (ex: "39.04", "48.44", "75.98"):

          * Converta o valor diretamente para Float no JavaScript usando:

            const pesoNum = parseFloat(String(row['Peso (kg)']).replace(',', '.'));

          * NÃO multiplique por 1.000 em hipótese alguma.

          * NÃO trate o ponto (.) como separador de milhar durante o parse.

        2. FORMATAÇÃO VISUAL DO GRÁFICO E CARDS:

        - Formate o resultado final no padrão brasileiro (vírgula para decimais, ponto para milhares):

          {'new Intl.NumberFormat(\'pt-BR\', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(pesoNum) + \' t\''}

        - Exemplo esperado para Março em Guariba: 75,98 t (e NÃO 75.980,00t).

        - Exemplo esperado para o Total do Ano em Guariba: 1.862,80 Toneladas (e NÃO 1.862.800,00 Toneladas).
      </p>
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file, 'ojo');
          event.target.value = "";
        }}
      />
      <input
        ref={cockpitFileInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file, 'cockpit');
          event.target.value = "";
        }}
      />

      {/* Cabeçalho superior simplificado - RESTAURAÇÃO DO TOPO GLOBAL */}
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
              {lastUpdateDate && (
                <p className="text-[10px] font-medium text-blue-400 mt-0.5 animate-pulse">
                  Base atualizada até: {lastUpdateDate.toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          <div className="no-print flex items-center gap-3">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInput.current?.click()}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Upload className="mr-2 h-4 w-4" />
                Base Ojo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => cockpitFileInput.current?.click()}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Upload className="mr-2 h-4 w-4" />
                Base Cockpit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetBase}
                className="text-slate-500 hover:text-red-400 transition-all ml-2"
                title="Restaurar Base Padrão"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
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

            <Field label="Estado (UF)" className="flex-1 min-w-[100px] max-w-[140px]">
              <Select
                value={state}
                onValueChange={(value) => {
                  setState(value);
                  setCity("");
                  setClient("");
                }}
              >
                <SelectTrigger className="w-full relative z-50">
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

            <Field label="Cidade" className="flex-[2] min-w-[200px]">
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value);
                  setClient("");
                  const foundRow = rows.find(r => norm(r[COL.city]) === norm(value));
                  if (foundRow) setState(str(foundRow[COL.uf]));
                }}
              >
                <SelectTrigger className="w-full relative z-50">
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

            <Field label="Cliente" className="flex-[3] min-w-[250px]">
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
                <SelectTrigger className="w-full relative z-50">
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

            <Field label="Ano" className="flex-1 min-w-[100px] max-w-[120px]">
              <Select
                value={year ? String(year) : ""}
                onValueChange={(value) => setYear(Number(value))}
                disabled={!years.length}
              >
                <SelectTrigger className="w-full relative z-50">
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

            <Field label="Mês" className="flex-1 min-w-[100px] max-w-[140px]">
              <Select
                value={month ? String(month) : "all"}
                onValueChange={(value) => setMonth(value === "all" ? null : Number(value))}
                disabled={false}
              >
                <SelectTrigger className="w-[160px] relative z-50">
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
                    ? `${dataset.fileName} · ${formatNumber(rows.length)} linhas`
                    : "—"}
                </span>
              </div>
            </div>
        </div>
      </div>
      
      <main className="mx-auto w-full px-5 py-2 flex-1 overflow-hidden flex flex-col">
        {!ready ? (
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
          <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
            {/* Banner de Identificação do Cliente (Área do PDF) - DESIGN MODERNO E ELEGANTE */}
            <div className="flex items-center justify-center gap-6 py-4 mb-4 bg-[#131c2e] rounded-xl border border-slate-700/30 backdrop-blur-md shadow-2xl relative overflow-hidden group h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 opacity-50" />
              
              <div className="relative z-10 flex items-center gap-6">
                <div className="p-1 bg-white/5 rounded-lg border border-white/10 shadow-2xl backdrop-blur-sm">
                  {(() => {
                    const info = getClientInfo(client);
                    return (
                      <ClientLogo 
                        clientName={client} 
                        groupName={info?.grupo}
                        urlLogo={info?.logo}
                        className="w-16 h-16 rounded-lg overflow-hidden shadow-inner" 
                      />
                    );
                  })()}
                </div>
                
                <div className="flex flex-col items-start text-left">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1 drop-shadow-sm">
                    {client}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 bg-emerald-500 rounded-full" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {city} <span className="text-slate-600 mx-1">—</span> {state}
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1 overflow-hidden">
              {/* 5.1 Volume (Gráfico + Card) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px]">
                <ChartCard title="Volume por mês" subtitle={`Toneladas · ${year ?? ""}`}>
                  {yearTotals.loads ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={monthly} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />


                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                        <Bar 
                          dataKey="tons" 
                          name="Volume" 
                          fill="#6366f1" 
                          radius={[4, 4, 0, 0]}
                          fillOpacity={0.9}
                          onClick={(data) => {
                            if (!data || !data.activeLabel) return;
                            const monthIdx = MONTH_LABELS.indexOf(data.activeLabel);
                            if (monthIdx === -1) return;
                            const filtered = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                            openDrillDown(`Volume: ${data.activeLabel}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList dataKey="tons" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 2)}t` : ""} style={{ fontSize: 10, fill: "#FFFFFF", fontWeight: 600 }} dy={-8} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </ChartCard>
                <KpiCard
                  label={`Volume no ano`}
                  value={formatNumber(yearTotals.tons, 2)}
                  unit="Toneladas"
                  variant="large"
                  hint={<span className="font-semibold text-primary">Volume consolidado em {year}</span>}
                  className="h-full flex flex-col justify-center"
                />
              </div>

              {/* 5.2 Caminhões (Gráfico + Card) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px]">
                <ChartCard title="Caminhões por mês" subtitle={`${truckLabel} · ${year ?? ""}`}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={monthly} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />


                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                        <Bar 
                          dataKey={truckKey} 
                          name={truckLabel} 
                          fill="#6366f1" 
                          radius={[4, 4, 0, 0]}
                          fillOpacity={0.8}
                        onClick={(data) => {
                          if (!data || !data.activeLabel) return;
                          const monthIdx = MONTH_LABELS.indexOf(data.activeLabel);
                          if (monthIdx === -1) return;
                          const filtered = filterPeriod(calRows, { ...selection, month: monthIdx + 1 });
                          openDrillDown(`Caminhões: ${data.activeLabel}`, filtered);
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList dataKey={truckKey} position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 10, fill: "#FFFFFF", fontWeight: 600 }} dy={-8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <KpiCard
                  label="Caminhões no ano"
                  value={formatNumber(countDistinctPlates ? yearTotals.plates : yearTotals.loads)}
                  unit={countDistinctPlates ? "Placas" : "Viagens"}
                  variant="large"
                  hint={<span className="font-semibold text-emerald-500">{truckLabel} em {year}</span>}
                  className="h-full flex flex-col justify-center"
                />
              </div>

              {/* OTD do Período (Mensal + Geral) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px] lg:col-span-2">
                <ChartCard title="OTD do Período" subtitle={`Aderência por mês · ${year ?? ""}`}>
                  {otdByMonth.length ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={otdByMonth} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, 115]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                        <Bar
                          name="Aderência"
                          dataKey="rate"
                          radius={[4, 4, 0, 0]}
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
                            <Cell key={`cell-${index}`} fill={entry.rate >= 98 ? "#10b981" : "#ef4444"} />
                          ))}
                          <LabelList
                            dataKey="rate"
                            position="top"
                            formatter={(v: number) => (v > 0 ? `${formatNumber(v, 1)}%` : "")}
                             fill="#FFFFFF"
                             style={{ fontSize: 10, fontWeight: 600 }}
                             dy={-8}
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
                  subtitle={`Acumulado · ${year ?? ""}`} 
                  stats={otdYear} 
                  rows={yearRows}
                  onDrillDown={openDrillDown}
                />
              </div>
            </div>

            {/* SLA Chips (Compact KPIs) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-2 py-2">
              <SlaChip 
                label="No Prazo (SLA)" 
                value={`${serviceStats.onTime} Cargas`}
                percent={serviceStats.total ? Math.round((serviceStats.onTime / serviceStats.total) * 100) : 0}
                color="emerald"
              />
              <SlaChip 
                label="Antecipado / Urgente" 
                value={`${serviceStats.urgent} Cargas`}
                percent={serviceStats.total ? Math.round((serviceStats.urgent / serviceStats.total) * 100) : 0}
                color="blue"
              />
              <SlaChip 
                label="Tempo Médio Descarga" 
                value={avgDischargeYear === null ? "—" : `${formatNumber(avgDischargeYear, 1)}h`}
                color="amber"
              />
              <SlaChip 
                label="Cancelamentos" 
                value={`${cancelsMonthly.reduce((sum, m) => sum + m.cancellations, 0)} Fretes`}
                color="red"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Ranking Transportadoras */}
              <div className="lg:col-span-2 hidden">
                <ChartCard title="Ranking de Transportadoras" subtitle={`Carregamentos no ano · ${year ?? ""}`}>
                  {carriers.length ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={carriers.slice(0, 5)} layout="vertical" margin={{ top: 35, right: 100, left: 10, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} horizontal={false} strokeDasharray={GRID_DASH} />
                        <XAxis type="number" hide domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.35)]} />


                        <YAxis
                          type="category"
                          dataKey="carrier"
                          {...AXIS}
                          width={140}
                          tickFormatter={(value) => formatCarrierName(value)}
                          tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                          padding={{ top: 10, bottom: 10 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                          name="Cargas"
                          dataKey="loads"
                          fill="#64748B"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
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
                            fill="#FFFFFF"
                             style={{ fontSize: 10, fontWeight: 600 }}
                             dx={8}
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

              {/* 5.5 Tempo médio de descarga (Gráfico + Card) */}
              <div className="lg:col-span-1">
                <ChartCard
                  title="Tempo médio de descarga por mês"
                  subtitle={`Horas · ${MONTH_LABELS[DISCHARGE_START_MONTH - 1]} em diante`}
                >
                  {dischargeByMonth.some((p) => p.samples > 0) ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={dischargeByMonth} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />


                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                        <Bar
                          dataKey="hours"
                          name="Tempo (h)"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => {
                            // Em BarChart, o label ativo está em activeLabel, mas às vezes o clique direto na barra traz o objeto de dados
                            const label = data?.activeLabel || data?.month;
                            if (!label) return;
                            
                            const monthIdx = MONTH_LABELS.indexOf(label);
                            if (monthIdx === -1) return;

                            const filtered = yearRows.filter(r => {
                              if (isCancelled(r)) return false;
                              const h = dischargeHours(r);
                              if (h === null || h === 0) return false;
                              const d = parseDate(r[COL.finished]) || parseDate(r[COL.arrived]);
                              return d && d.getMonth() === monthIdx;
                            });
                            openDrillDown(`Descarga — ${label}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList dataKey="hours" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 1)}h` : ""} dy={-8} style={{ fontSize: 10, fill: "#FFFFFF", fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState label="Sem datas de chegada/finalização preenchidas" />
                  )}
                </ChartCard>
              </div>
              


              <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                <ChartCard
                  title="Distribuição do tempo de descarga"
                  subtitle={`Carregamentos por faixa · ${month ? MONTH_LABELS[month - 1] + "/" : ""}${year ?? ""} · ${(MONTH_LABELS[Math.max(0, DISCHARGE_START_MONTH - 1)] ?? "maio").toLowerCase()} em diante`}
                >
                  {bands.some((b) => b.loads > 0) ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={bands} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                        <XAxis dataKey="band" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />



                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar 
                          dataKey="loads" 
                          name="Carregamentos" 
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => {
                            if (!data) return;
                            const label = data.activeLabel || data.band;
                            const filtered = yearRows.filter(r => {
                              if (isCancelled(r)) return false;
                              const h = dischargeHours(r);
                              if (h === null || h === 0) return false;
                              
                              // Check month restriction (May onwards)
                              const d = parseDate(r[COL.finished]) || parseDate(r[COL.arrived]);
                              if (!d || (d.getMonth() + 1) < DISCHARGE_START_MONTH) return false;

                              const bandDef = DISCHARGE_BANDS.find(b => b.label === label);
                              return bandDef ? bandDef.test(h) : false;
                            });
                            openDrillDown(`Faixa de Descarga: ${label}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList dataKey="loads" position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 10, fill: "#FFFFFF", fontWeight: 600 }} dy={-8} />
                          {bands.map((entry, index) => {
                            const colors: Record<string, string> = {
                              "Até 5h": "#10b981",
                              "5h a 12h": "#f59e0b",
                              "12h a 24h": "#f97316",
                              "Acima de 24h": "#ef4444"
                            };
                            return <Cell key={`cell-${index}`} fill={colors[entry.band] || "#3B82F6"} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState label="Sem tempos de descarga calculáveis no período" />
                  )}
                </ChartCard>
              </div>
              
              {/* Cancelamentos */}
              <div className="lg:col-span-1">
                <ChartCard 
                  title="CANCELAMENTOS MENSAIS" 
                  subtitle={`Realizados (sem reagendamento) · ${year ?? ""}`}
                    action={
                      <div className="text-2xl font-bold text-amber-500">
                        {formatNumber(
                          cancelsMonthly.reduce((sum, m) => sum + m.cancellations, 0)
                        )}
                      </div>
                    }
                  >
                    {cancelsMonthly.length > 0 ? (
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={cancelsMonthly} margin={{ top: 35, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                          <XAxis dataKey="month" {...X_AXIS_PROPS} />
                          <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar
                              name="Cancelamentos Reais"
                              dataKey="cancellations"
                              fill="#f59e0b"
                              radius={[4, 4, 0, 0]}
                              barSize={32}
                              onClick={(data) => {
                                const monthLabel = data.month;
                                  const filtered = allRows.filter(row => {
                                    const status = str(row[COL.status]).toLowerCase();
                                    const client = str(row[COL.client]);
                                    const city = str(row[COL.city]);
                                    const date = str(row[COL.plannedDelivery]).split(' ')[0] || '';
                                    
                                    // Month match
                                    const parts = date.split('/');
                                    if (parts.length < 2) return false;
                                    const monthIdx = parseInt(parts[1] || '0') - 1;
                                    if (MONTH_LABELS[monthIdx] !== monthLabel) return false;

                                    // Check logic: must be within current filter selection
                                    if (year && (parseDate(row[COL.plannedDelivery])?.getFullYear() !== year)) return false;

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
                              }}
                              className="cursor-pointer"
                            >
                              <LabelList
                                dataKey="cancellations"
                                position="top"
                                fill="#FFFFFF"
                                style={{ fontSize: 13, fontWeight: 700 }}
                                dy={-8}
                              />
                            </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[140px] items-center justify-center text-sm text-slate-500 italic">
                        Nenhum cancelamento no período selecionado
                      </div>
                    )}
                  </ChartCard>
                </div>
              </div>
            </div>
          )}
        </main>

      <footer className="mx-auto w-full px-5 py-2 mt-auto">
        <div className="print-muted flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[10px] text-muted-foreground">
          <span>caltec.com.br · Av. Agrimensor Gildo Pinheiro da Luz, 569 · Itaperuçu - PR</span>
          <span className="no-print inline-flex items-center gap-1 text-[9px]">
            <Printer className="h-2.5 w-2.5" /> Use “Gerar PDF” para o documento oficial
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-1">{label}</span>
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
    { name: "Aderente", value: stats.adherent, fill: "#10b981" },
    { name: "Não Aderente", value: stats.notAdherent, fill: "#ef4444" },
  ].filter((slice) => slice.value > 0);

  // For OTD pie colors: adherent is green (#10b981), not adherent is red (#ef4444)
  const pieData = data.map(d => ({
    ...d,
    fill: d.name === "Aderente" ? "#10b981" : "#ef4444"
  }));

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {stats.total ? (
        <div className="flex items-center justify-between gap-6 h-full px-2">
          <div className="flex-1 h-full min-w-[140px]">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
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
          </div>
          <div className="flex flex-col justify-center min-w-[120px]">
            <p className={`text-3xl font-extrabold ${isSuccess ? "text-[#10b981]" : "text-[#ef4444]"}`}>
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
