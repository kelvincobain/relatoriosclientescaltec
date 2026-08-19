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

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };
const GRID = "var(--grid-line)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="mb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold text-foreground">
            {entry.name}: {entry.value}
            {entry.unit || ""}
          </p>
        ))}
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
  }, []);

  const rows = dataset?.rows ?? [];
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

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCountDistinctPlates((v) => !v)}
                className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Caminhões: <span className="text-primary">{truckLabel}</span>
              </button>
              <span className="text-[11px] text-muted-foreground">
                {dataset
                  ? `${dataset.isSample ? "Exemplo" : dataset.fileName} · ${formatNumber(rows.length)} linhas`
                  : "—"}
              </span>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                label="Volume no ano"
                value={formatNumber(yearTotals.tons, 1)}
                unit="t"
                hint={`${formatNumber(yearTotals.loads)} carregamentos`}
              />
              <KpiCard
                label="Caminhões"
                value={formatNumber(countDistinctPlates ? yearTotals.plates : yearTotals.loads)}
                hint={truckLabel}
              />
              <KpiCard
                label="OTD do ano"
                value={otdYear.rate === null ? "—" : `${formatNumber(otdYear.rate, 1)}%`}
                hint={`${formatNumber(otdYear.adherent)} aderentes de ${formatNumber(otdYear.total)}`}
              />
              <KpiCard
                label="Tempo médio descarga"
                value={avgDischargeYear === null ? "—" : formatNumber(avgDischargeYear, 1)}
                unit="h"
                hint="Considera maio em diante"
              />
              <KpiCard
                label="Cancelamentos reais"
                value={formatNumber(cancels.real)}
                hint={`${formatNumber(cancels.redone)} refeitos (reagendados)`}
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
                      <YAxis {...AXIS} />
                       <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)} t`} />
                      <Bar dataKey="tons" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
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
                      <YAxis {...AXIS} />
                      <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)} t`} />
                      <Bar dataKey="tons" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
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
                    <YAxis {...AXIS} allowDecimals={false} />
                     <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={truckKey} fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Caminhões por ano" subtitle={truckLabel}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={yearly}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="year" {...AXIS} />
                    <YAxis {...AXIS} allowDecimals={false} />
                     <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={truckKey} fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* 5.3 Transportadoras */}
              <ChartCard
                title="Ranking de transportadoras"
                subtitle={`Carregamentos no ano ${year ?? ""}`}
                className="lg:col-span-2"
              >
                {carriers.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(220, carriers.length * 30)}>
                    <BarChart data={carriers} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid stroke={GRID} horizontal={false} />
                      <XAxis type="number" {...AXIS} allowDecimals={false} />
                      <YAxis type="category" dataKey="carrier" width={220} {...AXIS} />
                       <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="loads" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </ChartCard>

              {/* 5.4 OTD */}
              <OtdCard
                title="OTD do período"
                subtitle={month ? `${MONTH_LABELS[month - 1]}/${year}` : `Ano completo ${year ?? ""}`}
                stats={otdPeriod}
              />
              <OtdCard
                title="OTD consolidado do ano"
                subtitle={`Ano ${year ?? ""}`}
                stats={otdYear}
              />

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
                      <YAxis {...AXIS} />
                       <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)} h`} />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--chart-1)" }}
                      />
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
                    <YAxis {...AXIS} />
                    <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${formatNumber(v, 1)} h`} />
                    <Bar dataKey="avgHours" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
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
                      <YAxis {...AXIS} allowDecimals={false} />
                       <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="loads" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState label="Sem tempos de descarga calculáveis no período" />
                )}
              </ChartCard>

              {/* 5.7 Cancelamentos */}
              <ChartCard
                title="Cancelamentos reais"
                subtitle="Cancelados sem reprogramação na mesma data prevista"
                action={
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="print-text text-2xl font-semibold text-primary">
                        {formatNumber(cancels.real)}
                      </p>
                      <p className="print-muted text-[10px] tracking-wider text-muted-foreground uppercase">
                        Reais
                      </p>
                    </div>
                    <div>
                      <p className="print-text text-2xl font-semibold text-foreground">
                        {formatNumber(cancels.redone)}
                      </p>
                      <p className="print-muted text-[10px] tracking-wider text-muted-foreground uppercase">
                        Refeitos
                      </p>
                    </div>
                  </div>
                }
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cancelsMonthly}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="month" {...AXIS} />
                    <YAxis {...AXIS} allowDecimals={false} />
                     <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cancellations" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Cancelamentos reais por ano" subtitle="Após deduplicação">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={yearly}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="year" {...AXIS} />
                    <YAxis {...AXIS} allowDecimals={false} />
                     <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cancellations" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} strokeWidth={0}>
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
