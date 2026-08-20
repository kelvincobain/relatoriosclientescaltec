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
      // Normalização agressiva para garantir que "REF123" e "ref 123" sejam o mesmo
      const val = r[COCKPIT_COL.reference] ?? r["Pré!Embarque"] ?? r["Pre Embarque"] ?? r["PreEmbarque"];
      return val ? norm(str(val)) : "";
    }
    const val = r[COL.reference] ?? r["Código Referência"] ?? r["referencia"];
    return val ? norm(str(val)) : "";
  };

  const getFallback = (r: Row) => {
    if (isCockpit) {
      return `COCKPIT|${norm(str(r["Cidade"] || r["Destino Município"]))}|${norm(str(r["Data!Inclusão"] || r["Data Inclusão"]))}|${norm(str(r["Data!Carregamento"] || r["Data Carregamento"]))}`;
    }
    return `OJO|${norm(str(r[COL.client]))}|${norm(str(r[COL.city]))}|${norm(str(r[COL.plannedDelivery]))}|${norm(str(r[COL.carrier]))}`;
  };
  
  // 1. Indexamos a base atual
  for (const r of current) {
    const ref = getRef(r);
    // IMPORTANTE: Se o registro não tem referência, usamos um fallback baseado nos dados
    // Se for cockpit, a chave deve começar com C_, se for Ojo, com O_
    const key = ref ? (isCockpit ? `C_${ref}` : `O_${ref}`) : getFallback(r);
    if (key) map.set(key, r);
  }
  
  // 2. Mesclamos a nova base (sobrescrevendo duplicados com a versão mais recente)
  for (const r of next) {
    const ref = getRef(r);
    const key = ref ? (isCockpit ? `C_${ref}` : `O_${ref}`) : getFallback(r);
    if (key) map.set(key, r);
  }
  
  return Array.from(map.values());
}
