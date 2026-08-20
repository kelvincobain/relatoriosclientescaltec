import { type Row } from "./report-data";

export function mergeDatasets(current: Row[], next: Row[]): Row[] {
  // Use "Código Referência" (COL.reference) if available, otherwise fallback to a business key
  // As per instruction: "varredura pra não ter itens duplicados pelo código de referência"
  
  const map = new Map<string, Row>();
  
  // Add current ones
  for (const r of current) {
    const ref = String(r["Código Referência"] || r["referencia"] || "").trim();
    if (ref) {
      map.set(ref, r);
    } else {
      // Fallback unique key: Client + City + Date + Carrier
      const key = `${r["Cliente"]}|${r["Cidade"]}|${r["Data prevista entrega"]}|${r["Transportadora"]}`;
      map.set(key, r);
    }
  }
  
  // Merge next ones (overwrite)
  for (const r of next) {
    const ref = String(r["Código Referência"] || r["referencia"] || "").trim();
    if (ref) {
      map.set(ref, r);
    } else {
      const key = `${r["Cliente"]}|${r["Cidade"]}|${r["Data prevista entrega"]}|${r["Transportadora"]}`;
      map.set(key, r);
    }
  }
  
  return Array.from(map.values());
}
