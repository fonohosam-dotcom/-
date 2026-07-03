import React, { useEffect, useRef, useState } from "react";
import { Case, MajorProject, User } from "../types";
import { triggerHaptic } from "../utils/haptics";
import { Search, SlidersHorizontal, MapPin, ZoomIn, ZoomOut, Compass, X } from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

interface LibyaInteractiveMapProps {
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
    pinBg: "#f43f5e",
    border: "border-rose-600 text-rose-500",
    color: "#f43f5e",
    labelBg: "bg-rose-50 text-rose-700 border-rose-200"
  },
  "مرتفع": {
    bg: "bg-amber-500",
    pinBg: "#f59e0b",
    border: "border-amber-600 text-amber-500",
    color: "#f59e0b",
    labelBg: "bg-amber-50 text-amber-700 border-amber-200"
  },
  "متوسط": {
    bg: "bg-blue-500",
    pinBg: "#3b82f6",
    border: "border-blue-600 text-blue-500",
    color: "#3b82f6",
    labelBg: "bg-blue-50 text-blue-700 border-blue-200"
  },
  "منخفض": {
    bg: "bg-slate-400",
    pinBg: "#94a3b8",
    border: "border-slate-500 text-slate-400",
    color: "#94a3b8",
    labelBg: "bg-slate-50 text-slate-700 border-slate-200"
  }
};

const defaultCoordinates = { lat: 28.0, lng: 17.0 }; // Center of Libya

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function getCategoryEmoji(needs: string[]) {
  if (needs.includes("غذاء")) return "🍞";
  if (needs.includes("علاج") || needs.includes("أجهزة طبية")) return "🩺";
  if (needs.includes("إيجار")) return "🔑";
  if (needs.includes("ترميم منازل")) return "🏠";
  if (needs.includes("كفالة أيتام")) return "👶";
  return "🤝";
}

