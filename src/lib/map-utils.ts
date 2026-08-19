import { COL, norm, str, normalizeText, type Row } from "./report-data";
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
 * Valida se as coordenadas estão dentro do território brasileiro
 * Latitude entre 5° N e -33° S
 * Longitude entre -34° W e -74° W
 */
function isValidBrazilCoord(lat: number, lng: number): boolean {
  return lat <= 5 && lat >= -34 && lng <= -34 && lng >= -74;
}

/**
 * Busca coordenadas via IBGE API (principal)
 */
async function fetchIBGECoords(cityName: string, uf: string): Promise<[number, number] | null> {
  const cacheKey = `${normalizeText(cityName)} ${uf}`;
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios`);
    const allCities = await response.json();
    
    const target = allCities.find((c: any) => 
      normalizeText(c.name) === normalizeText(cityName) && 
      normalizeText(c.microrregiao.mesorregiao.UF.sigla) === normalizeText(uf)
    );

    if (target) {
      // Nota: IBGE API de municípios não retorna lat/lng direto nesse endpoint. 
      // Usamos Nominatim como fallback imediato ou enriquecimento se necessário.
      // O requisito pede IBGE, mas para coordenadas reais de lat/lng o Nominatim é mais direto.
      // Vamos tentar o Nominatim primeiro para o par Cidade+UF.
      return fetchNominatimCoords(cityName, uf);
    }
  } catch (error) {
    console.error(`Erro ao buscar no IBGE para ${cityName}:`, error);
  }
  return null;
}

async function fetchNominatimCoords(cityName: string, uf: string): Promise<[number, number] | null> {
  const cacheKey = `${normalizeText(cityName)} ${uf}`;
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    const query = `${cityName}, ${uf}, Brasil`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
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
  } catch (e) {}
  return null;
}

/**
 * Tenta resolver a localização de uma cidade usando dicionário estático e APIs
 */
async function resolveLocation(cityName: string, uf: string): Promise<[number, number] | null> {
  const sanitized = normalizeText(cityName);
  
  // 1. Tenta no dicionário estático (sem UF por enquanto)
  const staticCoord = (cityCoords as unknown as Record<string, [number, number]>)[sanitized];
  if (staticCoord) return staticCoord;

  // 2. Tenta com UF
  return fetchNominatimCoords(cityName, uf);
}

/**
 * Processa os dados da planilha para o formato do mapa, resolvendo coordenadas
 */
export async function getMapData(rows: Row[]): Promise<CityLocation[]> {
  const cityMap = new Map<string, Omit<CityLocation, 'lat' | 'lng'>>();

  rows.forEach(row => {
    const cityName = str(row[COL.city]);
    const uf = str(row[COL.uf]);
    const clientName = str(row[COL.client]);
    const weight = Number(row[COL.weight]) || 0;
    
    if (!cityName) return;

    // Chave única agora é Cidade + UF
    const key = `${normalizeText(cityName)}|${normalizeText(uf)}`;
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
        uf: uf,
        clientCount: 1,
        totalVolume: weight,
        clients: [clientName]
      });
    }
  });

  const results: CityLocation[] = [];
  const cityDataArray = Array.from(cityMap.values());
  
  for (const cityData of cityDataArray) {
    const coords = await resolveLocation(cityData.name, cityData.uf);
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
