import React, { useEffect, useRef, useState } from "react";
import { Case, MajorProject, User } from "../types";
import { triggerHaptic } from "../utils/haptics";
import { Search, SlidersHorizontal, MapPin, ZoomIn, ZoomOut, Compass, X, Flame } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.heat";

interface LibyaLeafletMapProps {
  cases: Case[];
  projects?: MajorProject[];
  charities?: User[];
  lang: "ar" | "en" | "zh" | "fr" | "ru";
  onDonateDirect: (caseId: string, amount: number) => void;
  showEmergency?: boolean;
  showProjects?: boolean;
  showCharities?: boolean;
}

const colorMap: any = {
  "عاجل": {
    bg: "bg-rose-500",
    border: "border-rose-600 text-rose-500",
    labelBg: "bg-rose-50 text-rose-700 border-rose-200"
  },
  "مرتفع": {
    bg: "bg-amber-500",
    border: "border-amber-600 text-amber-500",
    labelBg: "bg-amber-50 text-amber-700 border-amber-200"
  },
  "متوسط": {
    bg: "bg-blue-500",
    border: "border-blue-600 text-blue-500",
    labelBg: "bg-blue-50 text-blue-700 border-blue-200"
  },
  "منخفض": {
    bg: "bg-slate-400",
    border: "border-slate-500 text-slate-400",
    labelBg: "bg-slate-50 text-slate-700 border-slate-200"
  }
};

const defaultCoordinates = { lat: 28.0, lng: 17.0 };

function getCategoryEmoji(needs: string[]) {
  if (needs.includes("غذاء")) return "🍞";
  if (needs.includes("علاج") || needs.includes("أجهزة طبية")) return "🩺";
  if (needs.includes("إيجار")) return "🔑";
  if (needs.includes("ترميم منازل")) return "🏠";
  if (needs.includes("كفالة أيتام")) return "👶";
  return "🤝";
}

