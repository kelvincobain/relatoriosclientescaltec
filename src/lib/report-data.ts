/**
 * Generic data layer for the Caltec one-page report.
 * No hardcoded cities, clients, dates or quantities: everything is derived
 * from the uploaded spreadsheet, so swapping the sample base for the real
 * (much larger) base requires no code change.
 */

export const COL = {
  city: "Destino Município",
  client: "Nome Entrega (cliente)",
  product: "Produto",
  weight: "Peso (kg)",
  plate: "Placa",
  carrier: "Transportadora",
  otd: "OTD",
  arrived: "Quando chegou no cliente",
  finished: "Quando finalizou",
  pickup: "Data de coleta",
  status: "Status",
  plannedDelivery: "Data prevista entrega",
  uf: "Destino UF",
  invoice: "NF",
  reference: "Cod Referencia",
} as const;

export type Row = Record<string, unknown>;

export const PRODUCT_TARGET = "cal industrial";
export const CANCELLED_STATUS = "frete cancelado";
export const DISCHARGE_START_MONTH = 5; // Maio (restrição solicitada para descarga)

export const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const str = (v: unknown): string => (v == null ? "" : String(v).trim());

export const normalize = (s: string) =>
  s
    ? s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
    : "";

export const norm = (v: unknown): string => normalize(str(v));

/** Parses "DD/MM/AAAA HH:MM" (hour optional). Returns null when unusable. */
export function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = str(value);
  if (!raw) return null;

  // Try Brazilian format: DD/MM/YYYY [HH:mm[:ss]]
  const brMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (brMatch) {
    const d = new Date(
      Number(brMatch[3]),
      Number(brMatch[2]) - 1,
      Number(brMatch[1]),
      Number(brMatch[4] ?? 0),
      Number(brMatch[5] ?? 0),
      Number(brMatch[6] ?? 0),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Fallback to native constructor (ISO or other formats)
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = str(value);
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s|kg/gi, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export const rowMonth = (r: Row) => parseDate(r[COL.pickup]) || parseDate(r[COL.arrived]) || parseDate(r[COL.finished]);

export const isCalIndustrial = (row: Row) => {
  if (!row) return false;
  const p = str(row[COL.product]).toUpperCase();
  // Apenas registros explicitamente marcados como CAL INDUSTRIAL devem aparecer.
  if (!p) return false;
  return p.includes("CAL INDUSTRIAL");
};
export const isCancelled = (row: Row) => {
  const status = norm(row[COL.status]);
  return status === CANCELLED_STATUS || status.includes("FRETECANCELADO");
};
export const isFinished = (row: Row) => !!str(row[COL.finished]);

/** Hours between arrival and completion; null when either date is missing. */
export function dischargeHours(row: Row): number | null {
  const a = parseDate(row[COL.arrived]);
  const b = parseDate(row[COL.finished]);
  if (!a || !b) return null;
  const diffMs = b.getTime() - a.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return hours >= 0 && Number.isFinite(hours) ? hours : null;
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "caltec-report-dataset-v1";

export type Dataset = {
  rows: Row[];
  fileName: string;
  updatedAt: string;
  isSample: boolean;
};

export function loadDataset(): Dataset | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Dataset;
    return Array.isArray(parsed?.rows) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDataset(dataset: Dataset) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  } catch {
    /* quota exceeded — dataset stays in memory for this session */
  }
}

export function clearDataset() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Parses an Excel/CSV file into raw rows using the first sheet named like "Operacoes" when present. */
export async function parseWorkbook(file: File): Promise<Row[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false, raw: false });
  const preferred =
    wb.SheetNames.find((n) => norm(n).startsWith("opera")) ?? wb.SheetNames[0];
  const sheet = preferred ? wb.Sheets[preferred] : undefined;
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "", raw: false });
  return rows.map((row) => {
    const clean: Row = {};
    for (const [key, value] of Object.entries(row)) clean[str(key)] = value;
    return clean;
  });
}
