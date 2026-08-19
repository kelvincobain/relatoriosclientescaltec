import { COL, norm, str, type Row } from "./report-data";

export interface CityLocation {
  city: string;
  lat: number;
  lng: number;
  uf: string;
}

/**
 * Gets unique cities from the dataset with calculated metrics for the map markers.
 */
export function getMapData(rows: Row[]) {
  const cityMap = new Map<string, { 
    name: string; 
    uf: string; 
    clientCount: number; 
    totalVolume: number;
    clients: string[];
  }>();

  rows.forEach(row => {
    const cityName = str(row[COL.city]);
    const clientName = str(row[COL.client]);
    const weight = Number(row[COL.weight]) || 0;
    
    if (!cityName) return;

    const key = norm(cityName);
    const existing = cityMap.get(key);

    if (existing) {
      existing.totalVolume += weight;
      if (!existing.clients.includes(clientName)) {
        existing.clients.push(clientName);
        existing.clientCount++;
      }
    } else {
      cityMap.set(key, {
        name: cityName,
        uf: "", // Will be filled by geocoding logic
        clientCount: 1,
        totalVolume: weight,
        clients: [clientName]
      });
    }
  });

  return Array.from(cityMap.values());
}
