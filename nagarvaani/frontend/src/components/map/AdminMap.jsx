import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { citiesConfig } from '../../assets/data/citiesConfig.js';

// Premium Municipal Building Icon (Inline SVG) dynamically generated
const getOrgIconHtml = (org, color) => `
  <div style="
    background: white;
    border: 3px solid ${color};
    border-radius: 14px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 15px -3px ${color}40;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
    color: ${color};
    transform-origin: center;
    transition: all 0.3s ease;
  ">
    ${org}
  </div>`;

const BMC_ICON_HTML = `
  <div style="
    background: white;
    border: 3px solid #1e3a8a;
    border-radius: 14px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);
    cursor: pointer;
    transform-origin: center;
    transition: all 0.3s ease;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 22V10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12"></path>
      <path d="M2 10l10-8 10 8"></path>
      <path d="M9 22H15"></path>
      <path d="M12 22V18"></path>
    </svg>
  </div>`;

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export default function AdminMap({ complaints }) {
  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const bmcMarkersRef = useRef([]);
  const poiLayerRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [selectedWard, setSelectedWard] = useState(null);
  const [geoData, setGeoData] = useState(null);

  const cityData = citiesConfig[selectedCity];

  // Dynamic import of GeoJSON based on selected city
  useEffect(() => {
    const loadData = async () => {
      try {
        const file = cityData.filename;
        const module = await import(`../../assets/data/${file}`);
        setGeoData(module.default || module);
      } catch (e) {
        console.error("Failed to load geojson for", selectedCity, e);
      }
    };
    loadData();
  }, [selectedCity]);

  useEffect(() => {
    if (!mapRef.current) {
      // Use premium CartoDB Light basemap for professional look
      mapRef.current = L.map('admin-heatmap', { zoomControl: false }).setView(cityData.center, 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    
    // Update map view when center changes
    map.setView(cityData.center, 11);

    // Clean up
    if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);
    bmcMarkersRef.current.forEach(m => map.removeLayer(m));
    bmcMarkersRef.current = [];

    // Only draw boundary when geoData is fully loaded
    if (geoData) {
      geoJsonLayerRef.current = L.geoJSON(geoData, {
        style: (feature) => {
          const name = feature.properties.name || feature.properties.WARD_NAME || feature.properties.WARD_NO;
          const isSelected = selectedWard === name;
          if (isSelected) return { color: cityData.color, weight: 4, fillOpacity: 0.5, fillColor: cityData.color };
          
          const hash = (name || '').length % 3;
          const color = hash === 0 ? '#ef4444' : hash === 1 ? '#f59e0b' : '#10b981';
          return { color, weight: 2, fillOpacity: 0.15, fillColor: color };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.name || feature.properties.WARD_NAME || feature.properties.WARD_NO;
          layer.on({
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setSelectedWard(name);
            },
            mouseover: () => layer.setStyle({ fillOpacity: 0.3, weight: 3 }),
            mouseout: () => {
              if (selectedWard !== name) layer.setStyle({ fillOpacity: 0.15, weight: 2 });
            }
          });
        }
      }).addTo(map);
    }

    // 2. Premium "Box Data" Markers
    Object.entries(cityData.offices).forEach(([ward, details]) => {
      const bmcIcon = L.divIcon({
        className: 'marker-pulse',
        html: getOrgIconHtml(cityData.org, cityData.color),
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -25]
      });

      const popupHtml = `
        <div style="padding: 16px; min-width: 320px; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #f3f4f6;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px;">
            <div style="background: ${cityData.color}20; padding: 8px; border-radius: 10px; color: ${cityData.color};">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12"></path><path d="M2 10l10-8 10 8"></path><path d="M9 22H15"></path><path d="M12 22V18"></path></svg>
            </div>
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: ${cityData.color}; margin: 0;">${cityData.org} HQ - ${ward}</h3>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
                <span style="font-size: 10px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em;">Operational Hive</span>
              </div>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; gap: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <div style="font-size: 11px; font-weight: 500; color: #4b5563; line-height: 1.5;">${details.address}</div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 $2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <div style="font-size: 12px; font-weight: 700; color: ${cityData.color};">${details.phone}</div>
            </div>
            
            <div style="background: #f9fafb; padding: 10px; border-radius: 12px; border: 1px dashed #e5e7eb; display: flex; align-items: center; gap: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${cityData.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <div>
                <div style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.1em; line-height: 1;">Asst. Commissioner</div>
                <div style="font-size: 12px; font-weight: 700; color: ${cityData.color}; margin-top: 2px;">${details.commissioner}</div>
              </div>
            </div>
          </div>
          
          <button style="width: 100%; margin-top: 16px; background: ${cityData.color}; color: white; padding: 10px; border-radius: 12px; border: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            Issue Ward Directive
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </button>
        </div>
      `;

      const marker = L.marker([details.lat, details.lng], { icon: bmcIcon })
        .bindPopup(popupHtml, {
          closeButton: false,
          padding: [0, 0],
          className: 'premium-marker-popup'
        })
        .addTo(map);

      bmcMarkersRef.current.push(marker);
    });

  }, [complaints, selectedWard, geoData, cityData]);

  const fetchPOIs = async () => {
    const query = `[out:json][timeout:25];(node["amenity"~"school|hospital"](18.89,72.75,19.40,73.05););out body 30;`;
    try {
      const response = await fetch(OVERPASS_URL, { method: 'POST', body: query });
      const data = await response.json();
      if (poiLayerRef.current) mapRef.current.removeLayer(poiLayerRef.current);
      const markers = data.elements.map(el => {
        const icon = L.divIcon({
          className: 'poi-marker',
          html: `<div style="background: white; border-radius: 50%; padding: 4px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">${el.tags.amenity === 'school' ? '🏫' : '🏥'}</div>`,
          iconSize: [24, 24]
        });
        return L.marker([el.lat, el.lon], { icon }).bindPopup(`<b style="font-weight:700; color:#1e3a8a;">${el.tags.name || el.tags.amenity}</b>`);
      });
      poiLayerRef.current = L.layerGroup(markers).addTo(mapRef.current);
    } catch (err) {
      console.error("Overpass POI fetch failed", err);
    }
  };

  return (
    <div className="w-full h-full relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
      {/* City Switcher Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white flex flex-col gap-2 pointer-events-auto">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Select Region</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(citiesConfig).map(city => (
            <button
              key={city}
              onClick={() => {
                setSelectedCity(city);
                setSelectedWard(null);
                setGeoData(null);
              }}
              style={{
                backgroundColor: selectedCity === city ? citiesConfig[city].color : '#f3f4f6',
                color: selectedCity === city ? 'white' : '#4b5563'
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
      <div id="admin-heatmap" className="w-full h-full" />
    </div>
  );
}
