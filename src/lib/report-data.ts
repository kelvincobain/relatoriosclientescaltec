/**
 * Generic data layer for the Caltec one-page report.
 * No hardcoded cities, clients, dates or quantities: everything is derived
 * from the uploaded spreadsheet, so swapping the sample base for the real
 * (much larger) base requires no code change.
 */

export const COL = {
  city: "Cidade",
  client: "Nome Entrega (cliente)",
  product: "Produto",
  weight: "Peso (kg)",
  plate: "Placa",
  carrier: "Transportadora",
  otd: "OTD",
  arrived: "Quando chegou no cliente",
  finished: "Data!Entrega",
  pickup: "Data!Carregamento",
  status: "Status",
  plannedDelivery: "Data!Entrega",
  uf: "UF",
  invoice: "NF",
  reference: "Pré!Embarque",
} as const;

export const COCKPIT_COL = {
  reference: "Pré!Embarque",
  inclusion: "Data!Inclusão",
  loading: "Data!Carregamento",
  uf: "UF",
} as const;

export const SLA_BY_UF: Record<string, number> = {
  MS: 4, MG: 4, PR: 3, RS: 4, SC: 4, SP: 4,
  DF: 5, GO: 5, MT: 6,
  AC: 12, AL: 10, AP: 20, AM: 20, BA: 8, CE: 11, ES: 8, MA: 11, PA: 12, PB: 12, PE: 11, PI: 11, RJ: 7, RN: 12, RO: 10, RR: 21, SE: 10, TO: 9
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

/**
 * Robusta função de conversão de datas para lidar com Seriais Excel e Strings.
 */
export function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }

  // Se for número (Serial Excel)
  if (typeof dateValue === "number") {
    // Math.round((value - 25569) * 86400 * 1000) + timezoneOffset
    const ms = Math.round((dateValue - 25569) * 86400 * 1000) + (new Date().getTimezoneOffset() * 60000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Se for String
  if (typeof dateValue === "string") {
    const raw = dateValue.trim().replace(/-/g, "/");
    if (!raw) return null;

    // Tratar formato DD/MM/YYYY ou DD/MM/YY
    if (raw.includes("/")) {
      const parts = raw.split(/[\/\s:]/);
      if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (parts[2].length === 2) year += 2000;
        
        const hour = parts[3] ? parseInt(parts[3], 10) : 0;
        const min = parts[4] ? parseInt(parts[4], 10) : 0;
        const sec = parts[5] ? parseInt(parts[5], 10) : 0;

        const d = new Date(year, month, day, hour, min, sec);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }

    // Tentar parse nativo para ISO (YYYY-MM-DD)
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) return new Date(parsed);
  }

  return null;
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    // Se o valor for muito grande (ex: > 10000), provavelmente está em kg e precisa ser convertido para t
    // Mas o usuário relatou que Piracicaba está exibindo 1.623.880,00 t quando deveria ser 1.623,88 t
    // Isso indica que o valor 1623.88 (que já é t) está sendo lido como 1623880 ou multiplicado.
    // Se vier 1623.88, mantemos. Se vier 1623880 (kg), dividimos por 1000.
    return value > 5000 ? value / 1000 : value;
  }
  
  const raw = str(value);
  if (!raw) return null;
  
  // Limpeza de caracteres não numéricos exceto ponto e vírgula
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  
  let n: number;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Formato europeu/brasileiro com separador de milhar: 1.234,56 -> 1234.56
    n = Number(cleaned.replace(/\./g, "").replace(",", "."));
  } else if (cleaned.includes(",")) {
    // Apenas vírgula: 1234,56 -> 1234.56
    n = Number(cleaned.replace(",", "."));
  } else {
    // Já é formato ponto ou inteiro
    n = Number(cleaned);
  }

  if (!Number.isFinite(n)) return null;
  // Regra de escala: Se o valor final for > 5000, assumimos que é KG e convertemos para Toneladas
  return n > 5000 ? n / 1000 : n;
}

export const rowMonth = (r: Row) => parseDate(r[COL.pickup]) || parseDate(r[COL.arrived]) || parseDate(r[COL.finished]);

export const isCalIndustrial = (row: Row) => {
  return true; // Removido filtro de Cal Industrial conforme solicitado para usar Cockpit exclusivamente
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
