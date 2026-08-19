import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CityLocation } from '@/lib/report-map';
import { formatNumber } from '@/lib/report-metrics';

interface InteractiveMapProps {
  data: CityLocation[];
  selectedCity?: string;
  onCityClick: (city: string, clients: string[]) => void;
}

function MapController({ selectedCity, data }: { selectedCity: string | undefined, data: CityLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCity) {
      const cityData = data.find(d => d.city.toLowerCase() === selectedCity.toLowerCase());
      if (cityData) {
        map.flyTo([cityData.lat, cityData.lng], 10, { duration: 1.5 });
      }
    } else {
      map.flyTo([-14.235, -51.925], 4, { duration: 1.5 });
    }
  }, [selectedCity, map, data]);

  return null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ data, selectedCity, onCityClick }) => {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-[#334155] shadow-2xl relative bg-[#0f172a]">
      <MapContainer 
        center={[-14.235, -51.925]} 
        zoom={4} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapController selectedCity={selectedCity} data={data} />

        {data.map((loc) => (
          <CircleMarker
            key={loc.city}
            center={[loc.lat, loc.lng]}
            radius={8 + Math.sqrt(loc.totalLoads) * 0.5}
            fillColor="#F59E0B"
            color="#F59E0B"
            weight={1}
            opacity={0.8}
            fillOpacity={0.6}
            eventHandlers={{
              click: () => onCityClick(loc.city, loc.clients)
            }}
            className="cursor-pointer hover:scale-110 transition-transform pulse-amber"
          >
            <Tooltip direction="top" offset={[0, -5]} opacity={1}>
              <div className="p-2 bg-[#1E293B] text-white border border-[#334155] rounded shadow-xl text-xs">
                <div className="font-bold text-[#F59E0B] border-b border-[#334155] pb-1 mb-1 uppercase tracking-wider">
                  {loc.city}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#94A3B8]">Clientes:</span>
                    <span className="font-bold">{loc.clients.length}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#94A3B8]">Volume:</span>
                    <span className="font-bold">{formatNumber(loc.totalTons, 0)} t</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#94A3B8]">Cargas:</span>
                    <span className="font-bold">{loc.totalLoads}</span>
                  </div>
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container {
          background: #0f172a !important;
        }
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .pulse-amber {
          animation: pulse-amber-animation 2s infinite;
        }
        @keyframes pulse-amber-animation {
          0% { stroke-width: 1; stroke-opacity: 0.8; }
          50% { stroke-width: 6; stroke-opacity: 0.3; }
          100% { stroke-width: 1; stroke-opacity: 0.8; }
        }
      `}} />
    </div>
  );
};

export default InteractiveMap;
