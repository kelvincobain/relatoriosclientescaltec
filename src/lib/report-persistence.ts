import { Row, str, norm, COL, parseDate, isCancelled } from "./report-data";

/**
 * Deduplicates rows based on unique combination of USINA + CIDADE + CÓDIGO REFERÊNCIA + DATA PREVISTA.
 * If multiple rows exist, the one with more information (arrived/finished dates) is preferred.
 */
export function deduplicateRows(rows: Row[]): Row[] {
  const map = new Map<string, Row>();

  for (const row of rows) {
    // We use a combination of fields as a unique key for a shipment
    // Reference Code is the primary key if available, otherwise fallback to specific business keys
    const ref = str(row[COL.reference]);
    const city = norm(row[COL.city]);
    const client = norm(row[COL.client]);
    const planned = str(row[COL.plannedDelivery]);
    const pickup = str(row[COL.pickup]);
    
    // Key strategy: Reference is unique if present. 
    // Otherwise combination of client + city + planned delivery date identifies the trip.
    const key = ref ? `ref:${ref}` : `trip:${client}|${city}|${planned}|${pickup}`;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      continue;
    }

    // Upsert logic: If duplicate found, keep the "better" one
    // "Better" = Has completion date, or arrived date, or just more fields filled
    const existingScore = getRowScore(existing);
    const currentScore = getRowScore(row);

    if (currentScore > existingScore) {
      map.set(key, row);
    }
  }

  return Array.from(map.values());
}

function getRowScore(row: Row): number {
  let score = 0;
  if (str(row[COL.finished])) score += 10;
  if (str(row[COL.arrived])) score += 5;
  if (!isCancelled(row)) score += 2;
  // Count non-empty values
  score += Object.values(row).filter(v => str(v) !== "").length * 0.1;
  return score;
}

/**
 * Merges a new set of rows into the existing dataset (complement/upsert).
 */
export function mergeDatasets(existing: Row[], newRows: Row[]): Row[] {
  // Combine both sets
  const combined = [...existing, ...newRows];
  // Deduplicate using our strict logic
  return deduplicateRows(combined);
}
