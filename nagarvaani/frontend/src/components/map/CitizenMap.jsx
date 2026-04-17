import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { citiesConfig } from '../../assets/data/citiesConfig';
import { getEstimatedPopulation } from '../../assets/data/populationMapping';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle2, Activity } from 'lucide-react';

/**
 * Groups tickets that are within ~100m of each other into clusters.
 * Returns an array of { lat, lng, tickets[] } clusters.
 */
function clusterTickets(tickets, radiusDeg = 0.001) {
  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < tickets.length; i++) {
    if (visited.has(i)) continue;
    const t = tickets[i];
    if (!t.lat || !t.lng) continue;

    const cluster = [t];
    visited.add(i);

    for (let j = i + 1; j < tickets.length; j++) {
      if (visited.has(j)) continue;
      const other = tickets[j];
      if (!other.lat || !other.lng) continue;
      const dLat = Math.abs(t.lat - other.lat);
      const dLng = Math.abs(t.lng - other.lng);
      if (dLat <= radiusDeg && dLng <= radiusDeg) {
        cluster.push(other);
        visited.add(j);
      }
    }

    clusters.push({ lat: t.lat, lng: t.lng, tickets: cluster });
  }

  return clusters;
}

/** Returns a DivIcon that shows the complaint count on the pin */
const getClusterIcon = (count, status) => {
  const isResolved = status === 'resolved';
  const bg = isResolved ? '#10B981' : count >= 3 ? '#EF4444' : '#F59E0B';
  const glow = isResolved ? 'rgba(16,185,129,0.4)' : count >= 3 ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)';
  const size = count > 1 ? 24 : 16;
  
  // Tactical Pulsating Animation for Active Nodes
  const animation = !isResolved ? 'animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : '';
  const innerPulse = !isResolved ? `
    <div style="
      position:absolute; inset:-4px; border-radius:50%; background:${bg}; opacity:0.3;
      animation: pulse-ring 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    "></div>
  ` : '';

  return new L.DivIcon({
    className: 'custom-cluster-icon',
    html: `
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        ${innerPulse}
        <div style="
          background:${bg};
          width:${size}px; height:${size}px;
          border-radius:50%;
          border:2px solid white;
          box-shadow:0 0 15px ${glow};
          display:flex; align-items:center; justify-content:center;
          color:white; font-size:10px; font-weight:900;
          position:relative; z-index:10;
          ${animation}
        ">
          ${count > 1 ? count : ''}
        </div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function CitizenMap({ tickets = [], currentUserId }) {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [geoData, setGeoData] = useState(null);
  const [silenceZones, setSilenceZones] = useState([]);
  const [officerNames, setOfficerNames] = useState({}); // { officer_id: full_name }
  const [wardAatsScores, setWardAatsScores] = useState({}); // { normWard: 0-100 }
  const config = citiesConfig[selectedCity];

  // Load GeoJSON boundaries
  useEffect(() => {
    import(/* @vite-ignore */ `../../assets/data/${config.filename}`)
      .then(m => setGeoData(m.default))
      .catch(err => console.error("GeoJSON load failed:", err));
  }, [selectedCity, config.filename]);

  // Fetch officer names for any assigned_officer_ids in tickets
  useEffect(() => {
    const ids = [...new Set(tickets.map(t => t.assigned_officer_id).filter(Boolean))];
    if (ids.length === 0) return;

    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach(p => { map[p.id] = p.full_name; });
          setOfficerNames(map);
        }
      });
  }, [tickets]);

  const normalizeWard = (v) => {
    if (!v) return "";
    let s = String(v).trim().toLowerCase();
    s = s.replace(/^ward\s*[- ]*/, "");
    if (s.includes('/')) return s;
    return s.split(/[ \((]/)[0];
  };

  // â”€â”€ Compute per-ward AATS trust scores from already-loaded tickets â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!geoData || tickets.length === 0) return;
    const scores = {};
    geoData.features.forEach(feature => {
      const wardName = feature.properties[config.nameProp];
      const normWard = normalizeWard(wardName);
      const wardTickets = tickets.filter(t => normalizeWard(t.ward) === normWard);
      if (wardTickets.length === 0) return;
      const resolved = wardTickets.filter(t => t.status === 'resolved').length;
      const slaOk = wardTickets.filter(t =>
        t.status === 'resolved' &&
        t.sla_deadline &&
        new Date(t.updated_at) < new Date(t.sla_deadline)
      ).length;
      // AATS formula (mirrors aatsService.js): resolution 40% + sla 30% + base 30%
      const resRate = resolved / wardTickets.length;
      const slaRate = resolved > 0 ? slaOk / resolved : 0;
      const aats = Math.round(resRate * 40 + slaRate * 30 + 30); // base 30 when data present
      scores[normWard] = Math.min(100, aats);
    });
    setWardAatsScores(scores);
  }, [geoData, tickets, selectedCity, config.nameProp]);

  // â”€â”€ Silent crisis zones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!geoData) return;
    const zones = geoData.features.map(feature => {
      const wardName = feature.properties[config.nameProp];
      const normWard = normalizeWard(wardName);
      const wardTickets = tickets.filter(t => normalizeWard(t.ward) === normWard).length;
      const population = getEstimatedPopulation(selectedCity, wardName);
      const silenceRatio = population / (wardTickets + 1);
      return { name: wardName, normWard, isSilent: silenceRatio > 3000, ratio: silenceRatio };
    });
    setSilenceZones(zones);
  }, [geoData, tickets, selectedCity, config.nameProp]);

  // â”€â”€ Ward choropleth: priority = AATS score, fallback = silence detection â”€
  const getAatsColor = (score) => {
    if (score >= 70) return '#10B981'; // green  — high trust
    if (score >= 40) return '#F59E0B'; // amber  — medium trust
    return '#EF4444';                  // red    — low trust
  };

  const getWardStyle = (feature) => {
    const wardName = feature.properties[config.nameProp];
    const normWard = normalizeWard(wardName);
    const zone = silenceZones.find(z => z.name === wardName);
    const aats = wardAatsScores[normWard];

    // Silent crisis takes visual precedence (grey override)
    if (zone?.isSilent) {
      return { fillColor: '#4B5563', fillOpacity: 0.45, color: '#374151', weight: 2, opacity: 0.7 };
    }
    // AATS-driven colour if we have ward data
    if (aats !== undefined) {
      return { fillColor: getAatsColor(aats), fillOpacity: 0.28, color: '#007AFF', weight: 1.5, opacity: 0.6 };
    }
    // No data yet — neutral outline
    return { fillColor: 'transparent', fillOpacity: 0, color: '#007AFF', weight: 2, opacity: 0.6 };
  };

  // Cluster tickets by proximity
  const cityTickets = useMemo(
    () => tickets.filter(t => t.city === selectedCity && t.lat && t.lng),
    [tickets, selectedCity]
  );
  const clusters = useMemo(() => clusterTickets(cityTickets), [cityTickets]);

  return (
    <div className="relative w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-border shadow-2xl bg-surface group">

      {/* City Selector */}
      <div className="absolute top-4 right-4 z-[400] flex flex-wrap justify-end gap-2 max-w-[calc(100%-2rem)]">
        {Object.keys(citiesConfig).map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md ${selectedCity === city ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'bg-white/80 backdrop-blur-md text-navy/60 hover:bg-white'}`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-10 left-10 z-[400] bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-border shadow-soft space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy opacity-30 italic mb-2">{t('TransparencyLegend')}</h4>
        {/* Complaint pin legend */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-crimson" />
          <span className="text-[10px] font-extrabold uppercase text-navy">{t('ActiveIssues')}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald" />
          <span className="text-[10px] font-extrabold uppercase text-navy">{t('Resolved')}</span>
        </div>
        {/* AATS ward-level trust legend */}
        <div className="border-t border-border pt-3 mt-1 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-navy opacity-40">AATS Ward Trust</p>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#10B981', opacity: 0.7 }} />
            <span className="text-[10px] font-extrabold uppercase text-navy">High ≥ 70</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#F59E0B', opacity: 0.7 }} />
            <span className="text-[10px] font-extrabold uppercase text-navy">Medium 40—69</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#EF4444', opacity: 0.7 }} />
            <span className="text-[10px] font-extrabold uppercase text-navy">Low &lt;40</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-md bg-gray-500 opacity-40" />
            <span className="text-[10px] font-extrabold uppercase text-navy">{t('SilentCrises')}</span>
          </div>
        </div>
      </div>

      <MapContainer
        key={`citizen-map-${selectedCity}-${tickets.length}`}
        center={config.center}
        zoom={11}
        className="w-full h-full z-10"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapController center={config.center} />

        {geoData && (
          <GeoJSON
            data={geoData}
            style={getWardStyle}
            onEachFeature={(feature, layer) => {
              const wardName = feature.properties[config.nameProp];
              const normWard = normalizeWard(wardName);
              const zone = silenceZones.find(z => z.name === wardName);
              const pop = getEstimatedPopulation(selectedCity, wardName);
              const aats = wardAatsScores[normWard];
              const aatsColor = aats !== undefined
                ? aats >= 70 ? '#10B981' : aats >= 40 ? '#F59E0B' : '#EF4444'
                : '#9CA3AF';
              const aatsLabel = aats !== undefined
                ? `<span style="color:${aatsColor};font-weight:900">${aats} / 100</span>`
                : '<span style="color:#9CA3AF">No data</span>';
              layer.bindPopup(`
                <div class="p-2">
                  <h3 class="font-black uppercase text-xs text-navy tracking-tight">${t('Ward')} ${wardName}</h3>
                  <div class="mt-2 space-y-1">
                    <p class="text-[9px] font-bold text-text-secondary uppercase">${t('PopEst')}: <b>${pop.toLocaleString()}</b></p>
                    <p class="text-[9px] font-bold text-text-secondary uppercase">AATS Trust Score: ${aatsLabel}</p>
                    ${zone?.isSilent ? `<p class="text-[9px] font-black text-crimson uppercase italic mt-2 animate-pulse">${t('UnderReported')}</p>` : ''}
                  </div>
                </div>
              `);
            }}
          />
        )}

        {/* Clustered Complaint Markers */}
        {clusters.map((cluster, idx) => {
          const count = cluster.tickets.length;
          const representative = cluster.tickets[0];
          const isResolved = cluster.tickets.every(t => t.status === 'resolved');
          const officerName = officerNames[representative.assigned_officer_id];
          const isUserIncluded = cluster.tickets.some(t => t.creator_id === currentUserId);
          const statusColor = isResolved ? '#10B981' : '#EF4444';
          const statusLabel = isResolved ? t('Resolved') : t('InProgress');

          const youText = isUserIncluded
            ? `You and ${count - 1} other${count - 1 !== 1 ? 's' : ''} have`
            : `${count} citizen${count !== 1 ? 's' : ''} have`;

          return (
            <Marker
              key={idx}
              position={[cluster.lat, cluster.lng]}
              icon={getClusterIcon(count, isResolved ? 'resolved' : 'active')}
            >
              <Popup className="citizen-complaint-popup" maxWidth={300}>
                <div style={{
                  fontFamily: "'Sora', sans-serif",
                  minWidth: '260px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.10)'
                }}>
                  {/* Header */}
                  <div style={{ background: '#0f172a', padding: '12px 16px', color: 'white' }}>
                    <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, margin: '0 0 3px 0' }}>
                      {representative.category}
                    </p>
                    <h4 style={{ fontSize: '13px', fontWeight: 900, margin: 0, lineHeight: 1.3 }}>
                      {representative.title || t('CivicComplaint')}
                    </h4>
                  </div>

                  {/* Body */}
                  <div style={{ background: 'white', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* People reported */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '10px', padding: '8px 10px' }}>
                      <span style={{ fontSize: '18px' }}>👥</span>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          <span style={{ color: isUserIncluded ? '#2563EB' : '#0f172a' }}>{youText}</span> reported this
                        </p>
                        <p style={{ fontSize: '9px', color: '#9ca3af', margin: 0, marginTop: '1px' }}>Complaints aggregated at this location</p>
                      </div>
                    </div>

                    {/* Officer assigned */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '10px', padding: '8px 10px' }}>
                      <span style={{ fontSize: '18px' }}>ðŸ›¡ï¸</span>
                      <div>
                        <p style={{ fontSize: '9px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Escalated To</p>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {officerName ? officerName : 'Pending Assignment'}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' }}>Status</span>
                      <span style={{
                        fontSize: '9px', fontWeight: 900, color: statusColor,
                        background: `${statusColor}18`, padding: '2px 8px', borderRadius: '999px'
                      }}>â— {statusLabel}</span>
                    </div>

                    {/* Ward */}
                    {representative.ward && (
                      <p style={{ fontSize: '9px', color: '#9ca3af', margin: 0, textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                        ðŸ“ Ward {representative.ward}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
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