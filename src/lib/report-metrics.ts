import {
  COL,
  DISCHARGE_START_MONTH,
  MONTH_LABELS,
  type Row,
  dischargeHours,
  isCalIndustrial,
  isCancelled,
  isFinished,
  norm,
  parseDate,
  str,
  toNumber,
} from "./report-data";

import usinasData from "@/data/usinas.json";

export type Selection = {
  city: string;
  client: string;
  year: number | null;
  month: number | null; // null = ano completo
};

export const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

export const getStates = (rows: Row[]) =>
  uniqueSorted(rows.filter(isCalIndustrial).map((r) => str(r[COL.uf])));

export const getCities = (rows: Row[], state?: string) =>
  uniqueSorted(
    rows
      .filter(isCalIndustrial)
      .filter((r) => !state || norm(r[COL.uf]) === norm(state))
      .map((r) => str(r[COL.city])),
  );

/** 
 * Normalizes client names to unswervingly group variations (e.g. Alta Mogiana).
 */
export function normalizeClientName(name: string): string {
  const n = str(name).toUpperCase();
  if (n.includes("ALTA MOGIANA") || n.includes("ALTA HOMOGENEA")) {
    return "USINA ALTA MOGIANA S/A ACUCAR E ALCOOL";
  }
  return str(name);
}

export const getClients = (rows: Row[], city: string) =>
  uniqueSorted(
    rows
      .filter(isCalIndustrial)
      .filter((r) => !city || norm(r[COL.city]) === norm(city))
      .map((r) => normalizeClientName(str(r[COL.client]))),
  );

export const getYears = (rows: Row[], city: string, client: string) => {
  const years = new Set<number>();
  for (const row of scopeRows(rows, city, client)) {
    const d = parseDate(row[COL.pickup]);
    if (d) years.add(d.getFullYear());
  }
  return Array.from(years).sort((a, b) => a - b);
};

/** 
 * Cal industrial rows for the selected city + client. Filtered by finished trips. 
 * Validation ensures rows match BOTH city and client to avoid overlaps with clients of the same name in different cities.
 */
export function scopeRows(rows: Row[], city: string, client: string): Row[] {
  if (!city || !client) return [];
  const nCity = norm(city);
  const nClient = norm(normalizeClientName(client));
  
  return rows.filter(
    (r) =>
      isCalIndustrial(r) &&
      isFinished(r) &&
      norm(r[COL.city]) === nCity &&
      norm(normalizeClientName(str(r[COL.client]))) === nClient,
  );
}

/** All rows (any product) for the selected city + client — used for cancel dedup. */
export function scopeRowsAllProducts(rows: Row[], city: string, client: string): Row[] {
  if (!city || !client) return [];
  const nCity = norm(city);
  const nClient = norm(normalizeClientName(client));

  return rows.filter(
    (r) => 
      norm(r[COL.city]) === nCity && 
      norm(normalizeClientName(str(r[COL.client]))) === nClient,
  );
}

const getRowDate = (row: Row) => parseDate(row[COL.pickup]) || parseDate(row[COL.arrived]) || parseDate(row[COL.finished]);
const rowMonth = (row: Row) => getRowDate(row);

export const byYear = (rows: Row[], year: number | null) =>
  year === null ? rows : rows.filter((r) => getRowDate(r)?.getFullYear() === year);

export const byMonth = (rows: Row[], month: number | null) =>
  month === null
    ? rows
    : rows.filter((r) => (getRowDate(r)?.getMonth() ?? -1) + 1 === month);

export type MonthlyPoint = {
  month: string;
  monthIndex: number;
  tons: number;
  loads: number;
  plates: number;
};

export function monthlySeries(rows: Row[], year: number | null): MonthlyPoint[] {
  const scoped = byYear(rows, year);
  return MONTH_LABELS.map((label, index) => {
    const monthRows = scoped.filter((r) => getRowDate(r)?.getMonth() === index);
    const plates = new Set(monthRows.map((r) => str(r[COL.plate])).filter(Boolean));
    return {
      month: label,
      monthIndex: index + 1,
      tons: round(monthRows.reduce((sum, r) => sum + (toNumber(r[COL.weight]) ?? 0), 0)),
      loads: monthRows.length,
      plates: plates.size,
    };
  });
}

