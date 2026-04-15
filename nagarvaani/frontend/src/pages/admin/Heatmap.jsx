import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  MapContainer, TileLayer, Marker, Popup, 
  LayerGroup, LayersControl, GeoJSON, useMap, Pane
} from "react-leaflet";
import { useTranslation } from 'react-i18next';
import { 
  Shield, History, MapPin, Zap, Filter, 
  AlertTriangle, Users2, Phone, Activity, ChevronDown
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { citiesConfig } from "../../assets/data/citiesConfig";

const normalizeWardValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

// Mumbai ward labels aligned to BMC's 24 administrative wards.
// Source references used: BMC/MCGM ward directory and ward office listings.
const MUMBAI_WARD_LABELS = {
  a: "Ward A (Colaba, Fort, Churchgate)",
  b: "Ward B (Dongri, Bhendi Bazar, Masjid Bunder)",
  c: "Ward C (Bhuleshwar, Kalbadevi)",
  d: "Ward D (Grant Road, Malabar Hill, Walkeshwar)",
  e: "Ward E (Byculla, Nagpada, Mazgaon)",
  "f/n": "Ward F/North (Matunga, Sion, Wadala)",
  "f/s": "Ward F/South (Parel, Sewri)",
  "g/n": "Ward G/North (Dadar, Mahim, Dharavi)",
  "g/s": "Ward G/South (Worli, Prabhadevi)",
  "h/e": "Ward H/East (Santacruz East, Bandra East)",
  "h/w": "Ward H/West (Bandra West, Khar West)",
  "k/e": "Ward K/East (Andheri East, Jogeshwari East)",
  "k/w": "Ward K/West (Andheri West, Oshiwara)",
  l: "Ward L (Kurla, Sakinaka)",
  "m/e": "Ward M/East (Govandi, Deonar, Mankhurd)",
  "m/w": "Ward M/West (Chembur, Tilak Nagar)",
  n: "Ward N (Ghatkopar, Vikhroli)",
  "p/n": "Ward P/North (Malad, Aksa, Madh)",
  "p/s": "Ward P/South (Goregaon)",
  "r/n": "Ward R/North (Dahisar)",
  "r/c": "Ward R/Central (Borivali)",
  "r/s": "Ward R/South (Kandivali)",
  s: "Ward S (Bhandup, Kanjurmarg, Powai)",
  t: "Ward T (Mulund)",
};

const getWardIdentity = (feature, cityConfig) => {
  const rawWardId =
    feature?.properties?.[cityConfig.wardProp] ||
    feature?.properties?.WARD_NO ||
    feature?.properties?.Ward_No ||
    feature?.properties?.KGISWardNo ||
    feature?.properties?.name ||
    feature?.properties?.NAME;

  return {
    rawWardId,
    wardId: normalizeWardValue(rawWardId),
  };
};

const getWardOfficeIcon = (cityConfig) => {
  return new L.DivIcon({
    className: "ward-office-marker",
    html: `
      <div style="
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: ${cityConfig.color};
        border: 2px solid ${cityConfig.color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 18px rgba(0,0,0,0.18);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const getWardLabel = (feature, cityConfig, activeCity) => {
  const { wardId, rawWardId } = getWardIdentity(feature, cityConfig);
  const wardDisplayName = activeCity === "Mumbai"
    ? (MUMBAI_WARD_LABELS[wardId] || `Ward ${rawWardId || "Unknown"}`)
    : (feature.properties[cityConfig.nameProp] ||
        feature.properties.WARD_NAME ||
        feature.properties.Ward_Name ||
        feature.properties.KGISWardName ||
        rawWardId ||
        "Unknown Ward");

  return { wardId, rawWardId, wardDisplayName };
};

const getWardOfficePoints = (geoData, cityConfig, activeCity) => {
  if (!geoData?.features?.length) return [];

  return geoData.features.reduce((acc, feature, index) => {
    try {
      const layer = L.geoJSON(feature);
      const center = layer.getBounds().getCenter();
      const { wardId, rawWardId, wardDisplayName } = getWardLabel(feature, cityConfig, activeCity);

      if (!wardId && !rawWardId) return acc;

      acc.push({
        key: `${wardId || rawWardId || index}-${index}`,
        wardCode: rawWardId || "N/A",
        wardName: wardDisplayName,
        lat: center.lat,
        lng: center.lng,
      });
      return acc;
    } catch (err) {
      return acc;
    }
  }, []);
};

// Component to handle map movement when city changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Custom Icons
const officerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1066/1066371.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const incidentIcon = (priority) => new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xl ${
    priority >= 4 ? 'bg-crimson animate-pulse' : priority >= 2 ? 'bg-saffron' : 'bg-emerald'
  }">${priority >= 4 ? '!' : priority}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function AdminHeatmap() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeCity, setActiveCity] = useState("Mumbai");
  const [geoData, setGeoData] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [wardStats, setWardStats] = useState({});

  const cityConfig = citiesConfig[activeCity] || citiesConfig["Mumbai"];

  useEffect(() => {
    fetchRealtimeData();
    loadGeoData();
    const ticketSub = supabase.channel('map-tickets-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_tickets' }, fetchRealtimeData)
      .subscribe();
    
    return () => supabase.removeChannel(ticketSub);
  }, [activeCity]);

  const loadGeoData = async () => {
    try {
      // Mapping filename to dynamic imports
      let data;
      if (cityConfig.filename === 'mumbai_wards.json') data = await import('../../assets/data/mumbai_wards.json');
      else if (cityConfig.filename === 'delhi_wards.json') data = await import('../../assets/data/delhi_wards.json');
      else if (cityConfig.filename === 'bbmp.json') data = await import('../../assets/data/bbmp.json');
      else if (cityConfig.filename === 'jaipur_wards.json') data = await import('../../assets/data/jaipur_wards.json');
      else if (cityConfig.filename === 'chennai_wards.json') data = await import('../../assets/data/chennai_wards.json');
      
      setGeoData(data.default || data);
    } catch (err) {
      console.error("Failed to load map data:", err);
    }
  };

  const fetchRealtimeData = async () => {
    const { data: tks } = await supabase.from('master_tickets').select('*').eq('city', activeCity);
    const { data: offs } = await supabase.from('profiles').select('*').eq('role', 'officer').eq('city', activeCity);
    
    setTickets(tks || []);
    setOfficers(offs || []);

    const stats = {};
    tks?.forEach(t => {
      const wardId = normalizeWardValue(t.ward);
      if (wardId) stats[wardId] = (stats[wardId] || 0) + 1;
    });
    setWardStats(stats);
  };

  const filteredTickets = useMemo(() => {
    if (categoryFilter === "all") return tickets;
    return tickets.filter(t => t.category === categoryFilter);
  }, [tickets, categoryFilter]);

  // UNIFIED HIGH FIDELITY STYLING
  const getWardStyle = (feature) => {
    const { wardId } = getWardIdentity(feature, cityConfig);
                   
    // CRITICAL FIX: Only match if wardId is truthy to avoid all turning blue if property is missing
    const isSelected = !!(selectedWard && selectedWard === wardId);
    const intensity = wardStats[wardId] || 0;

    return {
      fillColor: isSelected ? '#B3E5FC' : (intensity > 0 ? '#FFEBEE' : 'transparent'),
      fillOpacity: isSelected ? 0.8 : (intensity > 0 ? 0.3 : 0),
      color: isSelected ? '#007AFF' : '#007AFF', // Solid Blue Border
      weight: isSelected ? 4 : 2,        // Thick Line
      opacity: 1,
      stroke: true
    };
  };

  const onEachWard = (feature, layer) => {
    const wardId = feature.properties[cityConfig.wardProp] || 
                   feature.properties.WARD_NO || 
                   feature.properties.Ward_No || 
                   feature.properties.KGISWardNo ||
                   feature.properties.name ||
                   feature.properties.gid;
                   
    const wardDisplayName = feature.properties[cityConfig.nameProp] || 
                            feature.properties.WARD_NAME || 
                           feature.properties.Ward_Name || 
                           feature.properties.KGISWardName || 
                           feature.properties.name ||
                           wardId;
    
    layer.on({
      click: (e) => {
        if (wardId) setSelectedWard(wardId);
        L.DomEvent.stopPropagation(e);
      }
    });

    const count = wardStats[wardId] || 0;
    layer.bindPopup(`
      <div class="p-0 font-sora overflow-hidden rounded-xl border border-navy/10 min-w-[200px]">
        <div class="bg-navy p-3 text-white">
          <p class="text-[8px] font-black uppercase tracking-widest opacity-60">${cityConfig.org} Sector</p>
          <h4 class="font-black text-sm uppercase tracking-tighter">${wardDisplayName}</h4>
          <p class="text-[9px] font-bold opacity-40">Code: ${wardId || 'N/A'}</p>
        </div>
        <div class="p-3 bg-white">
          <div class="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-2">
            <span class="text-[9px] font-bold text-navy/40 uppercase">Active Signals</span>
            <span class="text-xs font-black text-navy">${count}</span>
          </div>
          <div class="space-y-1">
             <p class="text-[8px] font-bold text-navy/30 uppercase tracking-widest">Status Protocol</p>
             <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full ${count > 5 ? 'bg-crimson animate-pulse' : 'bg-emerald'}" />
                <span class="text-[10px] font-extrabold text-navy">${count > 5 ? 'CRITICAL LOAD' : 'GRID STABLE'}</span>
             </div>
          </div>
        </div>
      </div>
    `, { className: 'premium-ward-popup' });
  };

  const wardOfficePoints = useMemo(
    () => getWardOfficePoints(geoData, cityConfig, activeCity),
    [geoData, cityConfig, activeCity]
  );

  return (
    <div className="h-screen w-full relative animate-fade-in overflow-hidden bg-bg">
      <style>{`
        .leaflet-popup-pane {
          z-index: 1000 !important;
        }
        .leaflet-popup {
          z-index: 1000 !important;
        }
      `}</style>
      {/* City & Dept Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-5xl px-4">
         <div className="bg-white/90 backdrop-blur-2xl border border-border p-3 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4">
            {/* City Selector */}
            <div className="relative group">
              <select 
                value={activeCity}
                onChange={(e) => setActiveCity(e.target.value)}
                className="bg-navy text-white pl-12 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:bg-navy-light transition-all shadow-lg"
              >
                {Object.keys(citiesConfig).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                <MapPin size={16} />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Department Filter */}
            <div className="flex-1 px-4 border-l border-r border-border mx-2">
              <select 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-bg border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-navy outline-none cursor-pointer"
              >
                 <option value="all">{t('AllDepts')}</option>
                 {["DRAINAGE", "WATER SUPPLY", "ROADS AND TRAFFIC", "SOLID WASTE MANAGEMENT", "HEALTH", "ELECTRICITY", "ENCHROACHMENT"].map(dept => (
                   <option key={dept} value={dept}>{t(dept)}</option>
                 ))}
              </select>
            </div>

            {/* Live Status Indicator */}
            <div className="hidden md:flex items-center gap-3 pr-4">
               <div className="flex flex-col items-end">
                  <span className="text-[7px] font-black text-navy/40 uppercase tracking-widest">{activeCity} Protocol</span>
                  <span className="text-[10px] font-extrabold text-navy uppercase">{cityConfig.org} Command</span>
               </div>
               <div className="w-10 h-10 rounded-xl bg-emerald/10 text-emerald flex items-center justify-center shadow-inner">
                  <Activity size={18} />
               </div>
            </div>
         </div>
      </div>

      <MapContainer 
        center={cityConfig.center} 
        zoom={11.5} 
        className="h-full w-full z-10" 
        zoomControl={false}
        onClick={() => setSelectedWard(null)}
      >
        <ChangeView center={cityConfig.center} zoom={11.5} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        <LayersControl position="bottomleft">
          <LayersControl.Overlay checked name="Grid Boundaries">
            {geoData && (
              <GeoJSON 
                key={`${activeCity}-${selectedWard}`} // Force re-render on selection
                data={geoData} 
                style={getWardStyle}
                onEachFeature={onEachWard}
              />
            )}
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Active Signal Nodes">
             <LayerGroup>
                {filteredTickets.map(t => (
                  <Marker 
                    key={t.id} 
                    position={[t.lat || cityConfig.center[0], t.lng || cityConfig.center[1]]} 
                    icon={incidentIcon(t.priority_score)}
                  >
                     <Popup className="premium-popup">
                        <div className="p-4 space-y-4 min-w-[200px]">
                           <div className="flex justify-between items-start">
                              <span className="px-2 py-0.5 bg-navy text-white text-[8px] font-black rounded-full uppercase tracking-widest">NODE {t.id.substring(0, 5)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${t.status === 'resolved' ? 'bg-emerald text-white' : 'bg-saffron text-white'}`}>{t.status}</span>
                           </div>
                           <h4 className="font-sora font-extrabold text-navy tracking-tight uppercase leading-tight">{t.title}</h4>
                           <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                              <div>
                                 <p className="text-[8px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Telemetry</p>
                                 <p className="text-[10px] font-extrabold text-navy">Priority {t.priority_score}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Impact</p>
                                 <p className="text-[10px] font-extrabold text-navy">{t.category}</p>
                              </div>
                           </div>
                        </div>
                     </Popup>
                  </Marker>
                ))}
             </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Ward Offices">
             <Pane name="wardOfficePane" style={{ zIndex: 350 }}>
               <LayerGroup>
                  {wardOfficePoints.map((office) => (
                    <Marker 
                      key={office.key}
                      position={[office.lat, office.lng]}
                      icon={getWardOfficeIcon(cityConfig)}
                    >
                       <Popup className="municipal-popup">
                        <div className="p-0 font-sora overflow-hidden rounded-xl bg-white shadow-2xl min-w-[280px]">
                           <div className="bg-blue-600 p-4 text-white">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">{cityConfig.org} Ward Office</span>
                                 <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Local Command</span>
                              </div>
                              <h4 className="text-lg font-black tracking-tighter uppercase">{office.wardName}</h4>
                           </div>
                           <div className="p-5 space-y-4">
                              <div className="flex gap-4">
                                 <div className="text-navy/40 font-black text-[9px] uppercase w-20 flex-shrink-0">Ward Code:</div>
                                 <div className="text-navy font-extrabold text-[10px]">{office.wardCode}</div>
                              </div>
                              <div className="flex gap-4">
                                 <div className="text-navy/40 font-black text-[9px] uppercase w-20 flex-shrink-0">Office:</div>
                                 <div className="text-navy font-extrabold text-[10px]">{cityConfig.org} Ward Office</div>
                              </div>
                              <div className="pt-2 border-t border-border flex justify-between items-center">
                                 <span className="text-[8px] font-black text-navy/20 uppercase tracking-[0.2em]">Authentic Grid Node</span>
                                 <Shield size={12} className="text-blue-600" />
                              </div>
                           </div>
                        </div>
                       </Popup>
                    </Marker>
                  ))}
               </LayerGroup>
             </Pane>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {/* Geospatial Legend */}
      <div className="absolute bottom-10 right-10 z-[1000] bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-border min-w-[320px]">
         <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <History size={14} /> Geospatial Intelligence
            </h4>
            <div className="px-2 py-0.5 bg-navy/5 text-navy rounded-full text-[8px] font-black uppercase font-sora">
               {activeCity}
            </div>
         </div>
         <div className="space-y-6">
            <MiniMetric label="Admin Wards Active" val={geoData?.features ? geoData.features.length : "..."} color="text-navy" />
            <MiniMetric label="High Density Alerts" val={Object.values(wardStats).filter(v => v > 5).length} color="text-crimson" />
            <MiniMetric label="Command Signal Nodes" val={tickets.length} color="text-emerald" />
         </div>
         
         <div className="mt-8 pt-8 border-t border-border/50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center">
                  <Zap size={18} className="text-saffron" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-navy uppercase leading-tight">Live Integration</p>
                  <p className="text-[8px] font-bold text-navy/40 uppercase tracking-widest">{cityConfig.org} Satellite Sync Active</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, val, color }) {
   return (
      <div className="flex justify-between items-center">
         <span className="text-xs font-bold text-navy/60 uppercase">{label}</span>
         <span className={`text-2xl font-sora font-black tracking-tighter ${color}`}>{val}</span>
      </div>
   );
}
