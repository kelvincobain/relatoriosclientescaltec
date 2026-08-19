import { Row, COL, str, isCalIndustrial, toNumber, norm } from "@/lib/report-data";

export interface CityLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
  clients: string[];
  totalTons: number;
  totalLoads: number;
}

// Standard dictionary for fallback when IBGE fails or for speed
const FALLBACK_GEODATA: Record<string, { lat: number; lng: number }> = {
  "ITAPERUÇU-PR": { lat: -25.1878, lng: -49.3489 },
  "RIO BRANCO DO SUL-PR": { lat: -25.1897, lng: -49.3139 },
  "ADRIANÓPOLIS-PR": { lat: -24.6617, lng: -48.9911 },
  "CURITIBA-PR": { lat: -25.4290, lng: -49.2671 },
  "SÃO PAULO-SP": { lat: -23.5505, lng: -46.6333 },
  "CATANDUVA-SP": { lat: -21.1378, lng: -48.9732 },
  "CAMPO LARGO-PR": { lat: -25.4578, lng: -49.5297 },
  "ARAUCÁRIA-PR": { lat: -25.5886, lng: -49.4103 },
  "PONTA GROSSA-PR": { lat: -25.0950, lng: -50.1619 },
  "CASCAVEL-PR": { lat: -24.9555, lng: -53.4552 },
  "JOINVILLE-SC": { lat: -26.3045, lng: -48.8456 },
  "CANOAS-RS": { lat: -29.9189, lng: -51.1767 },
  "BETIM-MG": { lat: -19.9678, lng: -44.1983 },
  "SERRA-ES": { lat: -20.1285, lng: -40.3079 },
  "CARIACICA-ES": { lat: -20.2639, lng: -40.4203 },
};

let ibgeCoordsCache: Record<string, { lat: number; lng: number }> | null = null;
let ibgeLoadingPromise: Promise<Record<string, { lat: number; lng: number }>> | null = null;

async function getIBGECoords(): Promise<Record<string, { lat: number; lng: number }>> {
  if (ibgeCoordsCache) return ibgeCoordsCache;
  if (ibgeLoadingPromise) return ibgeLoadingPromise;
  
  ibgeLoadingPromise = (async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json');
      if (!response.ok) throw new Error("IBGE source failed");
      const data = await response.json();
      
      const map: Record<string, { lat: number; lng: number }> = {};
      data.forEach((m: any) => {
        const key = `${str(m.nome).toUpperCase()}-${str(m.codigo_uf_sigla).toUpperCase()}`;
        map[key] = { lat: m.latitude, lng: m.longitude };
      });
      
      ibgeCoordsCache = map;
      return map;
    } catch (err) {
      console.error("Failed to load IBGE coordinates:", err);
      return FALLBACK_GEODATA;
    }
  })();

  return ibgeLoadingPromise;
}

export async function getMapData(rows: Row[]): Promise<CityLocation[]> {
  if (!rows || rows.length === 0) return [];
  const cityMap = new Map<string, CityLocation>();
  const ibgeCoords = await getIBGECoords();

  for (const row of rows) {
    const product = norm(row[COL.product]);
    const isCal = isCalIndustrial(row) || product.includes("cal");
    if (!isCal) continue;

    const cityName = str(row[COL.city]).toUpperCase();
    const state = str(row[COL.state] || "PR").toUpperCase();
    
    if (!cityName) continue;
    
    const key = `${cityName}-${state}`;
    const client = str(row[COL.client]);
    const weightVal = toNumber(row[COL.weight]);
    const tons = (weightVal || 0) / 1000;

    const coords = ibgeCoords[key] || FALLBACK_GEODATA[key];
    
    if (coords) {
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: str(row[COL.city]),
          state: state,
          lat: coords.lat,
          lng: coords.lng,
          clients: [client],
          totalTons: tons,
          totalLoads: 1
        });
      } else {
        const data = cityMap.get(key)!;
        if (!data.clients.includes(client)) {
          data.clients.push(client);
        }
        data.totalTons += tons;
        data.totalLoads += 1;
      }
    }
  }

  return Array.from(cityMap.values());
}