export type YearlyPoint = {
  year: string;
  tons: number;
  loads: number;
  plates: number;
  avgHours: number | null;
  cancellations: number;
};

export function yearlySeries(rows: Row[], allRows: Row[], selection: Selection): YearlyPoint[] {
  const years = uniqueYears(rows);
  return years.map((year) => {
    const yearRows = byYear(rows, year);
    const plates = new Set(yearRows.map((r) => str(r[COL.plate])).filter(Boolean));
    return {
      year: String(year),
      tons: round(yearRows.reduce((s, r) => s + (toNumber(r[COL.weight]) ?? 0), 0)),
      loads: yearRows.length,
      plates: plates.size,
      avgHours: averageDischarge(yearRows),
      cancellations: cancellationStats(rows, allRows, { ...selection, year, month: null }).real,
    };
  });
}

function uniqueYears(rows: Row[]) {
  const years = new Set<number>();
  for (const row of rows) {
    const d = getRowDate(row);
    if (d) years.add(d.getFullYear());
  }
  return Array.from(years).sort((a, b) => a - b);
}

export function totals(rows: Row[]) {
  const plates = new Set(rows.map((r) => str(r[COL.plate])).filter(Boolean));
  return {
    tons: round(rows.reduce((s, r) => s + (toNumber(r[COL.weight]) ?? 0), 0)),
    loads: rows.length,
    plates: plates.size,
  };
}

/* ------------------------- Transportadoras ------------------------- */

export function carrierRanking(rows: Row[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    let carrier = str(row[COL.carrier]);
    
    // Unir vazios ou nulos como "CALTEC"
    if (!carrier || carrier.trim() === "") {
      carrier = "CALTEC";
    }

    // Normalizar nomes para unir variações (ex: "Caltec Transports" e "Caltec")
    const formatted = formatCarrierName(carrier);
    map.set(formatted, (map.get(formatted) ?? 0) + 1);
  }
  return Array.from(map, ([carrier, loads]) => ({ carrier, loads })).sort(
    (a, b) => b.loads - a.loads,
  );
}

/* ------------------------------- OTD ------------------------------- */

export function otdStats(rows: Row[]) {
  let adherent = 0;
  let notAdherent = 0;
  for (const row of rows) {
    const value = norm(row[COL.otd]);
    if (!value) continue;
    if (value.startsWith("não") || value.startsWith("nao")) notAdherent += 1;
    else if (value.startsWith("aderente")) adherent += 1;
  }
  const total = adherent + notAdherent;
  return {
    adherent,
    notAdherent,
    total,
    rate: total ? round((adherent / total) * 100, 1) : null,
  };
}

/* -------------------------- Descarga (h) --------------------------- */

const dischargeDate = (row: Row) => parseDate(row[COL.finished]) || parseDate(row[COL.arrived]);

const fromStart = (rows: Row[]) =>
  rows.filter((r) => {
    if (isCancelled(r)) return false; // Exclude cancelled shipments from discharge metrics
    const d = dischargeDate(r);
    return d && (d.getMonth() + 1) >= DISCHARGE_START_MONTH;
  });

export function dischargeValues(rows: Row[]): number[] {
  return fromStart(rows)
    .map(dischargeHours)
    .filter((h): h is number => h !== null && h > 0);
}

export function averageDischarge(rows: Row[]): number | null {
  const values = dischargeValues(rows);
  if (!values.length) return null;
  return round(values.reduce((a, b) => a + b, 0) / values.length, 1);
}

export function dischargeMonthly(rows: Row[], year: number | null) {
  const scoped = byYear(rows, year);
  const data = MONTH_LABELS.map((label, index) => {
    const monthNum = index + 1;
    
    // O gráfico deve exibir apenas os meses que possuem dados válidos reais (> 0)
    const monthRows = scoped.filter((r) => {
      if (isCancelled(r)) return false;
      const d = dischargeDate(r);
      return d && d.getMonth() === index;
    });
    
    const values = monthRows.map(dischargeHours).filter((h): h is number => h !== null && h > 0);
    
    if (monthNum < DISCHARGE_START_MONTH) return null;
    if (values.length === 0) return { month: label, hours: 0, samples: 0, hidden: true }; 

    return {
      month: label,
      hours: round(values.reduce((a, b) => a + b, 0) / values.length, 1),
      samples: values.length,
      hidden: false,
    };
  }).filter((p): p is { month: string; hours: number; samples: number; hidden: boolean } => p !== null);

  return data;
}

