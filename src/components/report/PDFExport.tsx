import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoPrint from '@/assets/caltec-logo-print.png.asset.json';
import { ChartCard } from './ChartCard';
import { KpiCard } from './KpiCard';
import { ClientLogo } from '../ClientLogo';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine, LabelList, Cell
} from 'recharts';
import { formatNumber } from '@/lib/report-metrics';

const PDFChartContainer = ({ children, height = 280 }: { children: React.ReactNode, height?: number }) => (
  <div style={{ height, width: '100%', position: 'relative' }}>
    <ResponsiveContainer width="100%" height={height}>
      {React.isValidElement(children) 
        ? React.cloneElement(children as React.ReactElement<any>, { isAnimationActive: false }) 
        : children as any
      }
    </ResponsiveContainer>
  </div>
);

export const PrintOnlyReport = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  const { 
    client, city, state, year, lastUpdateDate,
    monthly, yearTotals, truckLabel, truckKey,
    otdByMonth, otdYear, serviceStats,
    dischargeByMonth, avgDischargeYear,
    cancelsMonthly, GRID, GRID_DASH, X_AXIS_PROPS, Y_AXIS_HIDDEN
  } = props;

  if (!client) return null;

  return (
    <div 
      ref={ref} 
      className="bg-[#0B0F19] text-white p-[15mm] w-[210mm]"
      style={{ 
        position: 'absolute',
        left: '-9999px',
        top: 0,
        zIndex: -1
      }}
    >
      <header className="flex justify-between items-start border-b border-slate-700 pb-6 mb-8">
        <div className="flex items-center gap-6">
          <img src={logoPrint.url} alt="Caltec" className="h-16 w-auto" />
          <div className="border-l border-slate-700 pl-6">
            <p className="text-[10px] tracking-[0.2em] text-slate-400 uppercase">Relatório do cliente — Cal industrial</p>
            <h1 className="text-xl font-bold text-white">Relatório Logístico</h1>
            {lastUpdateDate && (
              <p className="text-[10px] font-medium text-blue-400 mt-0.5">
                Atualizado até: {lastUpdateDate.toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento Oficial</p>
          <p className="text-sm font-bold text-white mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </header>

      <section className="bg-[#131C2E] border border-slate-700 rounded-2xl p-6 mb-8 flex items-center gap-6">
        <div className="bg-white p-2 rounded-xl border border-white/10 w-24 h-24 flex items-center justify-center shrink-0">
          <ClientLogo clientName={client} className="w-full h-full" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">{client}</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{city} — {state}</p>
        </div>
      </section>

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500">Fluxo de Volume</h3>
          <div className="grid grid-cols-1 gap-4">
             <ChartCard title="Volume por mês" subtitle={`Toneladas · ${year}`} className="min-h-0 h-auto py-6">
                <PDFChartContainer>
                  <BarChart data={monthly} margin={{ top: 35, right: 25, left: 25, bottom: 10 }}>
                    <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                    <XAxis dataKey="month" {...X_AXIS_PROPS} />
                    <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />
                    <Bar dataKey="tons" fill="#38BDF8" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="tons" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 2)}t` : ""} style={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} dy={-8} />
                    </Bar>
                  </BarChart>
                </PDFChartContainer>
             </ChartCard>
             <KpiCard label="Volume no ano" value={formatNumber(yearTotals.tons, 2)} unit="Toneladas" variant="large" className="min-h-0 h-auto py-6" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500">Fluxo de Carregamentos</h3>
          <div className="grid grid-cols-1 gap-4">
            <ChartCard title="Caminhões por mês" subtitle={`${truckLabel} · ${year}`} className="min-h-0 h-auto py-6">
              <PDFChartContainer>
                <BarChart data={monthly} margin={{ top: 35, right: 25, left: 25, bottom: 10 }}>
                  <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                  <XAxis dataKey="month" {...X_AXIS_PROPS} />
                  <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />
                  <Bar dataKey={truckKey} fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey={truckKey} position="top" formatter={(v: number) => v > 0 ? v : ""} style={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} dy={-8} />
                  </Bar>
                </BarChart>
              </PDFChartContainer>
            </ChartCard>
            <KpiCard label="Caminhões no ano" value={formatNumber(yearTotals.loads)} unit="Viagens" variant="large" className="min-h-0 h-auto py-6" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500">Nível de Serviço (OTD)</h3>
          <div className="grid grid-cols-1 gap-4">
            <ChartCard title="OTD do Período" subtitle={`Aderência por mês · ${year}`} className="min-h-0 h-auto py-6">
              <PDFChartContainer>
                <BarChart data={otdByMonth} margin={{ top: 35, right: 25, left: 25, bottom: 10 }}>
                  <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                  <XAxis dataKey="month" {...X_AXIS_PROPS} />
                  <YAxis {...Y_AXIS_HIDDEN} domain={[0, 115]} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {otdByMonth.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.rate >= 98 ? "#10b981" : "#ef4444"} />
                    ))}
                    <LabelList dataKey="rate" position="top" formatter={(v: number) => (v > 0 ? `${formatNumber(v, 1)}%` : "")} fill="#FFFFFF" style={{ fontSize: 10, fontWeight: 700 }} dy={-8} />
                  </Bar>
                </BarChart>
              </PDFChartContainer>
            </ChartCard>
            <div className="bg-[#131C2E] border border-slate-700 rounded-2xl p-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OTD Acumulado</p>
                <p className={`text-4xl font-black ${otdYear.rate >= 98 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatNumber(otdYear.rate ?? 0, 1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500">Tempo de Atendimento</h3>
          <div className="grid grid-cols-2 gap-4">
             <KpiCard label="No Prazo" value={String(serviceStats.onTime)} unit="Cargas" className="min-h-0 h-auto py-6" badge={{text:"On Time", variant:"success"}} />
             <KpiCard label="Antecipado/Urgente" value={String(serviceStats.urgent)} unit="Cargas" className="min-h-0 h-auto py-6" badge={{text:"Urgente", variant:"warning"}} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500">Performance de Descarga</h3>
          <div className="grid grid-cols-1 gap-4">
            <ChartCard title="Tempo médio de descarga" subtitle="Horas por mês" className="min-h-0 h-auto py-6">
              <PDFChartContainer>
                <AreaChart data={dischargeByMonth} margin={{ top: 35, right: 25, left: 25, bottom: 10 }}>
                  <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                  <XAxis dataKey="month" {...X_AXIS_PROPS} />
                  <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.max(35, Math.ceil(dataMax * 1.5))]} />
                  <ReferenceLine y={5} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: "SLA: 5h", fill: '#F59E0B', fontSize: 10, fontWeight: 700 }} />
                  <Area type="monotone" dataKey="hours" stroke="#F59E0B" strokeWidth={3} fill="#F59E0B" fillOpacity={0.1}>
                    <LabelList dataKey="hours" position="top" formatter={(v: number) => v > 0 ? `${formatNumber(v, 1)}h` : ""} style={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} dy={-10} />
                  </Area>
                </AreaChart>
              </PDFChartContainer>
            </ChartCard>
            <KpiCard label="Tempo Médio Ano" value={formatNumber(avgDischargeYear, 1)} unit="Horas" variant="large" className="min-h-0 h-auto py-6" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] px-2 border-l-2 border-amber-500">Cancelamentos</h3>
          <ChartCard title="Cancelamentos Mensais" subtitle="Ocorrências" className="min-h-0 h-auto py-6">
            <PDFChartContainer>
              <BarChart data={cancelsMonthly} margin={{ top: 35, right: 25, left: 25, bottom: 10 }}>
                <CartesianGrid stroke={GRID} vertical={false} strokeDasharray={GRID_DASH} />
                <XAxis dataKey="month" {...X_AXIS_PROPS} />
                <YAxis {...Y_AXIS_HIDDEN} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.5)]} />
                <Bar dataKey="cancellations" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="cancellations" position="top" style={{ fontSize: 12, fill: "#FFFFFF", fontWeight: 700 }} dy={-8} />
                </Bar>
              </BarChart>
            </PDFChartContainer>
          </ChartCard>
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t border-slate-700 flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest">
        <span>caltec.com.br · Documento Gerado Automaticamente</span>
        <span>© 2026 Caltec Logística</span>
      </footer>
    </div>
  );
});

export const PDFExportButton = ({ contentRef }: { contentRef: React.RefObject<HTMLDivElement | null> }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current) return;
    setLoading(true);
    
    // Pequeno delay para garantir que os gráficos estão renderizados no DOM absoluto
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#0B0F19',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidthMM = 210;
      const imgHeightMM = (canvas.height * 210) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidthMM, imgHeightMM]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMM, imgHeightMM);
      pdf.save(`relatorio-caltec-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={handleExport}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
    >
      <FileDown className="mr-2 h-4 w-4" />
      {loading ? 'Gerando...' : 'Gerar PDF'}
    </Button>
  );
};