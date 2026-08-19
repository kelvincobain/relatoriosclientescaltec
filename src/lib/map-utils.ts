import { COL, norm, str, type Row } from "./report-data";
import cityCoords from "../data/city-coords.json";

export interface CityLocation {
  name: string;
  lat: number;
  lng: number;
  uf: string;
  clientCount: number;
  totalVolume: number;
  clients: string[];
}

// Cache local para geocodificação em memória durante a sessão
const geoCache = new Map<string, [number, number]>();

/**
 * Sanitiza o nome da cidade para busca no dicionário
 */
function sanitizeCityName(name: string): string {
  return str(name)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Valida se as coordenadas estão dentro do território brasileiro
 * Latitude entre 5° N e -33° S
 * Longitude entre -34° W e -74° W
 */
function isValidBrazilCoord(lat: number, lng: number): boolean {
  return lat <= 5 && lat >= -34 && lng <= -34 && lng >= -74;
}

/**
 * Busca coordenadas via Nominatim API (fallback)
 */
async function fetchCoords(cityName: string): Promise<[number, number] | null> {
  const cacheKey = sanitizeCityName(cityName);
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

  try {
    // Delay para respeitar limites do Nominatim em requisições em massa
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)},Brasil`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (isValidBrazilCoord(lat, lng)) {
        geoCache.set(cacheKey, [lat, lng]);
        return [lat, lng];
      }
    }
  } catch (error) {
    console.error(`Erro ao buscar coordenadas para ${cityName}:`, error);
  }
  return null;
}

/**
 * Tenta resolver a localização de uma cidade usando dicionário estático e API
 */
async function resolveLocation(cityName: string): Promise<[number, number] | null> {
  const sanitized = sanitizeCityName(cityName);
  
  // 1. Tenta no dicionário estático
  const staticCoord = (cityCoords as unknown as Record<string, [number, number]>)[sanitized];
  if (staticCoord) return staticCoord;

  // 2. Tenta no cache de sessão
  if (geoCache.has(sanitized)) return geoCache.get(sanitized)!;

  // 3. Busca na API (chamada assíncrona externa)
  return fetchCoords(cityName);
}

/**
 * Processa os dados da planilha para o formato do mapa, resolvendo coordenadas
 */
export async function getMapData(rows: Row[]): Promise<CityLocation[]> {
  const cityMap = new Map<string, Omit<CityLocation, 'lat' | 'lng'>>();

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
        uf: "", // UF pode ser extraída se houver coluna, ou vir da geocodificação
        clientCount: 1,
        totalVolume: weight,
        clients: [clientName]
      });
    }
  });

  const results: CityLocation[] = [];
  const cityDataArray = Array.from(cityMap.values());
  
  // Resolvemos coordenadas
  for (const cityData of cityDataArray) {
    const coords = await resolveLocation(cityData.name);
    if (coords) {
      results.push({
        ...cityData,
        lat: coords[0],
        lng: coords[1]
      });
    }
  }

  return results;
}
