import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatNumber } from "@/lib/report-metrics";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Fix Leaflet marker icon issue in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #F59E0B; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface MapProps {
  data: any[];
  onCityClick: (cityName: string, clientName?: string, ufName?: string) => void;
}

function FitBounds({ markers }: { markers: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const group = L.featureGroup(markers.map(m => L.marker([m.lat, m.lng])));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [markers, map]);

  return null;
}

export function InteractiveMap({ data, onCityClick }: MapProps) {
  const [selectedCity, setSelectedCity] = useState<any | null>(null);

  // Cities are now pre-processed with stable coordinates in map-utils.ts
  const markers = data;

  return (
    <div className="relative w-full h-[600px] rounded-2xl border border-[#334155] shadow-xl overflow-hidden bg-[#0F172A]">
      <MapContainer
        center={[-15.7942, -47.8822]}
        zoom={4}
        style={{ width: "100%", height: "100%", background: "#0F172A" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {markers.map((city, idx) => (
          <Marker
            key={idx}
            position={[city.lat, city.lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                if (city.clientCount === 1) {
                  onCityClick(city.name, city.clients[0], city.uf);
                } else {
                  setSelectedCity(city);
                }
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="bg-[#1E293B] border border-[#334155] p-2 rounded shadow-lg text-white">
                <p className="font-bold text-sm">{city.name} - {city.uf}</p>
                <p className="text-xs text-muted-foreground">{city.clientCount} Clientes</p>
                <p className="text-xs text-primary font-bold">{formatNumber(city.totalVolume / 1000, 1)} t</p>
              </div>
            </Tooltip>
          </Marker>
        ))}

        <FitBounds markers={markers} />
      </MapContainer>

      {/* Overview Indicator */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#1E293B]/90 backdrop-blur-md border border-[#334155] px-4 py-2 rounded-full shadow-lg">
        <p className="text-xs font-semibold text-white">
          Visão Geral · <span className="text-primary">{data.length} Cidades Ativas</span>
        </p>
      </div>

      {/* Multi-client Selection Popup */}
      {selectedCity && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#334155] bg-[#0F172A]/50">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCity.name}</h3>
                <p className="text-xs text-muted-foreground">Selecione um cliente para abrir o dashboard</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedCity(null)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {selectedCity.clients.map((client: string) => (
                <button
                  key={client}
                  onClick={() => {
                    onCityClick(selectedCity.name, client, selectedCity.uf);
                    setSelectedCity(null);
                  }}
                  className="w-full text-left p-4 rounded-lg hover:bg-[#334155]/50 transition-colors group flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-slate-200 group-hover:text-primary">{client}</span>
                  <div className="h-2 w-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
