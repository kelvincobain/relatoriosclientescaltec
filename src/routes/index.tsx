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
import { FileDown, Printer, RefreshCcw, Truck, Upload, Info, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import logoDark from "@/assets/caltec-logo-dark.png.asset.json";
import logoPrint from "@/assets/caltec-logo-print.png.asset.json";
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
import { KpiCard } from "@/components/report/KpiCard";
import {
  COL,
  MONTH_LABELS,
  clearDataset,
  loadDataset,
  norm,
  parseDate,
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
  fontSize: 11, 
  tickLine: false, 
  axisLine: false,
  tick: { fill: "#94A3B8", fontWeight: 500 },
  interval: 0,
};

const X_AXIS_PROPS = {
  ...AXIS,
  padding: { left: 20, right: 20 }
};

const Y_AXIS_HIDDEN = {
  ...AXIS,
  width: 0,
  tick: false,
  axisLine: false,
  tickLine: false,
  hide: true
};

const GRID = "var(--grid-line)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-md">
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
  const [city, setCity] = useState("");
  const [client, setClient] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [countDistinctPlates, setCountDistinctPlates] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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
    // Enable dark theme mode
    document.documentElement.classList.add('dark');
  }, []);

  const rows = dataset?.rows ?? [];
  const allRows = dataset?.rows ?? [];
  const cities = useMemo(() => getCities(rows), [rows]);
  const clients = useMemo(() => getClients(rows, city), [rows, city]);
  const years = useMemo(() => getYears(rows, city, client), [rows, city, client]);

  useEffect(() => {
    if (years.length && (year === null || !years.includes(year))) {
      setYear(years[years.length - 1] ?? null);
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

  const monthly = useMemo(() => monthlySeries(calRows, year).filter(m => m.tons > 0 || m.loads > 0), [calRows, year]);
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
        };
      })
      .filter(m => m.rate > 0);
  }, [calRows, year, selection]);
  const otdYear = useMemo(() => otdStats(yearRows), [yearRows]);
  const dischargeByMonth = useMemo(() => dischargeMonthly(calRows, year).filter(m => m.samples > 0), [calRows, year]);
  const bands = useMemo(() => dischargeBands(periodRows), [periodRows]);
  const cancels = useMemo(
    () => cancellationStats(calRows, allScoped, { ...selection, month: null }),
    [calRows, allScoped, year, city, client],
  );
  const cancelsMonthly = useMemo(
    () => cancellationsMonthly(calRows, allScoped, selection),
    [calRows, allScoped, year, city, client],
  );
  const yearTotals = useMemo(() => totals(yearRows), [yearRows]);
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
      const next: Dataset = {
        rows: parsed,
        fileName: file.name,
        updatedAt: new Date().toISOString(),
        isSample: false,
      };
      setDataset(next);
      saveDataset(next);
      setCity("");
      setClient("");
      setYear(null);
      setMonth(null);
      toast.success(`Base atualizada: ${formatNumber(parsed.length)} linhas.`);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível ler o arquivo. Envie um Excel (.xlsx) ou CSV.");
    }
  }

  return (
    <div className="print-sheet min-h-screen bg-background">
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

      {/* Cabeçalho fixo com logo Caltec */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur print:static print:bg-transparent">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
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
                {ready ? client : "Selecione cidade e cliente"}
              </h1>
              <p className="print-muted text-xs text-muted-foreground">
                {ready
                  ? `${city}${year ? ` · ${month ? MONTH_LABELS[month - 1] + "/" : ""}${year}` : ""}`
                  : "Relatório de operações logísticas"}
              </p>
            </div>
          </div>

          <div className="no-print flex items-center gap-2">
            {adminMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Atualizar base de dados
                </Button>
                {!dataset?.isSample ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearDataset();
                      setDataset({
                        rows: buildSampleRows(),
                        fileName: "Base de exemplo",
                        updatedAt: new Date().toISOString(),
                        isSample: true,
                      });
                      setCity("");
                      setClient("");
                      toast.info("Base de exemplo restaurada.");
                    }}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Usar exemplo
                  </Button>
                ) : null}
              </>
            ) : null}
            <Button size="sm" onClick={() => window.print()} disabled={!ready}>
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        </div>

        {/* Filtros em cascata */}
        <div className="no-print border-t border-border bg-card/40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-3 px-5 py-3">
            <Field label="Cidade">
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value);
                  setClient("");
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
              <Select value={client} onValueChange={setClient} disabled={!city}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={city ? "Selecione o cliente" : "Escolha a cidade primeiro"} />
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
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((option) => (
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
                <SelectTrigger className="w-[170px]">
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

            <div className="ml-auto flex items-center gap-4">
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
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {!ready ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
            <Truck className="h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              Selecione uma cidade e um cliente
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Os indicadores consideram somente operações de <strong>Cal industrial</strong>. A
              lista de clientes é filtrada pela cidade escolhida para evitar homônimos.
            </p>
            {adminMode ? (
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Atualizar base de dados
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs removidos conforme solicitado */}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 5.1 Volume (Gráfico + Card) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px]">
                <ChartCard title="Volume por mês" subtitle={`Toneladas · ${year ?? ""}`}>
                  {yearTotals.loads ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={monthly} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)} t`} />
                        <Bar 
                          dataKey="tons" 
                          name="Volume" 
                          fill="var(--chart-1)" 
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => {
                            const monthIdx = monthly.findIndex(m => m.month === data.month) + 1;
                            const filtered = filterPeriod(calRows, { ...selection, month: monthIdx });
                            openDrillDown(`Volume: ${data.month}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList dataKey="tons" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 0)}t` : ""} style={{ fontSize: 13, fill: "#FFFFFF", fontWeight: 800 }} dy={-10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </ChartCard>
                <KpiCard
                  label={`Volume no ano`}
                  value={formatNumber(yearTotals.tons, 1)}
                  unit="Toneladas"
                  variant="large"
                  hint={<span className="font-semibold text-primary">Volume consolidado em {year}</span>}
                  className="h-full flex flex-col justify-center"
                />
              </div>

              {/* 5.2 Caminhões (Gráfico + Card) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px]">
                <ChartCard title="Caminhões por mês" subtitle={`${truckLabel} · ${year ?? ""}`}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthly} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="month" {...X_AXIS_PROPS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey={truckKey} 
                        name={truckLabel} 
                        fill="var(--chart-2)" 
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => {
                          const monthIdx = monthly.findIndex(m => m.month === data.month) + 1;
                          const filtered = filterPeriod(calRows, { ...selection, month: monthIdx });
                          openDrillDown(`Caminhões: ${data.month}`, filtered);
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList dataKey={truckKey} position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 13, fill: "#FFFFFF", fontWeight: 800 }} dy={-10} />
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_320px] lg:col-span-2">
                <ChartCard title="OTD do Período" subtitle={`Aderência por mês · ${year ?? ""}`}>
                  {otdByMonth.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={otdByMonth} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)}%`} />
                        <Bar
                          name="Aderência"
                          dataKey="rate"
                          fill="var(--color-chart-2)"
                          radius={[6, 6, 0, 0]}
                          barSize={32}
                          onClick={(data) => {
                            const monthIdx = otdByMonth.findIndex(m => m.month === data.month) + 1;
                            const monthRows = filterPeriod(calRows, { ...selection, month: monthIdx });
                            const filtered = monthRows.filter(r => !norm(r[COL.otd]).startsWith("aderente"));
                            openDrillDown(`Atrasos (Não Aderentes): ${data.month}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList
                            dataKey="rate"
                            position="top"
                            formatter={(v: number) => (v > 0 ? `${formatNumber(v, 1)}%` : "")}
                            fill="#FFFFFF"
                            style={{ fontSize: 13, fontWeight: 800 }}
                            dy={-10}
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
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Ranking Transportadoras */}
              <div className="lg:col-span-2">
                <ChartCard title="Ranking de Transportadoras" subtitle={`Carregamentos no ano · ${year ?? ""}`}>
                  {carriers.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={carriers.slice(0, 5)} layout="vertical" margin={{ top: 25, right: 60, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="carrier"
                          {...AXIS}
                          width={150}
                          tick={{ fill: "#FFFFFF", fontSize: 11, fontWeight: 700 }}
                          padding={{ top: 10, bottom: 10 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          name="Cargas"
                          dataKey="loads"
                          fill="var(--primary)"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                          onClick={(data) => {
                            const filtered = yearRows.filter(r => str(r[COL.carrier]) === data.carrier);
                            openDrillDown(`Transportadora: ${data.carrier}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList
                            dataKey="loads"
                            position="right" 
                            fill="#FFFFFF"
                            style={{ fontSize: 12, fontWeight: 800 }}
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

              {/* 5.5 Tempo médio de descarga (Gráfico + Card) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px] lg:col-span-2">
                <ChartCard
                  title="Tempo médio de descarga por mês"
                  subtitle="Horas · maio em diante"
                >
                  {dischargeByMonth.some((p) => p.samples > 0) ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={dischargeByMonth} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="hours"
                          name="Tempo (h)"
                          fill="var(--chart-1)"
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => {
                            const monthIdx = dischargeByMonth.findIndex(m => m.month === data.month) + 1;
                            const filtered = filterPeriod(calRows, { ...selection, month: monthIdx });
                            openDrillDown(`Descarga: ${data.month}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList dataKey="hours" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 1)}h` : ""} dy={-10} style={{ fontSize: 13, fill: "#FFFFFF", fontWeight: 800 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState label="Sem datas de chegada/finalização preenchidas" />
                  )}
                </ChartCard>
                <KpiCard
                  label="Tempo médio de descarga no ano"
                  value={avgDischargeYear === null ? "—" : formatNumber(avgDischargeYear, 1)}
                  unit="Horas"
                  variant="large"
                  hint={<span className="font-semibold text-amber-500">Média em {year} (maio em diante)</span>}
                  className="h-full flex flex-col justify-center"
                />
              </div>
              {/* 5.6 Faixas de descarga */}


              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:col-span-2">
                <ChartCard
                  title="Distribuição do tempo de descarga"
                  subtitle={`Carregamentos por faixa · ${month ? MONTH_LABELS[month - 1] + "/" : ""}${year ?? ""} · maio em diante`}
                >
                  {bands.some((b) => b.loads > 0) ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={bands} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="band" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="loads" 
                          name="Carregamentos" 
                          fill="var(--chart-1)" 
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => {
                            const filtered = periodRows.filter(r => {
                              const h = dischargeHours(r);
                              if (h === null) return false;
                              const bandDef = DISCHARGE_BANDS.find(b => b.label === data.band);
                              return bandDef ? bandDef.test(h) : false;
                            });
                            openDrillDown(`Faixa de Descarga: ${data.band}`, filtered);
                          }}
                          className="cursor-pointer"
                        >
                          <LabelList dataKey="loads" position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 13, fill: "#FFFFFF", fontWeight: 800 }} dy={-10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState label="Sem tempos de descarga calculáveis no período" />
                  )}
                </ChartCard>

                {/* Cancelamentos */}
                <ChartCard title="Cancelamentos Mensais" subtitle={`Realizados (sem reagendamento) · ${year ?? ""}`}>
                  {cancelsMonthly.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={cancelsMonthly} margin={{ top: 25, right: 25, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="month" {...X_AXIS_PROPS} />
                        <YAxis {...Y_AXIS_HIDDEN} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                          <Bar
                            name="Cancelamentos"
                            dataKey="cancellations"
                            fill="#EF4444"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            onClick={(data) => {
                              const monthIdx = cancelsMonthly.findIndex(m => m.month === data.month) + 1;
                              const filtered = filterPeriod(calRows.filter(isCancelled), { ...selection, month: monthIdx })
                                .filter(row => {
                                  const planned = str(row[COL.plannedDelivery]);
                                  const siblings = calRowsAllProducts.filter(
                                    (other) =>
                                      other !== row &&
                                      str(other[COL.plannedDelivery]) === planned &&
                                      planned !== "" &&
                                      !isCancelled(other)
                                  );
                                  return siblings.length === 0;
                                });
                              openDrillDown(`Cancelamentos: ${data.month}`, filtered);
                            }}
                            className="cursor-pointer"
                          >
                            <LabelList
                              dataKey="cancellations"
                              position="top"
                              fill="#FFFFFF"
                              style={{ fontSize: 13, fontWeight: 800 }}
                              dy={-10}
                            />
                          </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </ChartCard>
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
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Embarque / Viagem</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Data Coleta</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Transportadora</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Motorista / Placa</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">OTD</TableHead>
                    <TableHead className="text-[#94A3B8] font-bold uppercase text-[10px]">Status / Obs</TableHead>
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
                      
                      return (
                        <TableRow key={idx} className="border-[#334155] hover:bg-[#334155]/30">
                          <TableCell className="font-mono text-xs">{str(row["Código da Viagem"]) || str(row["Embarque"]) || "—"}</TableCell>
                          <TableCell className="text-xs">{str(row[COL.pickup])}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{str(row[COL.carrier])}</TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium">{str(row["Motorista"])}</div>
                            <div className="text-[10px] text-[#64748B]">{str(row[COL.plate])}</div>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                              isAderente ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                            )}>
                              {str(row[COL.otd]) || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px]">
                            {isCancel ? (
                              <span className="text-red-400">Cancelado</span>
                            ) : (
                              <span className="text-[#94A3B8] italic">{str(row[COL.status]) || "—"}</span>
                            )}
                            <div className="text-[10px] text-[#64748B]">{str(row["Motivo"]) || str(row["Observação"])}</div>
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
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function OtdCard({
  title,
  subtitle,
  stats,
}: {
  title: string;
  subtitle: string;
  stats: { adherent: number; notAdherent: number; total: number; rate: number | null };
}) {
  const isSuccess = (stats.rate ?? 0) > 98;
  const data = [
    { name: "Aderente", value: stats.adherent, fill: isSuccess ? "var(--chart-2)" : "var(--destructive)" },
    { name: "Não Aderente", value: stats.notAdherent, fill: "var(--muted-foreground)" },
  ].filter((slice) => slice.value > 0);
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {stats.total ? (
        <div className="grid grid-cols-2 items-center gap-2 h-full">
          <ResponsiveContainer width="100%" height={150} style={{ overflow: 'visible' }}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
               <Pie 
                data={data} 
                cx="50%" 
                cy="50%"
                dataKey="value" 
                innerRadius={40} 
                outerRadius={65} 
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center">
            <p className={`text-3xl font-extrabold ${isSuccess ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {formatNumber(stats.rate ?? 0, 1)}%
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">Aderente: {formatNumber(stats.adherent)}</p>
            <p className="text-xs text-[#94A3B8]">Não Aderente: {formatNumber(stats.notAdherent)}</p>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#334155]">Total: {formatNumber(stats.total)}</p>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </ChartCard>
  );
}
