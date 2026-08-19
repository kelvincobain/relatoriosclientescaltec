import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { CityLocation } from '@/lib/report-map';
import { formatNumber } from '@/lib/report-metrics';

interface InteractiveMapProps {
  data: CityLocation[];
  selectedCity?: string;
  selectedState?: string;
  onCityClick: (city: string, state: string, clients: string[]) => void;
}

// Bounds for Brazil territory
const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [
  [5.27, -73.98],   // North-West
  [-33.75, -34.79]  // South-East
];

function MapController({ selectedCity, selectedState, data }: { selectedCity: string | undefined, selectedState: string | undefined, data: CityLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCity && selectedState) {
      const cityData = data.find(d => 
        d.city.toLowerCase() === selectedCity.toLowerCase() && 
        d.state.toLowerCase() === selectedState.toLowerCase()
      );
      if (cityData) {
        map.flyTo([cityData.lat, cityData.lng], 10, { duration: 1.5 });
      }
    } else if (selectedState) {
      const stateMarkers = data.filter(d => d.state.toLowerCase() === selectedState.toLowerCase());
      if (stateMarkers.length > 0) {
        const bounds = L.latLngBounds(stateMarkers.map(d => [d.lat, d.lng]));
        map.fitBounds(bounds, { padding: [100, 100], maxZoom: 8 });
      }
    } else if (data.length > 0) {
      // Auto-fit bounds to ALL markers on initial load
      const bounds = L.latLngBounds(data.map(d => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    } else {
      map.flyTo([-14.235, -51.925], 4, { duration: 1.5 });
    }
  }, [selectedCity, selectedState, map, data]);

  return null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ data, selectedCity, selectedState, onCityClick }) => {
  // Custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-500 font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] backdrop-blur-sm">${count}</div>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-[#334155] shadow-2xl relative bg-[#0f172a]">
      <MapContainer 
        center={[-14.235, -51.925]} 
        zoom={4} 
        minZoom={4}
        maxBounds={BRAZIL_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapController selectedCity={selectedCity} selectedState={selectedState} data={data} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          showCoverageOnHover={false}
          maxClusterRadius={40}
        >
          {data.map((loc) => (
            <CircleMarker
              key={`${loc.city}-${loc.state}`}
              center={[loc.lat, loc.lng]}
              radius={8 + Math.sqrt(loc.totalLoads) * 0.5}
              fillColor="#F59E0B"
              color="#F59E0B"
              weight={1}
              opacity={0.8}
              fillOpacity={0.6}
              eventHandlers={{
                click: () => onCityClick(loc.city, loc.state, loc.clients)
              }}
              className="cursor-pointer hover:scale-110 transition-transform pulse-amber"
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                <div className="p-2 bg-[#1E293B] text-white border border-[#334155] rounded shadow-xl text-xs">
                  <div className="font-bold text-[#F59E0B] border-b border-[#334155] pb-1 mb-1 uppercase tracking-wider">
                    {loc.city}, {loc.state}
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
        </MarkerClusterGroup>
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
        .custom-marker-cluster {
          background: none !important;
          border: none !important;
        }
      `}} />
    </div>
  );
};

export default InteractiveMap;