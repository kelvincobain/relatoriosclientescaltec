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

export const SLA_RULES = {
  SP: 4,
  MS: 4,
  PR: 3,
  SC: 4,
  RS: 4,
  RJ: 7,
  ES: 8,
  DF: 5,
  GO: {
    reference: "GOIÂNIA",
    standard: 5,
    specific: {
      cities: ["ITAPACI", "GOIANESIA", "CARMO DO RIO VERDE", "RUBIATABA"],
      total: 6
    }
  },
  MG: {
    reference: "MONTES CLAROS",
    standard: 4,
    specific: {
      cities: ["JAIBA", "TEOFILO OTONI", "COROACI", "JANUARIA", "JANAUBA", "SALINAS"],
      total: 5
    }
  },
  MT: {
    reference: "NOVA MUTUM",
    standard: 6,
    specific: {
      cities: ["CARLINDA", "ALTA FLORESTA", "SINOP", "SORRISO", "LUCAS DO RIO VERDE"],
      total: 7
    }
  },
  BA: 8,
  AL: 10,
  PE: 11,
  CE: 11,
  MA: 11,
  PB: 12,
  RN: 12,
  SE: 10,
  PI: 11,
  PA: 12,
  AM: 20,
  AP: 20,
  AC: 12,
  RO: 10,
  RR: 21,
  TO: 9,
  OTHERS: 5
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

export type DateOrder = "DMY" | "MDY";

/** Extrai as 3 partes numéricas (+ hora) de uma string de data. */
function splitDateParts(raw: string): number[] | null {
  const parts = raw.split(/[\/\s:]/).filter((p) => p !== "");
  if (parts.length < 3) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  return nums;
}

/**
 * Detecta se um conjunto de datas está em DD/MM/AAAA (BR) ou MM/DD/AAAA (US),
 * analisando o conjunto TODO (uma única decisão para toda a base).
 */
export function detectDateOrder(values: unknown[]): DateOrder {
  let firstGt12 = 0;
  let secondGt12 = 0;
  for (const v of values) {
    if (typeof v !== "string") continue;
    const nums = splitDateParts(v.trim().replace(/-/g, "/"));
    if (!nums) continue;
    if (nums[0] > 12) firstGt12 += 1;
    if (nums[1] > 12) secondGt12 += 1;
  }
  if (secondGt12 > firstGt12) return "MDY";
  return "DMY"; // padrão brasileiro (também usado em caso ambíguo)
}

/**
 * Conversão de datas: Seriais Excel, objetos Date e strings.
 * `order` define explicitamente a ordem dia/mês da string — sem "adivinhação"
 * por linha, garantindo uma única lógica de data por base.
 */
export function parseDate(dateValue: any, order: DateOrder = "DMY"): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }

  // Se for número (Serial Excel)
  if (typeof dateValue === "number") {
    const ms = Math.round((dateValue - 25569) * 86400 * 1000) + (new Date().getTimezoneOffset() * 60000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateValue === "string") {
    const raw = dateValue.trim().replace(/-/g, "/");
    if (!raw) return null;

    if (raw.includes("/")) {
      const nums = splitDateParts(raw);
      if (nums) {
        let day = order === "MDY" ? nums[1] : nums[0];
        let month = (order === "MDY" ? nums[0] : nums[1]) - 1;
        let year = nums[2];

        // Salvaguarda: se a ordem escolhida gerar mês inválido, inverte.
        if (month > 11 || month < 0) {
          const d2 = day;
          day = month + 1;
          month = d2 - 1;
        }

        if (String(nums[2]).length <= 2 && year < 100) year += 2000;

        const hour = nums[3] ?? 0;
        const min = nums[4] ?? 0;
        const sec = nums[5] ?? 0;

        const d = new Date(year, month, day, hour, min, sec);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }

    // ISO (YYYY-MM-DD)
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) return new Date(parsed);
  }

  return null;
}


export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    // We expect Toneladas. If value > 10000, it's likely KG.
    return value > 10000 ? value / 1000 : value;
  }
  
  const raw = str(value);
  if (!raw) return null;
  
  // Clean characters: keep digits, comma, dot and minus.
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  
  let n: number;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // 1.234,56 -> 1234.56
    n = Number(cleaned.replace(/\./g, "").replace(",", "."));
  } else if (cleaned.includes(",")) {
    // 1234,56 -> 1234.56
    n = Number(cleaned.replace(",", "."));
  } else {
    n = Number(cleaned);
  }

  if (!Number.isFinite(n)) return null;
  return n > 10000 ? n / 1000 : n;
}

/**
 * Calculates Lead Time in Calendar Days (Corridos).
 * Includes weekends (Saturdays and Sundays).
 */
export function calculateCalendarDays(start: Date, end: Date): number {
  if (!start || !end) return 0;
  
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffMs = endDay.getTime() - startDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
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

// Dynamic imports for large JSON files to speed up initial load
const getOjoRaw = () => import("@/data/baseOjoDefault.json").then(m => m.default);
const getCockpitRaw = () => import("@/data/baseCockpitDefault.json").then(m => m.default);

const STORAGE_KEY = "caltec-report-dataset-v1";

export type Dataset = {
  rows: Row[];
  cockpitRows: Row[];
  fileName: string;
  updatedAt: string;
  isSample: boolean;
};

export async function getDefaultDataset(): Promise<Dataset> {
  const ojoRaw = await getOjoRaw();
  const cockpitRaw = await getCockpitRaw();
  return {
    rows: ojoRaw as Row[],
    cockpitRows: cockpitRaw as Row[],
    fileName: "Base Padrão Nativa",
    updatedAt: new Date().toISOString(),
    isSample: false,
  };
}

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
    const serialized = JSON.stringify(dataset);
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.warn("[Persistence] LocalStorage quota exceeded. Using IndexedDB via component logic.");
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
