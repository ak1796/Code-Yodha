import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabaseClient";
import { 
  MapContainer, TileLayer, Marker, Popup, 
  LayerGroup, LayersControl, GeoJSON, useMap, Pane
} from "react-leaflet";
import { 
  Shield, History, MapPin, Zap, Filter, 
  AlertTriangle, Users2, Phone, Activity, ChevronDown, Mail
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { citiesConfig } from "../../assets/data/citiesConfig";
import { getEstimatedPopulation } from "../../assets/data/populationMapping";

const normalizeWardValue = (value) => {
  if (value === null || value === undefined) return "";
  // Stringify, trim, lowercase
  let s = String(value).trim().toLowerCase();
  // Remove "ward" prefix if exists (handle spaces and dashes)
  s = s.replace(/^ward\s*[- ]*/, "");
  // Pull just the first token to catch "A (Colaba)" or "A123" if needed, 
  // but be careful with "F/N". Let's handle special slash cases.
  if (s.includes('/')) return s; // Keep F/N, G/S as is
  return s.split(/[ \((]/)[0];
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

// Use citiesConfig.offices (real verified coordinates) instead of GeoJSON centroids
const getWardOfficePoints = (cityConfig) => {
  if (!cityConfig?.offices) return [];
  return Object.entries(cityConfig.offices).map(([zoneName, details]) => ({
    key: zoneName,
    wardCode: zoneName,
    wardName: `${cityConfig.org} — ${zoneName}`,
    lat: details.lat,
    lng: details.lng,
    address: details.address,
    phone: details.phone,
    commissioner: details.commissioner,
  }));
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
    priority >= 4 ? 'bg-[#F87171]' : priority >= 2 ? 'bg-[#FACC15]' : 'bg-[#10B981]'
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
  const [viewMode, setViewMode] = useState("density"); // "density" or "silent-crisis"

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

  const maxCount = useMemo(() => {
    const values = Object.values(wardStats);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [wardStats]);

  const filteredTickets = useMemo(() => {
    if (categoryFilter === "all") return tickets;
    return tickets.filter(t => t.category === categoryFilter);
  }, [tickets, categoryFilter]);

  // UNIFIED HIGH FIDELITY STYLING
  const getWardStyle = (feature) => {
    const { wardId } = getWardIdentity(feature, cityConfig);
    const wardName = feature.properties[cityConfig.nameProp];

    const isSelected = !!(selectedWard && selectedWard === wardId);

    // Blue highlight for selected ward (takes priority)
    if (isSelected) {
      return {
        fillColor: '#2563EB',
        fillOpacity: 0.45,
        color: '#1D4ED8',
        weight: 4,
        opacity: 1,
        stroke: true
      };
    }

    if (viewMode === 'silent-crisis') {
      const population = getEstimatedPopulation(activeCity, wardName);
      const count = wardStats[wardId] || 0;
      const ratio = population / (count + 1);
      const isAtRisk = ratio > 3000;
      const riskOpacity = Math.min(0.75, ratio / 8000);
      return {
        fillColor: isAtRisk ? '#EF4444' : '#10B981',
        fillOpacity: isAtRisk ? riskOpacity : 0.25,
        color: isAtRisk ? '#DC2626' : '#059669',
        weight: 2,
        opacity: 0.8,
        stroke: true
      };
    }

    // Density mode: Green → Yellow → Red based on relative intensity
    const count = wardStats[wardId] || 0;
    const intensity = maxCount > 0 ? (count / maxCount) : 0;

    let fillColor, borderColor;
    if (count === 0) {
      fillColor = '#10B981'; borderColor = '#059669'; // Green — no complaints
    } else if (intensity <= 0.33) {
      fillColor = '#FDE047'; borderColor = '#EAB308'; // Light Yellow — low relative density
    } else if (intensity <= 0.66) {
      fillColor = '#FACC15'; borderColor = '#CA8A04'; // Bright Yellow — moderate density
    } else {
      fillColor = '#F87171'; borderColor = '#EF4444'; // Soft Red — high relative density
    }

    return {
      fillColor,
      fillOpacity: count === 0 ? 0.15 : 0.35,
      color: borderColor,
      weight: 2,
      opacity: 0.8,
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
        if (wardId) setSelectedWard(normalizeWardValue(wardId));
        L.DomEvent.stopPropagation(e);
      }
    });

    const count = wardStats[normalizeWardValue(wardId)] || wardStats[wardId] || 0;
    const population = getEstimatedPopulation(activeCity, wardDisplayName);
    const ratio = Math.round(population / (count + 1));

    // Match office from citiesConfig — try "Ward X" key format first, then direct key
    const officeKey = Object.keys(cityConfig.offices || {}).find(k =>
      normalizeWardValue(k) === normalizeWardValue(`Ward ${wardId}`) ||
      normalizeWardValue(k) === normalizeWardValue(wardId)
    );
    const office = officeKey ? cityConfig.offices[officeKey] : null;

    const statusColor = count === 0 ? '#10B981' : count <= 3 ? '#F59E0B' : count <= 8 ? '#F97316' : '#EF4444';
    const statusLabel = count === 0 ? 'All Clear' : count <= 3 ? 'Low Activity' : count <= 8 ? 'Moderate' : 'High Density';

    layer.bindPopup(`
      <div style="font-family: 'Sora', sans-serif; min-width: 280px; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 20px 40px rgba(0,0,0,0.12);">
        
        <div style="background: ${cityConfig.color}; padding: 14px 16px; color: white;">
          <p style="font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.6; margin: 0 0 4px 0;">${cityConfig.org} Ward Intelligence</p>
          <h4 style="font-size: 15px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -0.02em;">${officeKey || wardDisplayName}</h4>
          ${office ? `<p style="font-size: 9px; font-weight: 600; opacity: 0.75; margin: 3px 0 0 0;">📍 ${office.address}</p>` : ''}
        </div>

        <div style="background: white; padding: 14px 16px;">

          ${office ? `
          <div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 14px;">📞</span>
              <div>
                <div style="font-size: 7px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Phone</div>
                <div style="font-size: 11px; font-weight: 800; color: ${cityConfig.color};">${office.phone}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 14px;">👤</span>
              <div>
                <div style="font-size: 7px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Asst. Commissioner</div>
                <div style="font-size: 11px; font-weight: 800; color: #1e293b;">${office.commissioner}</div>
              </div>
            </div>
          </div>` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="background: #f8fafc; padding: 10px; border-radius: 10px; text-align: center;">
              <div style="font-size: 7px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Signals</div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a;">${count}</div>
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 10px; text-align: center;">
              <div style="font-size: 7px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Pop. Est.</div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a;">${(population / 1000).toFixed(1)}k</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase;">Status</span>
            <span style="font-size: 9px; font-weight: 900; color: ${statusColor}; background: ${statusColor}18; padding: 3px 8px; border-radius: 999px;">● ${statusLabel}</span>
          </div>
          <div style="width: 100%; height: 5px; background: #f1f5f9; border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${Math.min(100, count * 10)}%; background: ${statusColor}; border-radius: 999px; transition: width 0.4s ease;"></div>
          </div>

        </div>
      </div>
    `, { className: 'premium-ward-popup', maxWidth: 320 });
  };

  // Use real office coordinates from citiesConfig.offices
  const wardOfficePoints = useMemo(
    () => getWardOfficePoints(cityConfig),
    [cityConfig]
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
            <div className="flex bg-bg rounded-2xl p-1 gap-1 border border-border">
               <button 
                  onClick={() => setViewMode('density')}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'density' ? 'bg-navy text-white shadow-lg' : 'text-navy/40 hover:bg-white'}`}
               >
                  {t('Density')}
               </button>
               <button 
                  onClick={() => setViewMode('silent-crisis')}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'silent-crisis' ? 'bg-crimson text-white shadow-lg shadow-crimson/20' : 'text-navy/40 hover:bg-white'}`}
               >
                  {t('SilentCrisis')}
               </button>
            </div>

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
                key={`${activeCity}-${maxCount}-${selectedWard}`} // Force re-render on data load
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
                           <div className="grid grid-cols-1 gap-2 border-t border-border pt-4">
                              <div className="flex justify-between items-center">
                                 <p className="text-[8px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Department</p>
                                 <p className="text-[10px] font-extrabold text-navy uppercase">{t.category}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                 <p className="text-[8px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Source</p>
                                 {t.source === 'EMAIL' ? (
                                   <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                                     <Mail size={8} /> EMAIL SUBMISSION
                                   </span>
                                 ) : (
                                   <p className="text-[10px] font-extrabold text-navy uppercase">WEB PORTAL</p>
                                 )}
                              </div>
                              <div className="flex justify-between items-center">
                                 <p className="text-[8px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Priority</p>
                                 <p className="text-[10px] font-extrabold text-navy">NODE P{t.priority_score}</p>
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
                           <div style={{ background: cityConfig.color }} className="p-4 text-white">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">{cityConfig.org} Zonal Office</span>
                                 <Shield size={12} className="opacity-60" />
                              </div>
                              <h4 className="text-lg font-black tracking-tighter uppercase">{office.wardName}</h4>
                           </div>
                           <div className="p-5 space-y-3">
                              <div className="flex gap-3 items-start">
                                 <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                 <div className="text-navy font-semibold text-[10px] leading-relaxed">{office.address}</div>
                              </div>
                              <div className="flex gap-3 items-center">
                                 <Phone size={13} className="text-gray-400 flex-shrink-0" />
                                 <div className="text-navy font-extrabold text-[10px]">{office.phone}</div>
                              </div>
                              <div className="flex gap-3 items-center border-t border-gray-100 pt-3">
                                 <Users2 size={13} className="text-gray-400 flex-shrink-0" />
                                 <div>
                                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Asst. Commissioner</div>
                                    <div className="text-navy font-extrabold text-[10px]">{office.commissioner}</div>
                                 </div>
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
