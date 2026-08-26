import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { norm, parseDate, parseCockpitDate, str, toNumber, dischargeHours, filterPeriod, scopeRows, isValidDischargeHours, type Dataset, type Row, COL, inferCockpitDateOrder } from "@/lib/report-data";
import { formatNumber, normalizeClientName } from "@/lib/report-metrics";

export const Route = createFileRoute("/tv")({ head: () => ({ title: "Painel Logístico — Caltec" }), component: TvPage });

const YEAR = new Date().getFullYear();
function round(v: number, d = 2) { return Math.round(v * 10 ** d) / 10 ** d; }

function TvPage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [now, setNow] = useState(new Date());
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % 3), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { loadDatasetFromIDB } = await import("@/lib/report-persistence");
        const { getDefaultDataset } = await import("@/lib/report-data");
        const stored = await loadDatasetFromIDB();
        setDataset(stored && stored.rows.length ? stored : await getDefaultDataset());
      } catch {
        setDataset(await import("@/lib/report-data").then(m => m.getDefaultDataset()));
      }
    })();
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const { loadDatasetFromIDB } = await import("@/lib/report-persistence");
        const fresh = await loadDatasetFromIDB();
        if (fresh) setDataset(fresh);
      } catch { /* silent */ }
    }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const rows = dataset?.rows ?? [];
  const cockpitRows = dataset?.cockpitRows ?? [];
  useMemo(() => inferCockpitDateOrder(cockpitRows), [cockpitRows]);

  const yearRows = useMemo(() => {
    const sel = { city: "", client: "", year: YEAR, month: null };
    return filterPeriod(scopeRows(rows, "", ""), sel);
  }, [rows]);

  const metrics = useMemo(() => {
    const tons = yearRows.reduce((s, r) => s + (toNumber(r[COL.weight]) ?? 0), 0);
    const active = new Set(yearRows.map(r => `${norm(normalizeClientName(str(r[COL.client])))}|${norm(str(r[COL.city]))}`)).size;
    const hrs = yearRows.map(r => dischargeHours(r)).filter(isValidDischargeHours);
    const avgH = hrs.length ? round(hrs.reduce((a, b) => a + b, 0) / hrs.length, 1) : null;
    return { tons, loads: yearRows.length, active, avgH };
  }, [yearRows]);

  const topUsinas = useMemo(() => {
    const map = new Map<string, { client: string; city: string; state: string; tons: number; loads: number; hours: number[] }>();
    for (const r of yearRows) {
      const c = normalizeClientName(str(r[COL.client]));
      const ct = str(r[COL.city]);
      const key = `${norm(c)}|${norm(ct)}`;
      const ex = map.get(key) || { client: c, city: ct, state: str(r[COL.uf]), tons: 0, loads: 0, hours: [] };
      ex.tons += toNumber(r[COL.weight]) ?? 0;
      ex.loads += 1;
      const h = dischargeHours(r);
      if (isValidDischargeHours(h)) ex.hours.push(h);
      map.set(key, ex);
    }
    return Array.from(map.values())
      .map(u => ({ ...u, avgH: u.hours.length ? round(u.hours.reduce((a, b) => a + b, 0) / u.hours.length, 1) : null }))
      .sort((a, b) => b.tons - a.tons).slice(0, 10);
  }, [yearRows]);

  const fastUsinas = useMemo(() => [...topUsinas].filter(u => u.avgH !== null).sort((a, b) => (a.avgH ?? 999) - (b.avgH ?? 999)).slice(0, 10), [topUsinas]);
  const loadsUsinas = useMemo(() => [...topUsinas].sort((a, b) => b.loads - a.loads).slice(0, 10), [topUsinas]);

  const otd = useMemo(() => {
    let adh = 0, nAdh = 0;
    for (const r of yearRows) {
      const o = norm(r[COL.otd] ?? "");
      if (o.includes("NAO") || o.includes("ATRASA")) nAdh++;
      else if (o.includes("ADERENTE")) adh++;
    }
    const tot = adh + nAdh;
    return { adh, nAdh, tot, rate: tot ? round((adh / tot) * 100, 1) : 0 };
  }, [yearRows]);

  const lastUpdate = useMemo(() => {
    const ds: Date[] = [];
    rows.forEach(r => { const d = parseDate(r[COL.arrived]) || parseDate(r[COL.finished]); if (d) ds.push(d); });
    cockpitRows.forEach(r => { const d = parseCockpitDate(r["Data Inclusão"] || r["Data Inclusao"]); if (d) ds.push(d); });
    if (!ds.length) return null;
    return new Date(Math.max(...ds.map(d => d.getTime())));
  }, [rows, cockpitRows]);

  const SLIDES = [
    { label: "Volume", data: topUsinas, key: "tons" as const, unit: "t", color: "#F59E0B" },
    { label: "Tempo de Descarga", data: fastUsinas, key: "avgH" as const, unit: "h", color: "#10B981" },
    { label: "Nº de Cargas", data: loadsUsinas, key: "loads" as const, unit: "", color: "#8B5CF6" },
  ];
  const cur = SLIDES[slide];
  const maxV = cur.data[0] ? (cur.data[0] as any)[cur.key] || 1 : 1;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden select-none font-sans">
      {/* CABEÇALHO */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-5">
          <img src="/caltec-logo-dark.png" alt="Caltec" className="h-14 w-auto" />
          <div className="h-10 w-px bg-slate-700" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Painel Logístico</p>
            <h1 className="text-xl font-black text-white uppercase">Visão Geral da Operação</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Ao vivo</span>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-white tabular-nums leading-none">
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="flex-none grid grid-cols-3 gap-4 px-8 py-5">
        <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B]/60 p-6 flex flex-col justify-between">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Volume Total</p>
          <div className="mt-2">
            <p className="text-6xl font-black text-white leading-none">{formatNumber(metrics.tons, 0)}<span className="text-2xl text-slate-400 ml-2">t</span></p>
            <p className="text-sm text-slate-400 mt-2">{formatNumber(metrics.loads)} carregamentos</p>
          </div>
          <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: "100%" }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B]/60 p-6 flex flex-col justify-between">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Usinas Ativas</p>
          <div className="mt-2">
            <p className="text-6xl font-black text-white leading-none">{metrics.active}</p>
            <p className="text-sm text-slate-400 mt-2">com movimentação em {YEAR}</p>
          </div>
          <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: "100%" }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B]/60 p-6 flex flex-col justify-between">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Tempo Médio de Descarga</p>
          <div className="mt-2">
            <p className="text-6xl font-black text-amber-400 leading-none">
              {metrics.avgH !== null ? formatNumber(metrics.avgH, 1) : "—"}{metrics.avgH !== null && <span className="text-2xl text-amber-600 ml-1">h</span>}
            </p>
            <p className="text-sm text-slate-400 mt-2">média geral em {YEAR}</p>
          </div>
          <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-amber-500" style={{ width: metrics.avgH ? `${Math.max(5, 100 - (metrics.avgH - 1) * 8)}%` : "0%" }} />
          </div>
        </div>
      </div>

      {/* CORPO */}
      <div className="flex-1 grid grid-cols-5 gap-4 px-8 pb-5 min-h-0">
        {/* Maior Volume */}
        {topUsinas[0] && (
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏆</span>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Maior Volume</p>
            </div>
            <div>
              <p className="text-lg font-black text-white leading-tight">{topUsinas[0].client}</p>
              <p className="text-xs text-slate-400 mt-1">{topUsinas[0].city} — {topUsinas[0].state}</p>
              <p className="text-4xl font-black text-amber-400 mt-3 leading-none">{formatNumber(topUsinas[0].tons, 0)}<span className="text-lg text-slate-400 ml-1">t</span></p>
              <p className="text-xs text-slate-500 mt-1">{topUsinas[0].loads} cargas</p>
            </div>
          </div>
        )}

        {/* Descarga Mais Rápida */}
        {fastUsinas[0] && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚡</span>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Descarga Mais Rápida</p>
            </div>
            <div>
              <p className="text-lg font-black text-white leading-tight">{fastUsinas[0].client}</p>
              <p className="text-xs text-slate-400 mt-1">{fastUsinas[0].city} — {fastUsinas[0].state}</p>
              <p className="text-4xl font-black text-emerald-400 mt-3 leading-none">{formatNumber(fastUsinas[0].avgH ?? 0, 1)}<span className="text-lg text-emerald-600 ml-1">h</span></p>
              <p className="text-xs text-slate-500 mt-1">tempo médio de descarga</p>
            </div>
          </div>
        )}

        {/* OTD */}
        <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B]/60 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">OTD Geral</p>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Base Ojo</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className={`text-5xl font-black leading-none ${otd.rate >= 98 ? "text-emerald-400" : "text-red-400"}`}>{formatNumber(otd.rate, 1)}%</p>
            <p className="text-xs text-slate-400 mt-2">
              <span className="text-emerald-400 font-bold">{formatNumber(otd.adh)}</span> aderente{otd.nAdh > 0 && <span> · <span className="text-red-400 font-bold">{formatNumber(otd.nAdh)}</span> não aderente</span>}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{formatNumber(otd.tot)} cargas totais</p>
          </div>
          <div className="mt-3 flex gap-1.5 h-3 rounded-full overflow-hidden bg-slate-800">
            {otd.tot > 0 && <>
              <div className="bg-emerald-500" style={{ width: `${(otd.adh / otd.tot) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(otd.nAdh / otd.tot) * 100}%` }} />
            </>}
          </div>
        </div>

        {/* Ranking Rotativo */}
        <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B]/60 p-6 flex flex-col col-span-2">
          <div className="flex items-center gap-3 mb-4">
            {SLIDES.map((tab, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${slide === i ? "w-6 bg-slate-300" : "w-2 bg-slate-700"}`} />
                {slide === i && <p className="text-xs font-bold text-white uppercase tracking-wider" style={{ color: tab.color }}>{tab.label}</p>}
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-3 min-h-0">
            {cur.data.map((u: any, idx: number) => {
              const val = u[cur.key] || 0;
              const pct = maxV ? Math.max(4, (val / maxV) * 100) : 4;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-500 w-4 text-right flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-slate-200 truncate">{u.client}</span>
                      <span className="text-sm font-bold text-white ml-2 flex-shrink-0">{formatNumber(val, cur.key === "avgH" ? 1 : 0)}{cur.unit}</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cur.color }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{u.city}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <footer className="flex-none flex items-center justify-between px-8 py-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-500">Caltec 80 anos · Painel Logístico</p>
        {lastUpdate && (
          <p className="text-[10px] text-slate-400">{metrics.active} usina(s) · atualizado às {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
        )}
        <p className="text-[10px] text-slate-500">{YEAR} · Ano completo</p>
      </footer>
    </div>
  );
}
