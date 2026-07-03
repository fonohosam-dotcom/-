import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CaseMiniMapProps {
  latitude?: number;
  longitude?: number;
  municipality: string;
}

export default function CaseMiniMap({ latitude, longitude, municipality }: CaseMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Apply a stable mathematical offset to coordinates to preserve family privacy (approx 600m)
    const baseLat = latitude || 32.8872;
    const baseLng = longitude || 13.1913;
    
    // Stable pseudo-random offset based on the coordinate values so it doesn't jump on re-renders
    const offsetLat = Math.sin(baseLat * 1000) * 0.005;
    const offsetLng = Math.cos(baseLng * 1000) * 0.005;
    
    const approxLat = baseLat + offsetLat;
    const approxLng = baseLng + offsetLng;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [approxLat, approxLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
      }).addTo(mapRef.current);

      // Draw a translucent circle to represent the obfuscated region
      L.circle([approxLat, approxLng], {
        color: "#10B981", // emerald-500
        fillColor: "#10B981",
        fillOpacity: 0.12,
        radius: 600, // 600 meters
        weight: 1.5,
        dashArray: "3, 4"
      }).addTo(mapRef.current);

      // Add marker representing approximate location
      const customHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2.5 rounded-full bg-emerald-500 opacity-20 animate-ping" style="animation-duration: 3s"></div>
          <div class="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
            📍
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: customHtml,
        className: "custom-leaflet-div-icon-mini",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([approxLat, approxLng], { icon: markerIcon }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([approxLat, approxLng], 13);
    }

    // Force recalculating sizes for correct initialization inside tabs or expanded states
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="space-y-1.5 text-right animate-fade-in mt-3 pt-3 border-t border-dashed border-slate-100">
      <div 
        ref={mapContainerRef} 
        className="w-full h-32 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner relative"
        style={{ zIndex: 10 }}
      />
      <div className="flex justify-between items-center flex-row-reverse text-[9px] text-gray-400 font-bold px-1 gap-2">
        <span className="truncate">📍 بلدية {municipality} (نطاق تقريبي)</span>
        <span className="text-emerald-600 whitespace-nowrap">🛡️ خصوصية الأسرة محميّة (تشويش تلقائي)</span>
      </div>
    </div>
  );
}
