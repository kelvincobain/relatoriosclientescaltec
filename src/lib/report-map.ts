import { Row, COL, str, norm, toNumber, isCalIndustrial } from "@/lib/report-data";

export interface CityLocation {
  city: string;
  lat: number;
  lng: number;
  clients: string[];
  totalTons: number;
  totalLoads: number;
}

// Mock geocoding for some Brazilian cities commonly in Caltec datasets or PR/South region
// In a real app, this would use a geocoding service or a more complete local DB.
const GEODATA: Record<string, { lat: number; lng: number }> = {
  "ITAPERUÇU": { lat: -25.2217, lng: -49.3497 },
  "RIO BRANCO DO SUL": { lat: -25.1897, lng: -49.3139 },
  "ADRIANÓPOLIS": { lat: -24.6617, lng: -48.9911 },
  "CURITIBA": { lat: -25.4290, lng: -49.2671 },
  "SÃO PAULO": { lat: -23.5505, lng: -46.6333 },
  "CAMPO LARGO": { lat: -25.4578, lng: -49.5297 },
  "ARAUCÁRIA": { lat: -25.5886, lng: -49.4103 },
  "PONTA GROSSA": { lat: -25.0950, lng: -50.1619 },
  "CASCAVEL": { lat: -24.9555, lng: -53.4552 },
  "JOINVILLE": { lat: -26.3045, lng: -48.8456 },
  "CANOAS": { lat: -29.9189, lng: -51.1767 },
  "BETIM": { lat: -19.9678, lng: -44.1983 },
  "SERRA": { lat: -20.1285, lng: -40.3079 },
  "CARIACICA": { lat: -20.2639, lng: -40.4203 },
};

export function getMapData(rows: Row[]): CityLocation[] {
  const calRows = rows.filter(isCalIndustrial);
  const cityMap = new Map<string, CityLocation>();

  calRows.forEach(row => {
    const cityName = str(row[COL.city]).toUpperCase();
    const client = str(row[COL.client]);
    const tons = (toNumber(row[COL.weight]) || 0) / 1000;

    if (!cityMap.has(cityName)) {
      const geo = GEODATA[cityName] || { 
        // Fallback random-ish spread in PR area if not in GEODATA
        lat: -25.42 + (Math.random() - 0.5) * 5, 
        lng: -49.26 + (Math.random() - 0.5) * 5 
      };
      cityMap.set(cityName, {
        city: str(row[COL.city]),
        lat: geo.lat,
        lng: geo.lng,
        clients: [],
        totalTons: 0,
        totalLoads: 0
      });
    }

    const data = cityMap.get(cityName)!;
    if (!data.clients.includes(client)) {
      data.clients.push(client);
    }
    data.totalTons += tons;
    data.totalLoads += 1;
  });

  return Array.from(cityMap.values());
}
