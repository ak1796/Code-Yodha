import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function MapComponent({ center, complaints = [], zoom = 13 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center || [19.0760, 72.8777], zoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Update center if it changes
    if (center) {
      map.setView(center, zoom);
    }

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Add main center marker
    if (center) {
       const mainMarker = L.marker(center).addTo(map);
       mainMarker.bindPopup("<b>Primary Incident Site</b>").openPopup();
       markersRef.current.push(mainMarker);
    }

    // Add clusters (individual complaints that merged into this master)
    complaints.forEach((c, idx) => {
      if (c.lat && c.lng) {
        const marker = L.circleMarker([c.lat, c.lng], {
          radius: 8,
          fillColor: "#001F3F",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.6
        }).addTo(map);
        
        marker.bindPopup(`Node ${idx + 1}: ${c.raw_text?.substring(0, 50)}...`);
        markersRef.current.push(marker);
      }
    });

  }, [center, complaints, zoom]);

  return (
    <div ref={mapRef} className="w-full h-full" style={{ background: '#f8f9fa' }} />
  );
}
