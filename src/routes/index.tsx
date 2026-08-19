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
import { FileDown, Printer, RefreshCcw, Truck, Upload, Info } from "lucide-react";
import { toast } from "sonner";

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
import { ChartCard, EmptyState } from "@/components/report/ChartCard";
import { KpiCard } from "@/components/report/KpiCard";
import {
  MONTH_LABELS,
  clearDataset,
  loadDataset,
  parseWorkbook,
  saveDataset,
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
  stroke: "var(--muted-foreground)", 
  fontSize: 10, 
  tickLine: false, 
  axisLine: false,
  tick: { fill: "var(--muted-foreground)", fontWeight: 500 }
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

  const monthly = useMemo(() => monthlySeries(calRows, year), [calRows, year]);
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
  const dischargeByMonth = useMemo(() => dischargeMonthly(calRows, year), [calRows, year]);
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
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <KpiCard
                label="Volume Total"
                value={formatNumber(yearTotals.tons, 1)}
                unit="Toneladas"
                hint={<span className="font-semibold text-primary">{formatNumber(yearTotals.loads)} carregamentos</span>}
              />
              <KpiCard
                label="Total de Caminhões"
                value={formatNumber(countDistinctPlates ? yearTotals.plates : yearTotals.loads)}
                unit={countDistinctPlates ? "Placas" : "Viagens"}
                hint={truckLabel}
              />
              <KpiCard
                label="Aderência OTD"
                value={otdYear.rate === null ? "—" : `${formatNumber(otdYear.rate, 1)}%`}
                hint={<span className="font-semibold">{formatNumber(otdYear.adherent)} de {formatNumber(otdYear.total)} aderentes</span>}
              />
              <KpiCard
                label="Média de Descarga"
                value={avgDischargeYear === null ? "—" : formatNumber(avgDischargeYear, 1)}
                unit="Horas"
                hint="Considera a partir de Maio"
              />
              <KpiCard
                label="Cancelamentos Mensais"
                value={formatNumber(cancellationStats(calRows, allRows, selection).real)}
                hint={<span className="font-semibold text-primary">No período selecionado</span>}
              />
              <KpiCard
                label="Cancelamentos por Ano"
                value={formatNumber(cancellationStats(calRows, allRows, { ...selection, month: null }).real)}
                hint={<span className="font-semibold">{year}</span>}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 5.1 Volume */}
              <ChartCard title="Volume por mês" subtitle={`Toneladas · ${year ?? ""}`}>
                {yearTotals.loads ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthly}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="month" {...AXIS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.15]} />
                       <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)} t`} />
                       <Bar dataKey="tons" name="Volume" fill="var(--chart-1)" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="tons" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 0)}t` : ""} style={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 800 }} offset={8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </ChartCard>

              <ChartCard title="Volume por ano" subtitle="Comparativo entre anos (toneladas)">
                {yearly.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={yearly}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="year" {...AXIS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.15]} />
                      <Tooltip content={<CustomTooltip />} />
                       <Bar dataKey="tons" name="Volume" fill="var(--chart-1)" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="tons" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 0)}t` : ""} style={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 800 }} offset={8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </ChartCard>

              {/* 5.2 Caminhões */}
              <ChartCard title="Caminhões por mês" subtitle={`${truckLabel} · ${year ?? ""}`}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="month" {...AXIS} />
                    <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.15]} />
                     <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey={truckKey} name={truckLabel} fill="var(--chart-2)" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey={truckKey} position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 800 }} offset={8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Caminhões por ano" subtitle={truckLabel}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={yearly}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="year" {...AXIS} />
                    <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.15]} />
                     <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey={truckKey} name={truckLabel} fill="var(--chart-2)" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey={truckKey} position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 800 }} offset={8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* OTD por Mês */}
              <ChartCard title="OTD do Período" subtitle={`Aderência por mês · ${year ?? ""}`}>
                {otdByMonth.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={otdByMonth}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="month" {...AXIS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, 115]} />
                      <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)}%`} />
                      <Bar
                        name="Aderência"
                        dataKey="rate"
                        fill="var(--color-chart-2)"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      >
                        <LabelList
                          dataKey="rate"
                          position="top"
                          formatter={(v: number) => (v > 0 ? `${formatNumber(v, 1)}%` : "")}
                          fill="var(--foreground)"
                          style={{ fontSize: 13, fontWeight: 800 }}
                          offset={8}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </ChartCard>

              {/* Ranking Transportadoras */}
              <ChartCard title="Ranking de Transportadoras" subtitle={`Carregamentos no ano · ${year ?? ""}`}>
                {carriers.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={carriers.slice(0, 5)} layout="vertical">
                      <CartesianGrid stroke={GRID} horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="carrier"
                        {...AXIS}
                        width={120}
                        tick={{ fill: "var(--foreground)", fontSize: 10 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        name="Cargas"
                        dataKey="loads"
                        fill="var(--primary)"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      >
                        <LabelList
                          dataKey="loads"
                          position="right" 
                          fill="var(--foreground)"
                          style={{ fontSize: 12, fontWeight: 800 }}
                          offset={10}
                          formatter={(v: number, entry: any) => {
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

              {/* 5.5 Tempo médio de descarga */}
              <ChartCard
                title="Tempo médio de descarga por mês"
                subtitle="Horas · maio em diante"
              >
                {dischargeByMonth.some((p) => p.samples > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={dischargeByMonth}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="month" {...AXIS} />
                      <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => dataMax * 1.2]} />
                       <Tooltip content={<CustomTooltip />} />
                       <Line
                        type="monotone"
                        dataKey="hours"
                        name="Tempo (h)"
                        stroke="var(--chart-1)"
                        strokeWidth={4}
                        dot={{ r: 5, fill: "var(--chart-1)", strokeWidth: 2, stroke: "var(--card)" }}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      >
                        <LabelList dataKey="hours" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 1)}h` : ""} offset={12} style={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 800 }} />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState label="Sem datas de chegada/finalização preenchidas" />
                )}
              </ChartCard>

              <ChartCard
                title="Tempo médio de descarga por ano"
                subtitle="Horas · sempre de maio em diante"
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={yearly.map((y) => ({ ...y, avgHours: y.avgHours ?? 0 }))}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="year" {...AXIS} />
                    <YAxis {...Y_AXIS_HIDDEN} />
                    <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey="avgHours" name="Tempo Médio (h)" fill="var(--chart-1)" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="avgHours" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 1)}h` : ""} style={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 800 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* 5.6 Faixas de descarga */}
              <ChartCard
                title="Distribuição do tempo de descarga"
                subtitle={`Carregamentos por faixa · ${month ? MONTH_LABELS[month - 1] + "/" : ""}${year ?? ""} · maio em diante`}
              >
                {bands.some((b) => b.loads > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={bands}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="band" {...AXIS} />
                      <YAxis {...Y_AXIS_HIDDEN} />
                       <Tooltip content={<CustomTooltip />} />
                       <Bar dataKey="loads" name="Carregamentos" fill="var(--chart-1)" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="loads" position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 800 }} />
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
                    <BarChart data={cancelsMonthly}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="month" {...AXIS} />
                      <YAxis {...Y_AXIS_HIDDEN} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        name="Cancelamentos"
                        dataKey="cancellations"
                        fill="var(--destructive)"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      >
                        <LabelList
                          dataKey="cancellations"
                          position="top"
                          fill="var(--foreground)"
                          style={{ fontSize: 13, fontWeight: 800 }}
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
  const data = [
    { name: "Aderente", value: stats.adherent, fill: "var(--chart-1)" },
    { name: "Não Aderente", value: stats.notAdherent, fill: "var(--chart-5)" },
  ].filter((slice) => slice.value > 0);
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {stats.total ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="55%" height={210}>
            <PieChart>
               <Pie 
                data={data} 
                dataKey="value" 
                innerRadius={55} 
                outerRadius={85} 
                strokeWidth={0}
                label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1">
            <p className="print-text text-4xl font-semibold text-primary">
              {formatNumber(stats.rate ?? 0, 1)}%
            </p>
            <p className="print-muted mt-1 text-xs text-muted-foreground">aderência</p>
            <ul className="print-muted mt-4 space-y-1 text-xs text-muted-foreground">
              <li>Aderente: {formatNumber(stats.adherent)}</li>
              <li>Não Aderente: {formatNumber(stats.notAdherent)}</li>
              <li>Total avaliado: {formatNumber(stats.total)}</li>
            </ul>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </ChartCard>
  );
}