export const DISCHARGE_BANDS = [
  { label: "Até 5h", test: (h: number) => h <= 5 },
  { label: "5h a 12h", test: (h: number) => h > 5 && h <= 12 },
  { label: "12h a 24h", test: (h: number) => h > 12 && h <= 24 },
  { label: "Acima de 24h", test: (h: number) => h > 24 },
];

export function dischargeBands(rows: Row[]) {
  const values = dischargeValues(rows);
  return DISCHARGE_BANDS.map(({ label, test }) => ({
    band: label,
    loads: values.filter(test).length,
  }));
}

/* ------------------------- Cancelamentos --------------------------- */

export type CancellationStats = {
  real: number;
  redone: number;
};

/**
 * A "Frete cancelado" only counts as a real cancellation when no other
 * shipment (any status, any product) for the same client + city shares the
 * same "Data prevista entrega" — otherwise the load was redone.
 */
export function cancellationStats(
  calRows: Row[],
  allRows: Row[],
  selection: Selection,
): CancellationStats {
  const scoped = filterPeriod(calRows, selection);
  let real = 0;
  
  const groups: Record<string, Row[]> = {};
  for (const row of scoped) {
    const planned = str(row[COL.plannedDelivery as keyof Row] ?? '').split(' ')[0].trim();
    const client = str(row[COL.client as keyof Row] ?? '').trim();
    const city = str(row[COL.city as keyof Row] ?? '').trim();
    const key = `${client} | ${city} | ${planned}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  for (const key in groups) {
    const group = groups[key];
    if (!group) continue;
    const hasNonCancelled = group.some(r => !isCancelled(r));
    if (!hasNonCancelled) {
      real += 1;
    }
  }

  return { real, redone: 0 };
}

export function cancellationsMonthly(
  calRows: Row[],
  allRows: Row[],
  selection: Selection,
) {
  return MONTH_LABELS.map((label, index) => {
    // When calculating monthly cancellations, we need to pass allRows for the sibling check
    const stats = cancellationStats(calRows, allRows, {
      ...selection,
      month: index + 1,
    });
    return {
      month: label,
      cancellations: stats.real,
    };
  }).filter(m => m.cancellations > 0); // Hide months with 0 cancellations to avoid squeezing
}

export function filterPeriod(rows: Row[], selection: Selection) {
  return byMonth(byYear(rows, selection.year), selection.month);
}

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/**
 * Simplifies and formats carrier names for cleaner display in charts.
 * Removes common suffixes and keeps the first 2 words in Title Case.
 */
export function formatCarrierName(name: string): string {
  if (!name || name === "Não informada") return name;

  // 1. Common suffixes and noise to remove
  const suffixes = [
    "LTDA", "LTD", "SA", "S/A", "ME", "EPP", "EIRELI",
    "RODOVIARIO", "RODOVIARIOS", "E LOGISTICA", "LOGISTICA",
    "TRANSPORTES", "TRANSPORTE", "TRANSPORTADORA", "TRANSP"
  ];

  let cleaned = name.toUpperCase().trim();
  
  // Se for qualquer variação de Caltec, normaliza para "Caltec"
  if (cleaned.includes("CALTEC")) return "Caltec";

  // Remove suffixes (with word boundaries)
  suffixes.forEach(s => {
    const regex = new RegExp(`\\b${s}\\b`, 'g');
    cleaned = cleaned.replace(regex, '');
  });

  // 2. Clean up extra spaces and take first 2 words
  const words = cleaned.trim().split(/\s+/).filter(Boolean);
  const shortened = words.slice(0, 2).join(" ");

  // 3. Title Case conversion
  return shortened
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Returns group info and logo for a client from the local dictionary.
 */
export function getClientInfo(clientName: string) {
  const name = (clientName || "").toUpperCase();
  const dict = usinasData as Record<string, { grupo: string; logo: string }>;
  
  if (dict[name]) {
    return dict[name];
  }

  // Fallback for partial matches
  const keys = Object.keys(dict);
  const foundKey = keys.find(k => name.includes(k) || k.includes(name));
  
  if (foundKey) {
    return dict[foundKey];
  }

  return {
    grupo: clientName.split(' ')[0],
    logo: "https://img.icons8.com/color/96/factory.png"
  };
}
