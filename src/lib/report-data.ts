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

export const COCKPIT_COL = {
  reference: "Pré!Embarque",
  inclusion: "Data!Inclusão",
  loading: "Data!Carregamento",
  uf: "UF",
} as const;

export const SLA_BY_UF: Record<string, number> = {
  MS: 2, MG: 2, PR: 2, RS: 2, SC: 2, SP: 2,
  DF: 3, GO: 3, MT: 3,
  AC: 5, AL: 5, AP: 5, AM: 5, BA: 5, CE: 5, ES: 5, MA: 5, PA: 5, PB: 5, PE: 5, PI: 5, RJ: 5, RN: 5, RO: 5, RR: 5, SE: 5, TO: 5
};

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
  // Serial numérico do Excel (dias desde 30/12/1899)
  if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 80000) {
    const d = new Date(Math.round((value - 25569) * 86400000));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const raw = str(value).replace(/-/g, "/");
  if (!raw) return null;

  if (/^\d{5}(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    const d = new Date(Math.round((serial - 25569) * 86400000));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Formato brasileiro com ano de 2 dígitos: DD/MM/YY
  const br2 = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})(?!\d)/);
  if (br2) {
    const d = new Date(2000 + Number(br2[3]), Number(br2[2]) - 1, Number(br2[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }


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
  cockpitRows: Row[];
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
    return (Array.isArray(parsed?.rows) || Array.isArray(parsed?.cockpitRows)) ? parsed : null;
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
