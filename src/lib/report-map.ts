import { Row, COL, str, isCalIndustrial, toNumber } from "@/lib/report-data";
import { buildSampleRows } from "./report-sample";

export interface CityLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
  clients: string[];
  totalTons: number;
  totalLoads: number;
}

// Static dictionary with REAL coordinates for common Brazilian cities in the dataset
const GEODATA_DICT: Record<string, { lat: number; lng: number }> = {
  "ITAPERUÇU, PR": { lat: -25.1878, lng: -49.3489 },
  "RIO BRANCO DO SUL, PR": { lat: -25.1897, lng: -49.3139 },
  "ADRIANÓPOLIS, PR": { lat: -24.6617, lng: -48.9911 },
  "CURITIBA, PR": { lat: -25.4290, lng: -49.2671 },
  "SÃO PAULO, SP": { lat: -23.5505, lng: -46.6333 },
  "CATANDUVA, SP": { lat: -21.1378, lng: -48.9732 },
  "CAMPO LARGO, PR": { lat: -25.4578, lng: -49.5297 },
  "ARAUCÁRIA, PR": { lat: -25.5886, lng: -49.4103 },
  "PONTA GROSSA, PR": { lat: -25.0950, lng: -50.1619 },
  "CASCAVEL, PR": { lat: -24.9555, lng: -53.4552 },
  "JOINVILLE, SC": { lat: -26.3045, lng: -48.8456 },
  "CANOAS, RS": { lat: -29.9189, lng: -51.1767 },
  "BETIM, MG": { lat: -19.9678, lng: -44.1983 },
  "SERRA, ES": { lat: -20.1285, lng: -40.3079 },
  "CARIACICA, ES": { lat: -20.2639, lng: -40.4203 },
};

// Cache for Nominatim results to avoid repeated calls in the same session
const nominatimCache = new Map<string, { lat: number; lng: number } | null>();

async function fetchNominatimCoords(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const query = `${city}, ${state}, Brasil`;
  if (nominatimCache.has(query)) return nominatimCache.get(query) || null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Caltec-Report-Dashboard/1.0'
        }
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      nominatimCache.set(query, coords);
      return coords;
    }
  } catch (err) {
    console.error(`Nominatim geocoding failed for ${query}:`, err);
  }
  
  nominatimCache.set(query, null);
  return null;
}

export async function getMapData(rows: Row[]): Promise<CityLocation[]> {
  const calRows = rows.filter(isCalIndustrial);
  const cityMap = new Map<string, CityLocation>();

  // Use a map to track async geocoding tasks
  const geocodingTasks: Promise<void>[] = [];

  for (const row of calRows) {
    const cityName = str(row[COL.city]).toUpperCase();
    const state = str(row[COL.state] || "PR").toUpperCase(); // Default PR if missing
    const key = `${cityName}, ${state}`;
    const client = str(row[COL.client]);
    const tons = (toNumber(row[COL.weight]) || 0) / 1000;

    if (!cityMap.has(key)) {
      const geo = GEODATA_DICT[key];
      
      if (geo) {
        cityMap.set(key, {
          city: str(row[COL.city]),
          state: state,
          lat: geo.lat,
          lng: geo.lng,
          clients: [client],
          totalTons: tons,
          totalLoads: 1
        });
      } else {
        // Prepare async task for missing cities
        const task = fetchNominatimCoords(str(row[COL.city]), state).then(coords => {
          if (coords) {
            cityMap.set(key, {
              city: str(row[COL.city]),
              state: state,
              lat: coords.lat,
              lng: coords.lng,
              clients: [client],
              totalTons: tons,
              totalLoads: 1
            });
          }
        });
        geocodingTasks.push(task);
      }
    } else {
      const data = cityMap.get(key)!;
      if (!data.clients.includes(client)) {
        data.clients.push(client);
      }
      data.totalTons += tons;
      data.totalLoads += 1;
    }
  }

  await Promise.all(geocodingTasks);

  return Array.from(cityMap.values());
}

// Helper to debug sample data geocoding
if (typeof window !== 'undefined') {
  (window as any).debugMapData = async () => {
    const data = await getMapData(buildSampleRows());
    console.log("Geocoded Sample Data:", data);
    return data;
  };
}
