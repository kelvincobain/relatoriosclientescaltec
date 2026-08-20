import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList, Cell as RechartsCell 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  scopeRows, monthlySeries, carrierRanking, otdStats, 
  dischargeMonthly, dischargeBands, getCities, getClients, 
  getYears, totals, formatNumber, formatCarrierName, getClientInfo 
} from "@/lib/report-metrics";
import { useReportData } from "@/lib/use-report-data";

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const { data: rows } = useReportData();
  const [filters, setFilters] = useState({ city: 'BARRA BONITA', client: 'USINA ALTA MOGIANA S/A ACUCAR E ALCOOL', year: 2026, month: null });

  const filteredRows = useMemo(() => scopeRows(rows, filters.city, filters.client), [rows, filters]);
  const stats = useMemo(() => totals(filteredRows), [filteredRows]);
  const otd = useMemo(() => otdStats(filteredRows), [filteredRows]);
  const monthly = useMemo(() => monthlySeries(filteredRows, filters.year), [filteredRows, filters.year]);
  const carrierData = useMemo(() => carrierRanking(filteredRows).slice(0, 5), [filteredRows]);
  const dischargeData = useMemo(() => dischargeMonthly(filteredRows, filters.year), [filteredRows, filters.year]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-8">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Executivo</h1>
          <p className="text-slate-400 mt-1">Operações — Cal Industrial</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard title="Volume Total (t)" value={formatNumber(stats.tons)} />
        <KpiCard title="Total de Cargas" value={stats.loads.toString()} />
        <KpiCard title="OTD Geral (%)" value={otd.rate ? `${otd.rate}%` : 'N/A'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1E293B] border-slate-700">
          <CardHeader><CardTitle>Volume Mensal (t)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                <Bar dataKey="tons" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="tons" position="top" fill="#e2e8f0" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string, value: string }) {
  return (
    <Card className="bg-[#1E293B] border-slate-700">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-4xl font-bold text-white">{value}</p></CardContent>
    </Card>
  );
}