export default function LibyaLeafletMap({
  cases,
  projects = [],
  charities = [],
  lang,
  onDonateDirect,
  showEmergency = true,
  showProjects = true,
  showCharities = true
}: LibyaLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const clusterGroupRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedNeed, setSelectedNeed] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [donationModalCase, setDonationModalCase] = useState<{ id: string, amount: string } | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  const isAr = lang === "ar";

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        
        setMapDimensions({ width, height });
        
        if (mapRef.current) {
          // If size is 0, don't invalidate size yet, or remove heat layer first
          if (width === 0 || height === 0) {
            if (heatLayerRef.current && mapRef.current.hasLayer(heatLayerRef.current)) {
              mapRef.current.removeLayer(heatLayerRef.current);
            }
          }
          mapRef.current.invalidateSize();
        }
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setDonationModalCase({ id: customEvent.detail, amount: "100" });
    };
    window.addEventListener('open-map-donation', handleOpenModal);
    return () => window.removeEventListener('open-map-donation', handleOpenModal);
  }, []);

  const t = {
    title: isAr ? "الخريطة التفاعلية (المفتوحة)" : "Interactive Map (OpenSource)",
    subtitle: isAr ? "عرض المواقع والمساعدات باستخدام OpenStreetMap" : "View locations & aids using OpenStreetMap",
    searchPlaceholder: isAr ? "البحث بالبلدية أو رقم الحالة..." : "Search by municipality or case number...",
    allUrgency: isAr ? "جميع الأولويات" : "All Priorities",
    allNeeds: isAr ? "جميع الاحتياجات" : "All Needs",
    filterTitle: isAr ? "تصفية الخريطة" : "Map Filtering",
    emptyList: isAr ? "لا توجد حالات تطابق عوامل التصفية" : "No cases match filters",
    showSidebar: isAr ? "عرض القائمة" : "Show List",
    hideSidebar: isAr ? "إخفاء القائمة" : "Hide List",
    recenter: isAr ? "إعادة تركيز الخريطة" : "Recenter Map",
  };

  const allNeedsList = Array.from(new Set(cases.flatMap(c => c.needTypes)));

  const filteredCases = cases.filter((c) => {
    const isPublished = c.status === "published" || c.status === "submitted" || c.status === "committee_approved";
    if (!isPublished) return false;

    const matchesSearch = 
      c.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUrgency = selectedUrgency === "all" || c.priorityLevel === selectedUrgency;
    const matchesNeed = selectedNeed === "all" || c.needTypes.includes(selectedNeed);

    return matchesSearch && matchesUrgency && matchesNeed;
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        trackResize: false,
        attributionControl: false
      }).setView([defaultCoordinates.lat, defaultCoordinates.lng], 5.5);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }
    
    clusterGroupRef.current = (L as any).markerClusterGroup({
      disableClusteringAtZoom: 12,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    (Object.values(markersRef.current) as L.Marker[]).forEach((m) => m.remove());
    markersRef.current = {};

    const heatPoints: [number, number, number][] = [];

    if (showEmergency) {
      filteredCases.forEach((c) => {
        const lat = c.latitude || (32.7 + (Math.random() - 0.5) * 0.1);
        const lng = c.longitude || (12.4 + (Math.random() - 0.5) * 0.1);

        // Add to heat map points
        // We can weigh urgency or amount required if desired
        const weight = c.priorityLevel === "عاجل" ? 1.0 : 0.5;
        heatPoints.push([lat, lng, weight]);

        const isUrgent = c.priorityLevel === "عاجل";
        const config = colorMap[c.priorityLevel] || colorMap["متوسط"];
        const emoji = getCategoryEmoji(c.needTypes);

        const markerHtml = `
          <div class="relative flex items-center justify-center group" style="width: 40px; height: 40px;">
            ${isUrgent ? `<div class="absolute -inset-2 rounded-full ${config.bg} opacity-25 animate-ping" style="animation-duration: 2s;"></div>` : ''}
            <div class="w-9 h-9 rounded-full ${config.bg} border-2 border-white shadow-lg flex items-center justify-center text-white text-base transition-all duration-200 cursor-pointer hover:scale-110">
              <span>${emoji}</span>
            </div>
            <div class="absolute -bottom-6 bg-slate-900/85 backdrop-blur-sm text-white font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              ${c.municipality}
            </div>
          </div>
        `;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-div-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        const popupContent = document.createElement("div");
        popupContent.className = "text-right font-sans p-1 space-y-2 max-w-[240px]";
        popupContent.dir = isAr ? "rtl" : "ltr";
        
        const progressPercent = Math.min((c.amountCollected / c.amountRequired) * 100, 100);

        popupContent.innerHTML = `
          <div class="space-y-1.5">
            <div class="flex justify-between items-center flex-row-reverse border-b pb-1.5 border-slate-100">
              <span class="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded font-mono">${c.caseNumber}</span>
              <span class="text-[10px] font-black uppercase tracking-wide text-rose-600 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100">${c.priorityLevel}</span>
            </div>
            <h4 class="font-extrabold text-sm text-slate-800 flex items-center justify-end gap-1">
              <span>📍</span>
              <span>البلدية: ${c.municipality}</span>
            </h4>
            <p class="text-xs text-slate-600 leading-relaxed line-clamp-3 text-justify">
              ${c.description}
            </p>
            <div class="space-y-1 pt-1.5">
              <div class="flex justify-between text-[9px] text-slate-500 font-mono flex-row-reverse">
                <span>المطلوب: ${c.amountRequired} د.ل</span>
                <span>المحصل: ${c.amountCollected} د.ل</span>
              </div>
              <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" style="width: ${progressPercent}%"></div>
              </div>
            </div>
          </div>
        `;

        const actionBtn = document.createElement("button");
        actionBtn.className = "w-full mt-2.5 bg-[#0F6E56] hover:bg-[#085041] text-white text-xs font-extrabold py-2 px-3 rounded-xl transition-all shadow-sm cursor-pointer text-center block";
        actionBtn.innerText = "تبرّع عاجل";
        actionBtn.onclick = () => {
          const event = new CustomEvent('open-map-donation', { detail: c.id });
          window.dispatchEvent(event);
        };
        popupContent.appendChild(actionBtn);

        const marker = L.marker([lat, lng], { icon: markerIcon })
          .bindPopup(popupContent, {
            closeButton: true,
            className: "custom-leaflet-popup",
            maxWidth: 280
          });

        clusterGroupRef.current.addLayer(marker);

        marker.on("click", () => {
          setActiveCase(c);
        });

        markersRef.current[c.id] = marker;
      });
    }

    if (showProjects) {
      projects.forEach((p) => {
        const lat = 32.7 + (Math.random() - 0.5) * 0.2;
        const lng = 12.4 + (Math.random() - 0.5) * 0.2;

        heatPoints.push([lat, lng, 0.8]);

        const markerHtml = `
          <div class="relative flex items-center justify-center group" style="width: 40px; height: 40px;">
            <div class="w-9 h-9 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-base transition-all duration-200 cursor-pointer hover:scale-110">
              <span>🏗️</span>
            </div>
            <div class="absolute -bottom-6 bg-slate-900/85 backdrop-blur-sm text-white font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              ${p.title}
            </div>
          </div>
        `;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-div-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        const popupContent = document.createElement("div");
        popupContent.className = "text-right font-sans p-2 space-y-2 max-w-[240px]";
        popupContent.dir = isAr ? "rtl" : "ltr";
        popupContent.innerHTML = `
          <div class="space-y-1.5">
            <span class="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded font-mono border border-blue-100">مشروع نشط</span>
            <h4 class="font-extrabold text-sm text-slate-800">${p.title}</h4>
            <p class="text-xs text-slate-600">${p.municipality}</p>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(popupContent, {
          closeButton: true,
          className: "custom-leaflet-popup",
          maxWidth: 280
        });

        clusterGroupRef.current.addLayer(marker);
        markersRef.current[p.id] = marker;
      });
    }

    if (showCharities) {
      charities.forEach((ch) => {
        const lat = 32.7 + (Math.random() - 0.5) * 0.3;
        const lng = 12.4 + (Math.random() - 0.5) * 0.3;

        heatPoints.push([lat, lng, 0.4]);

        const markerHtml = `
          <div class="relative flex items-center justify-center group" style="width: 40px; height: 40px;">
            <div class="w-9 h-9 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-base transition-all duration-200 cursor-pointer hover:scale-110">
              <span>🛡️</span>
            </div>
            <div class="absolute -bottom-6 bg-slate-900/85 backdrop-blur-sm text-white font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              ${ch.fullName}
            </div>
          </div>
        `;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-div-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        const popupContent = document.createElement("div");
        popupContent.className = "text-right font-sans p-2 space-y-2 max-w-[240px]";
        popupContent.dir = isAr ? "rtl" : "ltr";
        popupContent.innerHTML = `
          <div class="space-y-1.5">
            <span class="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded font-mono border border-amber-100">جمعية معتمدة</span>
            <h4 class="font-extrabold text-sm text-slate-800">${ch.fullName}</h4>
            <p class="text-xs text-slate-600">${ch.municipality || 'ليبيا'}</p>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(popupContent, {
          closeButton: true,
          className: "custom-leaflet-popup",
          maxWidth: 280
        });

        clusterGroupRef.current.addLayer(marker);
        markersRef.current[ch.id] = marker;
      });
    }

    if (heatmapMode && (L as any).heatLayer) {
      if (mapDimensions.width > 0 && mapDimensions.height > 0) {
        heatLayerRef.current = (L as any).heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: {
            0.4: '#10b981', // emerald-500
            0.6: '#f59e0b', // amber-500
            0.8: '#ef4444', // red-500
            1.0: '#9f1239'  // rose-800
          }
        }).addTo(map);
      }
    } else {
      map.addLayer(clusterGroupRef.current);
    }

    if (filteredCases.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current) as L.Marker[]);
      if (Object.keys(markersRef.current).length > 0) {
        map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 9 });
      }
    } else {
      map.setView([defaultCoordinates.lat, defaultCoordinates.lng], 5.5);
    }

  }, [filteredCases.length, isAr, heatmapMode, showEmergency, showProjects, showCharities, projects, charities, mapDimensions.width, mapDimensions.height]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleSelectCase = (c: Case) => {
    setActiveCase(c === activeCase ? null : c);
    if (mapRef.current) {
      const lat = c.latitude || 32.7;
      const lng = c.longitude || 12.4;
      mapRef.current.setView([lat, lng], 10);
      const marker = markersRef.current[c.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="bg-white border border-[#E5E3DA] rounded-3xl shadow-sm overflow-hidden flex flex-col h-[650px] relative font-sans">
      <div className="border-b border-[#E5E3DA] p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            {t.title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 pl-3 py-1.5 bg-white border border-[#E5E3DA] rounded-xl text-xs w-52 focus:outline-none focus:border-[#0F6E56] text-right"
              dir="rtl"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="border border-[#E5E3DA] rounded-xl py-1.5 px-3 bg-white focus:outline-none focus:border-[#0F6E56] text-xs cursor-pointer"
          >
            <option value="all">{t.allUrgency}</option>
            <option value="عاجل">{isAr ? "🔴 عاجل جداً" : "🔴 Urgent"}</option>
            <option value="مرتفع">{isAr ? "🟡 مرتفع" : "🟡 High"}</option>
            <option value="متوسط">{isAr ? "🔵 متوسط" : "🔵 Medium"}</option>
            <option value="منخفض">{isAr ? "⚪ منخفض" : "⚪ Low"}</option>
          </select>

          <select
            value={selectedNeed}
            onChange={(e) => setSelectedNeed(e.target.value)}
            className="border border-[#E5E3DA] rounded-xl py-1.5 px-3 bg-white focus:outline-none focus:border-[#0F6E56] text-xs cursor-pointer"
          >
            <option value="all">{t.allNeeds}</option>
            {allNeedsList.map((need) => (
              <option key={need} value={need}>{need}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div 
          className={`bg-white border-[#E5E3DA] flex flex-col justify-between shrink-0 transition-all duration-300 z-10 relative ${
            sidebarOpen ? "w-[300px] border-l translate-x-0" : "w-0 overflow-hidden border-none"
          }`}
          style={{ order: isAr ? 1 : 0 }}
        >
          <div className="p-3 border-b border-slate-100 flex items-center justify-between flex-row-reverse bg-slate-50/30">
            <span className="font-extrabold text-xs text-slate-700 flex items-center gap-1">
              <span>📋</span> {isAr ? `الحالات المتاحة (${filteredCases.length})` : `Cases Found (${filteredCases.length})`}
            </span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar text-right">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                {t.emptyList}
              </div>
            ) : (
              filteredCases.map((c) => {
                const isActive = activeCase?.id === c.id;
                const config = colorMap[c.priorityLevel] || colorMap["متوسط"];
                const emoji = getCategoryEmoji(c.needTypes);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-xs space-y-2 ${
                      isActive 
                        ? "bg-[#E1F5EE]/40 border-[#0F6E56] shadow-sm scale-[0.99]" 
                        : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="font-mono text-[10px] text-slate-400">{c.caseNumber}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${config.labelBg} border`}>
                        {c.priorityLevel}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 flex items-center justify-end gap-1">
                        <span>{emoji}</span>
                        <span>بلدية {c.municipality}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
                        {c.description}
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100/60">
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.amountCollected / c.amountRequired) * 100}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mt-1 flex-row-reverse">
                        <span className="text-[#0F6E56] font-bold">{c.amountCollected} د.ل</span>
                        <span>الهدف: ${c.amountRequired} د.ل</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 h-full w-full relative z-0">
          <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>

          <div className={`absolute bottom-6 ${isAr ? "right-6" : "left-6"} flex flex-col gap-2 z-10`}>
            <div className="bg-white/95 backdrop-blur-sm border border-[#E5E3DA] rounded-2xl shadow-xl flex flex-col overflow-hidden">
              <button onClick={handleZoomIn} className="p-2.5 text-slate-600 hover:text-[#0F6E56] hover:bg-slate-50 transition-colors border-b border-[#E5E3DA]">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button onClick={handleZoomOut} className="p-2.5 text-slate-600 hover:text-[#0F6E56] hover:bg-slate-50 transition-colors">
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={() => {
                setHeatmapMode(!heatmapMode);
                triggerHaptic(50);
              }}
              className={`bg-white/95 backdrop-blur-sm border p-2.5 rounded-2xl shadow-xl transition-colors flex items-center justify-center cursor-pointer w-11 ${
                heatmapMode 
                  ? "border-rose-200 text-rose-500 bg-rose-50" 
                  : "border-[#E5E3DA] text-slate-600 hover:text-rose-500 hover:bg-slate-50"
              }`}
              title={isAr ? "التحليل الحراري" : "Heatmap"}
            >
              <Flame className="w-5 h-5" />
            </button>

            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t.showSidebar}</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveCase(null);
                if (mapRef.current) {
                  mapRef.current.setView([defaultCoordinates.lat, defaultCoordinates.lng], 5.5);
                }
              }}
              className="bg-white/95 backdrop-blur-sm border border-[#E5E3DA] p-2.5 rounded-2xl shadow-xl text-slate-600 hover:text-[#0F6E56] hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer w-11"
              title={t.recenter}
            >
              <Compass className="w-5 h-5 text-[#0F6E56]" />
            </button>
          </div>

          <style>{`
            .custom-leaflet-popup .leaflet-popup-content-wrapper {
              border-radius: 1rem;
              padding: 0;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
            }
            .custom-leaflet-popup .leaflet-popup-content {
              margin: 12px;
            }
            .custom-leaflet-popup .leaflet-popup-close-button {
              color: #94a3b8 !important;
              top: 8px !important;
              right: ${isAr ? 'auto' : '8px'} !important;
              left: ${isAr ? '8px' : 'auto'} !important;
            }
            .custom-leaflet-popup .leaflet-popup-close-button:hover {
              color: #0f172a !important;
              background: transparent !important;
            }
            .custom-leaflet-div-icon {
              background: transparent;
              border: none;
            }
            
            /* Customizing Leaflet MarkerCluster */
            .marker-cluster-small,
            .marker-cluster-medium,
            .marker-cluster-large {
              background-color: rgba(15, 110, 86, 0.6) !important;
            }
            .marker-cluster-small div,
            .marker-cluster-medium div,
            .marker-cluster-large div {
              background-color: rgba(15, 110, 86, 0.9) !important;
              color: white !important;
              font-family: inherit;
              font-weight: 800;
              border-radius: 50%;
            }
          `}</style>
        </div>

        {donationModalCase && (
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setDonationModalCase(null)}
          >
            <div 
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full relative" 
              dir={isAr ? "rtl" : "ltr"}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800">{isAr ? "تبرع مباشر للحالة" : "Direct Donation"}</h3>
                <button 
                  onClick={() => setDonationModalCase(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                {isAr ? "أدخل قيمة التبرع للحالة المحددة بالدينار الليبي:" : "Enter donation amount in LYD:"}
              </p>
              <div className="flex items-center gap-2 mb-6">
                <input
                  type="number"
                  min="1"
                  value={donationModalCase.amount}
                  onChange={(e) => setDonationModalCase({ ...donationModalCase, amount: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                  placeholder="100"
                />
                <span className="font-bold text-slate-400">{isAr ? "د.ل" : "LYD"}</span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(50);
                  const amt = parseFloat(donationModalCase.amount);
                  if (!isNaN(amt) && amt > 0) {
                    onDonateDirect(donationModalCase.id, amt);
                    setDonationModalCase(null);
                  }
                }}
                className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {isAr ? "تأكيد التبرع" : "Confirm Donation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
