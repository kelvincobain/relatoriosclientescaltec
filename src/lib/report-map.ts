import { Row, COL, str, isCalIndustrial, toNumber } from "@/lib/report-data";

export interface CityLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
  clients: string[];
  totalTons: number;
  totalLoads: number;
}

// IBGE Municipality type
interface IBGEMunicipality {
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      }
    }
  }
}

// We'll use this mock dictionary for fallback but prioritize IBGE
// Some coordinates are hard to get accurately from IBGE without a massive cross-ref
// but IBGE has a specific API for coordinates as well.
// However, the standard municípios API gives us names and UFs.
// For coordinates, we usually need the IBGE code or a secondary lookup.
// Let's use a public CSV/JSON of IBGE codes with lat/lng for efficiency.

let ibgeCoordsCache: Record<string, { lat: number; lng: number }> | null = null;

async function getIBGECoords(): Promise<Record<string, { lat: number; lng: number }>> {
  if (ibgeCoordsCache) return ibgeCoordsCache;
  
  try {
    // This is a reliable public source of IBGE municipality coordinates in Brazil
    const response = await fetch('https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json');
    const data = await response.json();
    
    const map: Record<string, { lat: number; lng: number }> = {};
    data.forEach((m: any) => {
      // Key: "CIDADE-UF"
      const key = `${str(m.nome).toUpperCase()}-${str(m.codigo_uf_sigla).toUpperCase()}`;
      map[key] = { lat: m.latitude, lng: m.longitude };
    });
    
    ibgeCoordsCache = map;
    return map;
  } catch (err) {
    console.error("Failed to load IBGE coordinates:", err);
    return {};
  }
}

export async function getMapData(rows: Row[]): Promise<CityLocation[]> {
  const calRows = rows.filter(isCalIndustrial);
  const cityMap = new Map<string, CityLocation>();
  const ibgeCoords = await getIBGECoords();

  for (const row of calRows) {
    const cityName = str(row[COL.city]).toUpperCase();
    const state = str(row[COL.state] || "PR").toUpperCase();
    const key = `${cityName}-${state}`;
    const client = str(row[COL.client]);
    const tons = (toNumber(row[COL.weight]) || 0) / 1000;

    const coords = ibgeCoords[key];
    
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
