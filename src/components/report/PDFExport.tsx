import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoPrint from '@/assets/caltec-logo-print.png.asset.json';

// Componente para o PDF
export const PrintOnlyReport = React.forwardRef<HTMLDivElement, any>(({ dataset, selection, data }, ref) => {
  return (
    <div ref={ref} className="hidden print:block p-8 bg-white text-slate-900">
      {/* Cabeçalho */}
      <header className="mb-8 border-b-2 border-slate-900 pb-4 flex justify-between items-center">
        <img src={logoPrint.url} alt="Caltec" className="h-16" />
        <div className="text-right">
          <h1 className="text-2xl font-bold">Relatório Logístico</h1>
          <p className="text-sm">Cliente: {selection.client || 'Geral'}</p>
          <p className="text-sm">Data: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </header>

      {/* Conteúdo - Adicione os cards aqui em uma única coluna */}
      <div className="space-y-6">
        {data.map((card: any, idx: number) => (
          <div key={idx} className="break-inside-avoid border p-4 rounded-lg">
             <h3 className="font-bold mb-2">{card.title}</h3>
             <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-500">
                [Gráfico/Dados de {card.title}]
             </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export const PDFExportButton = ({ contentRef }: { contentRef: React.RefObject<HTMLDivElement> }) => {
  const reactToPrintFn = useReactToPrint({ contentRef });
  return (
    <Button size="sm" onClick={() => reactToPrintFn()} className="bg-blue-600 hover:bg-blue-500 text-white">
      <FileDown className="mr-2 h-4 w-4" />
      Gerar PDF
    </Button>
  );
};