function ProjectMarker({ p, lang, isActive, onSelect }: { key?: React.Key, p: MajorProject, lang: string, isActive: boolean, onSelect: () => void }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isAr = lang === "ar";
  
  const lat = 32.7 + (Math.random() - 0.5) * 0.2;
  const lng = 12.4 + (Math.random() - 0.5) * 0.2;
  const position = { lat, lng };

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={position} 
        onClick={onSelect}
        zIndex={isActive ? 1000 : 800}
      >
        <div className="relative flex items-center justify-center group" style={{ width: 40, height: 40 }}>
          <div className={`w-9 h-9 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-base transition-all duration-200 cursor-pointer ${isActive ? 'scale-125 rotate-3' : 'group-hover:scale-110'}`}>
            <span>🏗️</span>
          </div>
          <div className="absolute -bottom-6 bg-slate-900/85 backdrop-blur-sm text-white font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {p.title}
          </div>
        </div>
      </AdvancedMarker>
      
      {isActive && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={() => onSelect()}
          headerDisabled={true}
        >
          <div className="text-right font-sans p-2 space-y-2 max-w-[240px]" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-1.5">
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded font-mono border border-blue-100">مشروع نشط</span>
              <h4 className="font-extrabold text-sm text-slate-800">{p.title}</h4>
              <p className="text-xs text-slate-600">{p.municipality}</p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function CharityMarker({ ch, lang, isActive, onSelect }: { key?: React.Key, ch: User, lang: string, isActive: boolean, onSelect: () => void }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isAr = lang === "ar";
  
  const lat = 32.7 + (Math.random() - 0.5) * 0.3;
  const lng = 12.4 + (Math.random() - 0.5) * 0.3;
  const position = { lat, lng };

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={position} 
        onClick={onSelect}
        zIndex={isActive ? 1000 : 700}
      >
        <div className="relative flex items-center justify-center group" style={{ width: 40, height: 40 }}>
          <div className={`w-9 h-9 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-base transition-all duration-200 cursor-pointer ${isActive ? 'scale-125 rotate-3' : 'group-hover:scale-110'}`}>
            <span>🛡️</span>
          </div>
          <div className="absolute -bottom-6 bg-slate-900/85 backdrop-blur-sm text-white font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {ch.fullName}
          </div>
        </div>
      </AdvancedMarker>
      
      {isActive && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={() => onSelect()}
          headerDisabled={true}
        >
          <div className="text-right font-sans p-2 space-y-2 max-w-[240px]" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-1.5">
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded font-mono border border-amber-100">جمعية معتمدة</span>
              <h4 className="font-extrabold text-sm text-slate-800">{ch.fullName}</h4>
              <p className="text-xs text-slate-600">{ch.municipality || 'ليبيا'}</p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function CaseMarker({ 
  c, 
  lang, 
  isActive, 
  onSelect,
  onDonate 
}: { 
  key?: React.Key, c: Case, 
  lang: string, 
  isActive: boolean, 
  onSelect: () => void,
  onDonate: (id: string) => void
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isAr = lang === "ar";
  
  const lat = c.latitude || (32.7 + (Math.random() - 0.5) * 0.1);
  const lng = c.longitude || (12.4 + (Math.random() - 0.5) * 0.1);
  const position = { lat, lng };

  const isUrgent = c.priorityLevel === "عاجل";
  const config = colorMap[c.priorityLevel] || colorMap["متوسط"];
  const emoji = getCategoryEmoji(c.needTypes);
  
  const progressPercent = Math.min((c.amountCollected / c.amountRequired) * 100, 100);

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={position} 
        onClick={onSelect}
        zIndex={isActive ? 1000 : (isUrgent ? 900 : 1)}
      >
        <div className="relative flex items-center justify-center group" style={{ width: 40, height: 40 }}>
          {isUrgent && <div className={`absolute -inset-2 rounded-full ${config.bg} opacity-25 animate-ping`} style={{ animationDuration: "2s" }}></div>}
          <div className={`w-9 h-9 rounded-full ${config.bg} border-2 border-white shadow-lg flex items-center justify-center text-white text-base transition-all duration-200 cursor-pointer ${isActive ? 'scale-125 rotate-3' : 'group-hover:scale-110'}`}>
            <span>{emoji}</span>
          </div>
          <div className="absolute -bottom-6 bg-slate-900/85 backdrop-blur-sm text-white font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {c.municipality}
          </div>
        </div>
      </AdvancedMarker>
      
      {isActive && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={() => onSelect()} // Pass a toggle logic if needed, or we just let it be handled by active state
          headerDisabled={true}
        >
          <div className="text-right font-sans p-1 space-y-2 max-w-[240px]" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center flex-row-reverse border-b pb-1.5 border-slate-100">
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded font-mono">{c.caseNumber}</span>
                <span className="text-[10px] font-black uppercase tracking-wide text-rose-600 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100">{c.priorityLevel}</span>
              </div>
              
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center justify-end gap-1">
                <span>📍</span>
                <span>البلدية: {c.municipality}</span>
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 text-justify">
                {c.description}
              </p>

              <div className="space-y-1 pt-1.5">
                <div className="flex justify-between text-[9px] text-slate-500 font-mono flex-row-reverse">
                  <span>المطلوب: {c.amountRequired} د.ل</span>
                  <span>المحصل: {c.amountCollected} د.ل</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>
            <button
              onClick={() => onDonate(c.id)}
              className="w-full mt-2.5 bg-[#0F6E56] hover:bg-[#085041] text-white text-xs font-extrabold py-2 px-3 rounded-xl transition-all shadow-sm cursor-pointer text-center block"
            >
              تبرّع عاجل
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapController({ 
  activeCase, 
  filteredCases 
}: { 
  activeCase: Case | null, 
  filteredCases: Case[] 
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    if (activeCase) {
      const lat = activeCase.latitude || 32.7;
      const lng = activeCase.longitude || 12.4;
      map.setCenter({ lat, lng });
      map.setZoom(10);
    } else if (filteredCases.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredCases.forEach(c => {
        bounds.extend({ 
          lat: c.latitude || 32.7 + (Math.random() - 0.5) * 0.1, 
          lng: c.longitude || 12.4 + (Math.random() - 0.5) * 0.1 
        });
      });
      map.fitBounds(bounds, 50);
    } else {
      map.setCenter(defaultCoordinates);
      map.setZoom(5.5);
    }
  }, [map, activeCase, filteredCases]);

  return null;
}

export default function LibyaInteractiveMap({
  cases,
  projects = [],
  charities = [],
  lang,
  onDonateDirect,
  showEmergency = true,
  showProjects = true,
  showCharities = true
}: LibyaInteractiveMapProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedNeed, setSelectedNeed] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [donationModalCase, setDonationModalCase] = useState<{ id: string, amount: string } | null>(null);

  const isAr = lang === "ar";

  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setDonationModalCase({ id: customEvent.detail, amount: "100" });
    };
    window.addEventListener('open-map-donation', handleOpenModal);
    return () => window.removeEventListener('open-map-donation', handleOpenModal);
  }, []);

  const t = {
    title: isAr ? "الخريطة التفاعلية للحالات الإنسانية بليبيا" : "Interactive Libya Humanitarian Map",
    subtitle: isAr ? "تصفح واستكشف مواقع الاحتياجات والبيانات الجغرافية للأسر المستحقة بصدق وشفافية" : "Explore geographic needs and locations of deserving families with full transparency",
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

  const handleSelectCase = (c: Case) => {
    setActiveCase(c === activeCase ? null : c);
  };

  if (!hasValidKey) {
    return (
      <div className="bg-white border border-[#E5E3DA] rounded-3xl flex flex-col items-center justify-center p-8 text-center h-[650px]">
        <div className="max-w-md space-y-4 text-right">
          <h2 className="text-xl font-black text-slate-800">تفعيل خرائط Google مطلوب</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            للتشغيل الصحيح لهذه الخريطة باستخدام Google Maps SDK، يرجى إضافة مفتاح API الخاص بك:
          </p>
          <ul className="text-xs text-slate-600 list-disc list-inside space-y-2 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <li>افتح <strong>الإعدادات (Settings)</strong> من الزاوية العلوية</li>
            <li>اختر <strong>الأسرار (Secrets)</strong></li>
            <li>أضف متغيراً باسم <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            <li>ضع قيمة المفتاح واضغط <strong>Enter</strong></li>
          </ul>
          <p className="text-[10px] text-emerald-600 font-bold">
            سيتم إعادة بناء التطبيق وتحديث الخريطة تلقائياً.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E3DA] rounded-3xl shadow-sm overflow-hidden flex flex-col h-[650px] relative font-sans" id="libya-interactive-gis-map">
      {/* Top Banner / Controls Row */}
      <div className="border-b border-[#E5E3DA] p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F6E56] animate-pulse"></span>
            {t.title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>

        {/* Dynamic Filters Row */}
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
          className={`bg-white border-l border-[#E5E3DA] w-76 flex flex-col justify-between shrink-0 transition-all duration-300 z-10 relative ${
            sidebarOpen ? "translate-x-0" : isAr ? "translate-x-full w-0 overflow-hidden border-none" : "-translate-x-full w-0 overflow-hidden border-none"
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
                        <span>الهدف: {c.amountRequired} د.ل</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 h-full w-full relative z-0">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={defaultCoordinates}
              defaultZoom={5.5}
              mapId="LIBYA_HUMANITARIAN_MAP"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={true}
              gestureHandling="greedy"
            >
              <MapController activeCase={activeCase} filteredCases={filteredCases} />
              {showEmergency && filteredCases.map(c => (
                <CaseMarker 
                  key={c.id} 
                  c={c} 
                  lang={lang} 
                  isActive={activeCase?.id === c.id} 
                  onSelect={() => handleSelectCase(c)}
                  onDonate={(id) => setDonationModalCase({ id, amount: "100" })}
                />
              ))}
              {showProjects && projects.map(p => (
                <ProjectMarker
                  key={p.id}
                  p={p}
                  lang={lang}
                  isActive={false}
                  onSelect={() => {}}
                />
              ))}
              {showCharities && charities.map(ch => (
                <CharityMarker
                  key={ch.id}
                  ch={ch}
                  lang={lang}
                  isActive={false}
                  onSelect={() => {}}
                />
              ))}
            </Map>
          </APIProvider>

          <div className={`absolute bottom-6 ${isAr ? "right-6" : "left-6"} flex flex-col gap-2 z-10`}>
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
              onClick={() => setActiveCase(null)}
              className="bg-white/95 backdrop-blur-sm border border-[#E5E3DA] p-2.5 rounded-2xl shadow-xl text-slate-600 hover:text-[#0F6E56] hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer w-11"
              title={t.recenter}
            >
              <Compass className="w-5 h-5 text-[#0F6E56]" />
            </button>
          </div>
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
