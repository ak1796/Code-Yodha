import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { citiesConfig } from '../../assets/data/citiesConfig';
import { getEstimatedPopulation } from '../../assets/data/populationMapping';
import { Activity, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

/**
 * Custom Icons for Citizen Map
 */
const activeIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const resolvedIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #10B981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export default function CitizenMap({ tickets = [] }) {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [geoData, setGeoData] = useState(null);
  const [silenceZones, setSilenceZones] = useState([]);
  const config = citiesConfig[selectedCity];

  // Load GeoJSON
  useEffect(() => {
    import(/* @vite-ignore */ `../../assets/data/${config.filename}`)
      .then(m => setGeoData(m.default))
      .catch(err => console.error("GeoJSON load failed:", err));
  }, [selectedCity, config.filename]);

  const normalizeWard = (v) => {
    if (!v) return "";
    let s = String(v).trim().toLowerCase();
    s = s.replace(/^ward\s*[- ]*/, "");
    if (s.includes('/')) return s;
    return s.split(/[ \((]/)[0];
  };

  // Identify Silent Crisis Zones Algorithmicly
  useEffect(() => {
    if (!geoData) return;
    
    const zones = geoData.features.map(feature => {
      const wardName = feature.properties[config.nameProp];
      const normWard = normalizeWard(wardName);

      const wardTickets = tickets.filter(t => normalizeWard(t.ward) === normWard).length;
      const population = getEstimatedPopulation(selectedCity, wardName);
      
      // Silence Ratio: High Population / Low Complaints
      const silenceRatio = population / (wardTickets + 1);
      
      return {
        name: wardName,
        normWard,
        isSilent: silenceRatio > 3000, // Threshold for "Silent Crisis"
        ratio: silenceRatio
      };
    });
    
    setSilenceZones(zones);
  }, [geoData, tickets, selectedCity, config.nameProp]);

  const getWardStyle = (feature) => {
    const wardName = feature.properties[config.nameProp];
    const zone = silenceZones.find(z => z.name === wardName);
    
    return {
      fillColor: zone?.isSilent ? '#4B5563' : 'transparent',
      fillOpacity: zone?.isSilent ? 0.4 : 0,
      color: '#007AFF', // Clean thick blue borders
      weight: 2,
      opacity: 0.6
    };
  };

  return (
    <div className="relative w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-border shadow-2xl bg-surface group">
       {/* City Selector Layer */}
       <div className="absolute top-6 left-6 z-[400] flex gap-2">
          {Object.keys(citiesConfig).map(city => (
            <button 
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCity === city ? 'bg-navy text-white shadow-lg' : 'bg-white/80 backdrop-blur text-navy/40 hover:bg-white'}`}
            >
              {city}
            </button>
          ))}
       </div>

       {/* Legend */}
       <div className="absolute bottom-10 left-10 z-[400] bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-border shadow-soft space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy opacity-30 italic mb-2">{t('TransparencyLegend')}</h4>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-crimson" />
             <span className="text-[10px] font-extrabold uppercase text-navy">{t('ActiveIssues')}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-emerald" />
             <span className="text-[10px] font-extrabold uppercase text-navy">{t('Resolved')}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-md bg-gray-500 opacity-40" />
             <span className="text-[10px] font-extrabold uppercase text-navy">{t('SilentCrises')}</span>
          </div>
       </div>

       <MapContainer 
         key={`citizen-map-${selectedCity}-${tickets.length}`} // Force re-render on data sync
         center={config.center} 
         zoom={11} 
         className="w-full h-full z-10" 
         zoomControl={false}
       >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapController center={config.center} />
          
          {geoData && (
            <GeoJSON 
              data={geoData} 
              style={getWardStyle}
              onEachFeature={(feature, layer) => {
                 const wardName = feature.properties[config.nameProp];
                 const zone = silenceZones.find(z => z.name === wardName);
                 const pop = getEstimatedPopulation(selectedCity, wardName);
                 
                 layer.bindPopup(`
                    <div class="p-2">
                       <h3 class="font-black uppercase text-xs text-navy tracking-tight">${t('Ward')} ${wardName}</h3>
                       <div class="mt-2 space-y-1">
                          <p class="text-[9px] font-bold text-text-secondary uppercase">${t('PopEst')}: <b>${pop.toLocaleString()}</b></p>
                          ${zone?.isSilent ? `<p class="text-[9px] font-black text-crimson uppercase italic mt-2 animate-pulse">${t('UnderReported')}</p>` : ''}
                       </div>
                    </div>
                 `);
              }}
            />
          )}

          {tickets.filter(t => t.city === selectedCity && t.lat && t.lng).map(ticket => (
            <Marker 
              key={ticket.id} 
              position={[ticket.lat, ticket.lng]} 
              icon={ticket.status === 'resolved' ? resolvedIcon : activeIcon}
            >
              <Popup>
                 <div className="p-2 space-y-2">
                    <h4 className="font-extrabold text-navy uppercase text-[10px]">{ticket.category}</h4>
                    <p className="text-[9px] text-text-secondary leading-tight italic">"${ticket.title}"</p>
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                       {ticket.status === 'resolved' ? <CheckCircle2 size={10} className="text-emerald"/> : <Activity size={10} className="text-crimson"/>}
                       <span className="text-[8px] font-black uppercase text-navy opacity-50">${ticket.status}</span>
                    </div>
                 </div>
              </Popup>
            </Marker>
          ))}
       </MapContainer>
    </div>
  );
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 11, { duration: 1.5 });
  }, [center, map]);
  return null;
}
