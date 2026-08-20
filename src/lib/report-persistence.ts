import { type Row, COL, COCKPIT_COL, norm, str } from "./report-data";

export function mergeDatasets(current: Row[], next: Row[]): Row[] {
  const map = new Map<string, Row>();
  
  // Determinamos qual base estamos tratando baseados nas colunas presentes
  const firstRow = next[0];
  const isCockpit = firstRow ? (
    firstRow[COCKPIT_COL.reference] !== undefined || 
    firstRow["Pré!Embarque"] !== undefined || 
    firstRow["Pre Embarque"] !== undefined
  ) : false;

  const getRef = (r: Row) => {
    if (isCockpit) {
      return str(r[COCKPIT_COL.reference] ?? r["Pré!Embarque"] ?? r["Pre Embarque"] ?? r["PreEmbarque"]).trim();
    }
    return str(r[COL.reference] ?? r["Código Referência"] ?? r["referencia"]).trim();
  };

  const getFallback = (r: Row) => {
    if (isCockpit) {
      return `${str(r["Cidade"] || r["Destino Município"])}|${str(r["Data!Inclusão"] || r["Data Inclusão"])}|${str(r["Data!Carregamento"] || r["Data Carregamento"])}`;
    }
    return `${str(r[COL.client])}|${str(r[COL.city])}|${str(r[COL.plannedDelivery])}|${str(r[COL.carrier])}`;
  };
  
  // Add current ones
  for (const r of current) {
    const ref = getRef(r);
    if (ref) {
      map.set(ref, r);
    } else {
      map.set(getFallback(r), r);
    }
  }
  
  // Merge next ones (overwrite)
  for (const r of next) {
    const ref = getRef(r);
    if (ref) {
      map.set(ref, r);
    } else {
      map.set(getFallback(r), r);
    }
  }
  
  return Array.from(map.values());
}
