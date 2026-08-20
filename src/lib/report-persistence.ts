import { get, set, del } from 'idb-keyval';
import type { Dataset, Row } from './report-data';

const STORAGE_KEY = 'caltec-report-dataset-v1';

export async function loadDatasetFromIDB(): Promise<Dataset | null> {
  try {
    const data = await get<Dataset>(STORAGE_KEY);
    return data || null;
  } catch (err) {
    console.error('[Persistence] Error loading from IndexedDB:', err);
    return null;
  }
}

export async function saveDatasetToIDB(dataset: Dataset): Promise<void> {
  try {
    await set(STORAGE_KEY, dataset);
    console.log(`[Persistence] Dataset saved to IndexedDB. Rows: ${dataset.rows.length}, Cockpit: ${dataset.cockpitRows.length}`);
  } catch (err) {
    console.error('[Persistence] Error saving to IndexedDB:', err);
  }
}

export async function clearDatasetIDB(): Promise<void> {
  try {
    await del(STORAGE_KEY);
  } catch (err) {
    console.error('[Persistence] Error clearing IndexedDB:', err);
  }
}

/** 
 * Merges two datasets based on a unique identifier.
 * For Ojo (Operacoes), we use "NF" + "Cod Referencia".
 * For Cockpit, we use "Pré!Embarque".
 */
export function mergeDatasets(current: Row[], incoming: Row[]): Row[] {
  const merged = [...current];
  const incomingMap = new Map();
  
  // Use a heuristic for unique keys if not explicitly defined
  incoming.forEach(row => {
    const key = String(row['NF'] || '') + String(row['Cod Referencia'] || '') + String(row['Pré!Embarque'] || '');
    if (key) incomingMap.set(key, row);
  });

  // This is a simple append for now, but we could deduplicate
  // In a real scenario, we might want to check for existing records.
  // The user said: "atualizando a base junto com o que já tem salvo"
  
  // Let's do a simple deduplication based on NF + Cod Referencia for Ojo
  // and Pré!Embarque for Cockpit.
  
  const existingKeys = new Set(current.map(row => 
    String(row['NF'] || '') + String(row['Cod Referencia'] || '') + String(row['Pré!Embarque'] || '')
  ));

  incoming.forEach(row => {
    const key = String(row['NF'] || '') + String(row['Cod Referencia'] || '') + String(row['Pré!Embarque'] || '');
    if (!existingKeys.has(key)) {
      merged.push(row);
    }
  });

  return merged;
}
