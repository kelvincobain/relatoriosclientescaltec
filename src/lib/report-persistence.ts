import { Row, str, norm, COL, isCancelled } from "./report-data";

/**
 * Row Scoring Logic:
 * Determines which row is "better" when duplicates are found.
 * Higher score wins.
 */
function getRowScore(row: Row): number {
  let score = 0;
  // A row with a finalization date is much more valuable for reports
  if (str(row[COL.finished])) score += 100;
  // Arrival date is the second best indicator
  if (str(row[COL.arrived])) score += 50;
  // Cancelled rows are less preferred if a real one exists
  if (!isCancelled(row)) score += 20;
  
  // Count total non-empty fields to break ties
  score += Object.values(row).filter(v => str(v) !== "").length;
  
  return score;
}

/**
 * Strict Deduplication Logic:
 * Uses Cod Referencia as primary key.
 * Fallback to business key: Client + City + Planned Delivery + Pickup Date.
 */
export function deduplicateRows(rows: Row[]): Row[] {
  const map = new Map<string, Row>();

  for (const row of rows) {
    const ref = str(row[COL.reference]);
    const client = norm(row[COL.client]);
    const city = norm(row[COL.city]);
    const planned = str(row[COL.plannedDelivery]);
    const pickup = str(row[COL.pickup]);

    // Primary ID is Cod Referencia if present
    // Otherwise combination of key identifying fields
    const key = ref 
      ? `ref:${ref}` 
      : `trip:${client}|${city}|${planned}|${pickup}`;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      continue;
    }

    // Upsert: replace if new row is "better"
    if (getRowScore(row) > getRowScore(existing)) {
      map.set(key, row);
    }
  }

  return Array.from(map.values());
}

/**
 * Merge Logic:
 * Combines existing data with new data, ensuring no duplicates.
 */
export function mergeDatasets(existing: Row[], newRows: Row[]): Row[] {
  // If we have no existing data, just deduplicate the new set
  if (!existing.length) return deduplicateRows(newRows);
  
  // Combine sets and run strict deduplication
  return deduplicateRows([...existing, ...newRows]);
}
