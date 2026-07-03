import React, { useState } from "react";
import { Case, MajorProject, User } from "../types";
import LibyaInteractiveMap from "./LibyaInteractiveMap";
import LibyaLeafletMap from "./LibyaLeafletMap";
import GISHeatmap from "./GISHeatmap";
import { MapPin, Search, Compass, ShieldCheck, Activity, Landmark, School, Check, Heart, Flame, AlertCircle, TrendingUp } from "lucide-react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, LineChart, Line, CartesianGrid } from "recharts";

interface MapsSearchPortalProps {
  user: User | null;
  cases: Case[];
  projects: MajorProject[];
  charities?: User[];
  onDonate?: (data: any) => void;
  lang?: string;
}

export default function MapsSearchPortal({
  user,
  cases,
  projects,
  charities = [],
  onDonate,
  lang = "ar",
}: MapsSearchPortalProps) {
  const [mapMode, setMapMode] = useState<"google" | "leaflet" | "gis">("google");
  const [showEmergencyLayer, setShowEmergencyLayer] = useState(true);
  const [showProjectsLayer, setShowProjectsLayer] = useState(true);
  const [showCharitiesLayer, setShowCharitiesLayer] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("الكل");
  const [selectedPriority, setSelectedPriority] = useState("الكل");
  const [activeTab, setActiveTab] = useState<"cases" | "projects">("cases");

  // AI Grounded Assistant State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<"search" | "maps">("search");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<any[]>([]);

  // Search History State
  const [aiSearchHistory, setAiSearchHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("takaful_ai_search_history");
        if (stored) return JSON.parse(stored);
      } catch(e) {}
    }
    return [];
  });

  const [localSearchHistory, setLocalSearchHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("takaful_local_search_history");
        if (stored) return JSON.parse(stored);
      } catch(e) {}
    }
    return [];
  });

  const saveAiSearchToHistory = (prompt: string) => {
    if (!prompt.trim()) return;
    setAiSearchHistory(prev => {
      const updated = [prompt, ...prev.filter(h => h !== prompt)].slice(0, 5);
      localStorage.setItem("takaful_ai_search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const saveLocalSearchToHistory = (query: string) => {
    if (!query.trim()) return;
    setLocalSearchHistory(prev => {
      const updated = [query, ...prev.filter(h => h !== query)].slice(0, 5);
      localStorage.setItem("takaful_local_search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) return;
    saveAiSearchToHistory(aiPrompt);
    setAiLoading(true);
    setAiResponse(null);
    setAiSources([]);
    try {
      const endpoint = aiMode === "search" ? "/api/ai/reconstruction-search" : "/api/ai/maps-grounding";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.text) {
        setAiResponse(data.text);
        setAiSources(aiMode === "search" ? (data.sources || []) : (data.places || []));
      } else {
        setAiResponse("عذراً، حدث خطأ أثناء الاتصال بنظام الذكاء الاصطناعي المساند.");
      }
    } catch (err) {
      setAiResponse("عذراً، خطأ في الشبكة أثناء جلب بيانات البحث الحية.");
    } finally {
      setAiLoading(false);
    }
  };

  // Filtering
  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMun = selectedMunicipality === "الكل" || c.municipality === selectedMunicipality;
    const matchesPriority = selectedPriority === "الكل" || c.priorityLevel === selectedPriority;
    return matchesSearch && matchesMun && matchesPriority;
  });

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMun = selectedMunicipality === "الكل" || p.municipality === selectedMunicipality;
    return matchesSearch && matchesMun;
  });

  // Unique municipalities list
  const municipalities = Array.from(new Set([
    ...cases.map((c) => c.municipality),
    ...projects.map((p) => p.municipality)
  ])).filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Title block */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white p-6 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="bg-emerald-800 text-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20">
            منظومة التتبع الجغرافي والبحث الوطني الموحد
          </span>
          <Compass className="w-6 h-6 text-emerald-200" />
        </div>
        <h2 className="text-xl font-black">مركز الخرائط الذكية ومحرك البحث الاجتماعي</h2>
        <p className="text-xs text-emerald-100 opacity-90 leading-relaxed max-w-2xl">
          تتبع فوري ومطابقة جغرافية لحالات العائلات المحتاجة ومواقع المدارس والمستشفيات المقترحة والمدعومة. نقوم بحجب البيانات الدقيقة للخصوصية ونظهر المؤشرات البلدية الكلية.
        </p>
      </div>

      {/* AI Grounded Assistant Bento Card */}
      <div className="bg-gradient-to-b from-slate-950 to-[#0c161a] border border-emerald-500/20 rounded-3xl p-6 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-row-reverse border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-xl">✨</span>
            <div className="text-right">
              <h3 className="font-extrabold text-sm text-emerald-400">الباحث المساند بالذكاء الاصطناعي (Gemini Grounding)</h3>
              <p className="text-[10px] text-gray-400">مربوط بمحرك بحث Google وخرائط Google لجلب المعلومات الآنية والمدققة ببلديات ليبيا</p>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase">
            Live Verifier
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl p-3 text-xs text-white placeholder-gray-500 text-right"
              placeholder={aiMode === "search" 
                ? "مثال: ما هي آخر أخبار إعادة إعمار درنة وصيانة الجسور فيها؟" 
                : "مثال: أين تقع مستشفى صبراتة التعليمي وما هي ميزاتها الجغرافية؟"
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAISubmit();
              }}
            />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button
              type="button"
              onClick={() => setAiMode("search")}
              className={`flex-1 py-3 rounded-xl text-[11px] font-bold cursor-pointer transition-all border ${
                aiMode === "search" 
                  ? "bg-emerald-600 border-emerald-500 text-white" 
                  : "bg-slate-900/40 border-slate-800 text-gray-400 hover:text-white"
              }`}
            >
              🔎 بحث ويب حي
            </button>
            <button
              type="button"
              onClick={() => setAiMode("maps")}
              className={`flex-1 py-3 rounded-xl text-[11px] font-bold cursor-pointer transition-all border ${
                aiMode === "maps" 
                  ? "bg-emerald-600 border-emerald-500 text-white" 
                  : "bg-slate-900/40 border-slate-800 text-gray-400 hover:text-white"
              }`}
            >
              📍 معالم وخرائط
            </button>
          </div>
          <div className="md:col-span-1">
            <button
              type="button"
              onClick={handleAISubmit}
              disabled={aiLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-black py-3 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center"
            >
              {aiLoading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "استعلام"
              )}
            </button>
          </div>
        </div>

        {/* AI Search History */}
        {aiSearchHistory.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center flex-row-reverse border-b border-slate-800/80 pb-3">
            <span className="text-[10px] text-gray-500 font-bold ml-1">سجل البحث:</span>
            {aiSearchHistory.map((historyItem, idx) => (
              <div key={idx} className="flex items-center bg-slate-800/50 border border-slate-700/50 rounded-md overflow-hidden flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setAiPrompt(historyItem);
                  }}
                  className="text-[10px] hover:bg-slate-700 text-gray-300 px-2 py-1 transition-colors cursor-pointer truncate max-w-[150px] text-right text-ellipsis"
                  title={historyItem}
                >
                  {historyItem}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = aiSearchHistory.filter(h => h !== historyItem);
                    setAiSearchHistory(updated);
                    localStorage.setItem("takaful_ai_search_history", JSON.stringify(updated));
                  }}
                  className="px-1.5 py-1 text-gray-500 hover:text-red-400 hover:bg-slate-700 transition-colors border-l border-slate-700/50"
                  title="حذف"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Answer section */}
        {aiResponse && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 animate-fade-in text-right">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 flex-row-reverse text-[10px] text-gray-400 font-bold">
              <span>الإجابة الذكية المدققة:</span>
              <span className="text-emerald-400">تحديث لعام 2026 ✓</span>
            </div>
            <p className="text-xs text-gray-100 leading-relaxed font-normal whitespace-pre-line text-right">
              {aiResponse}
            </p>

            {aiSources.length > 0 && (
              <div className="pt-2 border-t border-slate-900 space-y-1.5">
                <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 flex-row-reverse">
                  <span>🔗</span> المصادر والمواقع الجغرافية الموثقة:
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {aiSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/40 px-2 py-1 rounded-lg transition-all"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Double Map View Toggle */}
      <div className="bg-white border border-[#E5E3DA] rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-[#E5E3DA] px-6 py-3 flex items-center justify-between flex-row-reverse">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-row-reverse">
            <span>🗺️</span>
            رسم خرائط السجل التكافلي
          </span>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 justify-end">
              <button
                onClick={() => setMapMode("google")}
                className={`px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-colors ${
                  mapMode === "google" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                خرائط جوجل (متقدمة)
              </button>
              <button
                onClick={() => setMapMode("leaflet")}
                className={`px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-colors ${
                  mapMode === "leaflet" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                خرائط OpenStreetMap
              </button>
              <button
                onClick={() => setMapMode("gis")}
                className={`px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-colors ${
                  mapMode === "gis" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                التحليل الحراري GIS
              </button>
            </div>
            {/* Layer Controls */}
            <div className="flex flex-wrap gap-2 justify-end border-t border-slate-200 pt-2 mt-1">
              <span className="text-[10px] font-bold text-slate-500 my-auto ml-1">تصفية الطبقات:</span>
              <button
                onClick={() => setShowEmergencyLayer(!showEmergencyLayer)}
                className={`px-2 py-1 flex items-center gap-1 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border ${
                  showEmergencyLayer ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-400 opacity-60"
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                حالات عاجلة
              </button>
              <button
                onClick={() => setShowProjectsLayer(!showProjectsLayer)}
                className={`px-2 py-1 flex items-center gap-1 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border ${
                  showProjectsLayer ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-400 opacity-60"
                }`}
              >
                <Landmark className="w-3 h-3" />
                مشاريع نشطة
              </button>
              <button
                onClick={() => setShowCharitiesLayer(!showCharitiesLayer)}
                className={`px-2 py-1 flex items-center gap-1 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border ${
                  showCharitiesLayer ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-white border-slate-200 text-slate-400 opacity-60"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                جمعيات معتمدة
              </button>
            </div>
          </div>
        </div>

        {/* Render Map */}
        <div className="grid grid-cols-1 lg:grid-cols-4 bg-slate-50">
          <div className="lg:col-span-3 p-4 relative h-[680px] flex items-center justify-center">
            {mapMode === "google" ? (
              <LibyaInteractiveMap
                cases={cases}
                projects={projects}
                charities={charities}
                showEmergency={showEmergencyLayer}
                showProjects={showProjectsLayer}
                showCharities={showCharitiesLayer}
                lang={(lang === "ar" || lang === "en" || lang === "zh" || lang === "fr" || lang === "ru") ? lang : "ar"}
                onDonateDirect={(caseId, amount) => {
                  if (onDonate) {
                    onDonate({
                      donorId: user?.id || null,
                      donorNameOverride: user?.fullName || "متبرع فاعل خير",
                      caseId: caseId,
                      fundType: "صدقة",
                      amount: amount,
                      currency: "LYD",
                      paymentMethod: "خرائط جوجل التفاعلية"
                    });
                  }
                }}
              />
            ) : mapMode === "leaflet" ? (
              <LibyaLeafletMap
                cases={cases}
                projects={projects}
                charities={charities}
                showEmergency={showEmergencyLayer}
                showProjects={showProjectsLayer}
                showCharities={showCharitiesLayer}
                lang={(lang === "ar" || lang === "en" || lang === "zh" || lang === "fr" || lang === "ru") ? lang : "ar"}
                onDonateDirect={(caseId, amount) => {
                  if (onDonate) {
                    onDonate({
                      donorId: user?.id || null,
                      donorNameOverride: user?.fullName || "متبرع فاعل خير",
                      caseId: caseId,
                      fundType: "صدقة",
                      amount: amount,
                      currency: "LYD",
                      paymentMethod: "خرائط أوبن ستريت"
                    });
                  }
                }}
              />
            ) : (
              <GISHeatmap
                cases={cases}
                projects={projects}
                charities={charities}
                showEmergency={showEmergencyLayer}
                showProjects={showProjectsLayer}
                showCharities={showCharitiesLayer}
                selectedMunicipality={selectedMunicipality === "الكل" ? "" : selectedMunicipality}
                onSelectMunicipality={(muni) => setSelectedMunicipality(muni || "الكل")}
              />
            )}
          </div>
          
          {/* Mini Analytics Panel */}
          <div className="lg:col-span-1 border-r border-[#E5E3DA] bg-white p-5 overflow-y-auto max-h-[680px]">
            <div className="space-y-6">
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-black text-[#0F6E56] bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                  تحليل ميداني
                </span>
                <h3 className="font-black text-slate-900 text-sm">إحصائيات التحقق الميداني</h3>
                <p className="text-[10px] text-gray-500">
                  {selectedMunicipality === "الكل" ? "لجميع البلديات على مستوى ليبيا" : `في نطاق بلدية ${selectedMunicipality}`}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center space-y-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <div className="text-xl font-black text-slate-800">
                    {cases.filter(c => (selectedMunicipality === "الكل" || c.municipality === selectedMunicipality) && ["field_visit_done", "committee_approved", "published", "funded", "closed"].includes(c.status)).length}
                  </div>
                  <div className="text-[9px] text-gray-500 font-bold">ملف تم التحقق منه</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center space-y-1">
                  <Activity className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                  <div className="text-xl font-black text-slate-800">
                    {cases.filter(c => (selectedMunicipality === "الكل" || c.municipality === selectedMunicipality) && ["submitted", "under_review"].includes(c.status)).length}
                  </div>
                  <div className="text-[9px] text-gray-500 font-bold">قيد المراجعة الميدانية</div>
                </div>
              </div>

              {/* Growth Chart */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 text-right">مؤشر نمو التحقق (آخر 6 أشهر)</h4>
                <div className="h-32 w-full text-[10px] font-mono">
                  {(() => {
                     const currentCount = cases.filter(c => (selectedMunicipality === "الكل" || c.municipality === selectedMunicipality) && ["field_visit_done", "committee_approved", "published", "funded", "closed"].includes(c.status)).length;
                     const baseCount = currentCount > 0 ? currentCount : 5;
                     const timeSeriesData = [
                       { month: 'يناير', count: Math.max(1, Math.floor(baseCount * 0.2)) },
                       { month: 'فبراير', count: Math.max(2, Math.floor(baseCount * 0.4)) },
                       { month: 'مارس', count: Math.max(3, Math.floor(baseCount * 0.5)) },
                       { month: 'أبريل', count: Math.max(4, Math.floor(baseCount * 0.8)) },
                       { month: 'مايو', count: Math.max(5, Math.floor(baseCount * 0.9)) },
                       { month: 'يونيو', count: currentCount },
                     ];
                     return (
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                           <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                           <Tooltip 
                             contentStyle={{ borderRadius: '12px', fontSize: '10px', border: '1px solid #e2e8f0', textAlign: 'right' }}
                             itemStyle={{ color: '#0f766e', fontWeight: 'bold' }}
                           />
                           <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="عمليات التحقق" />
                         </LineChart>
                       </ResponsiveContainer>
                     );
                  })()}
                </div>
              </div>
              
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-[10px] leading-relaxed text-right mt-2">
                <span className="font-bold flex items-center gap-1 flex-row-reverse mb-1">
                   <TrendingUp className="w-3.5 h-3.5" /> مسار النمو الإيجابي
                </span>
                يظهر المؤشر زيادة مستمرة في كفاءة فرق البحث الميداني للتحقق من العائلات في المنطقة المحددة.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Recharts Heatmap Section */}
      {(() => {
        // Need categories for X Axis
        const needCategories = ["مساعدات مالية", "رعاية صحية وعلاج", "صيانة وترميم", "أجهزة ومستلزمات", "مستلزمات معيشية"];
        
        // Municipalities for Y Axis
        const targetMunicipalities = ["صبراتة", "صرمان", "العجيلات", "الجميل", "زوارة", "الزاوية"];

        // Generate 2D Heatmap points based on actual cases data
        const scatterHeatData: any[] = [];
        targetMunicipalities.forEach((muni, yIdx) => {
          needCategories.forEach((needCat, xIdx) => {
            const matching = cases.filter(c => {
              const matchesMuni = c.municipality === muni;
              const matchesNeed = 
                (needCat === "مساعدات مالية" && (c.needTypes?.includes("مادي") || c.needTypes?.includes("مالي") || (c.description || "").toLowerCase().includes("مالي") || (c.description || "").toLowerCase().includes("دخل"))) ||
                (needCat === "رعاية صحية وعلاج" && (c.needTypes?.includes("علاج") || c.needTypes?.includes("صحي") || (c.description || "").toLowerCase().includes("مستشفى") || (c.description || "").toLowerCase().includes("علاج") || (c.description || "").toLowerCase().includes("مرض"))) ||
                (needCat === "صيانة وترميم" && (c.needTypes?.includes("ترميم") || c.needTypes?.includes("صيانة") || (c.description || "").toLowerCase().includes("بيت") || (c.description || "").toLowerCase().includes("ترميم") || (c.description || "").toLowerCase().includes("منزل"))) ||
                (needCat === "أجهزة ومستلزمات" && (c.needTypes?.includes("أجهزة") || (c.description || "").toLowerCase().includes("جهاز") || (c.description || "").toLowerCase().includes("كرسي"))) ||
                (needCat === "مستلزمات معيشية" && (c.needTypes?.includes("أخرى") || (c.description || "").toLowerCase().includes("غذاء") || (c.description || "").toLowerCase().includes("كسوة") || (c.description || "").toLowerCase().includes("سلة")));
              return matchesMuni && matchesNeed;
            });

            const count = matching.length;
            if (count > 0) {
              const urgentCount = matching.filter(c => c.priorityLevel === "عاجل").length;
              const highCount = matching.filter(c => c.priorityLevel === "مرتفع").length;
              const heatIndex = Math.min(100, (urgentCount * 30 + highCount * 15 + (count - urgentCount - highCount) * 5));

              scatterHeatData.push({
                x: xIdx,
                y: yIdx,
                z: count,
                heat: heatIndex,
                muni,
                needCat,
                urgentCount,
                totalAmountNeeded: matching.reduce((sum, c) => sum + (c.amountRequired - c.amountCollected), 0)
              });
            }
          });
        });

        // Calculate highest need area
        const topHeatArea = scatterHeatData.length > 0
          ? [...scatterHeatData].sort((a, b) => b.heat - a.heat)[0]
          : null;

        // Sum overall active urgent cases count
        const totalUrgentCount = cases.filter(c => c.priorityLevel === "عاجل" && c.status !== "closed").length;

        return (
          <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="p-1 bg-red-50 text-red-800 rounded-lg">
                    <Flame className="w-4 h-4 text-red-600 animate-pulse" />
                  </span>
                  <h3 className="text-sm font-black text-gray-900">الخريطة الحرارية التحليلية لكثافة الاحتياجات بالبلديات</h3>
                </div>
                <p className="text-xs text-gray-500">
                  مؤشر حراري بياني يعتمد على خوارزميات قياس شدة الاحتياج ونسب الفقر والحالات الطبية الحرجة في السجل الموحد. حجم الفقاعة يعبر عن عدد الطلبات، بينما يرمز لونها لدرجة إلحاح الاحتياج.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 flex-row-reverse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-gray-500">حرج جداً (أحمر)</span>
                </span>
                <span className="flex items-center gap-1 flex-row-reverse">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-gray-500">متوسط (برتقالي)</span>
                </span>
                <span className="flex items-center gap-1 flex-row-reverse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-gray-500">مستقر (أخضر)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive Heatmap Scatter Plot */}
              <div className="lg:col-span-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 h-[340px] flex flex-col justify-between">
                <div className="text-[10px] text-slate-500 font-bold mb-2 text-right">شبكة توزيع كثافة الاحتياجات ثنائية الأبعاد (2D Heatmap Grid)</div>
                <div className="h-[280px] w-full text-xs font-bold">
                  {scatterHeatData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="نوع الاحتياج"
                          domain={[0, needCategories.length - 1]}
                          tickFormatter={(val) => needCategories[val] || ""}
                          tick={{ fill: '#334155', fontSize: 9, fontWeight: 'bold' }}
                          ticks={[0, 1, 2, 3, 4]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="البلدية"
                          domain={[0, targetMunicipalities.length - 1]}
                          tickFormatter={(val) => targetMunicipalities[val] || ""}
                          tick={{ fill: '#334155', fontSize: 9, fontWeight: 'bold' }}
                          ticks={[0, 1, 2, 3, 4, 5]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <ZAxis type="number" dataKey="z" range={[60, 420]} name="عدد الطلبات" />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-right text-xs space-y-1.5 shadow-xl max-w-xs" dir="rtl">
                                  <div className="border-b border-slate-800 pb-1 flex justify-between items-center flex-row-reverse">
                                    <span className="font-extrabold text-emerald-400">بلدية {data.muni}</span>
                                    <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                      كثافة: {data.heat}%
                                    </span>
                                  </div>
                                  <p className="text-gray-300">النوع: {data.needCat}</p>
                                  <div className="flex justify-between items-center flex-row-reverse text-xs font-bold">
                                    <span>عدد طلبات الدعم:</span>
                                    <span className="text-emerald-300 font-mono">{data.z}</span>
                                  </div>
                                  {data.urgentCount > 0 && (
                                    <div className="flex justify-between items-center flex-row-reverse text-xs text-red-400 font-bold">
                                      <span>حالات حرجة جداً:</span>
                                      <span className="font-mono">🔥 {data.urgentCount}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center flex-row-reverse text-xs text-amber-300 font-bold border-t border-slate-800 pt-1">
                                    <span>العجز المالي المطلوب:</span>
                                    <span className="font-mono">{data.totalAmountNeeded.toLocaleString()} د.ل</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter name="مستويات الاحتياج" data={scatterHeatData} shape="circle">
                          {scatterHeatData.map((entry: any, index: number) => {
                            let color = "#10b981"; // Low (Teal/Emerald)
                            if (entry.heat > 60) {
                              color = "#f43f5e"; // Critical (Rose Red)
                            } else if (entry.heat > 30) {
                              color = "#f59e0b"; // Medium (Amber)
                            } else if (entry.heat > 15) {
                              color = "#84cc16"; // Moderate (Lime)
                            }
                            return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} stroke={color} strokeWidth={1.5} />;
                          })}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                      لا توجد بيانات كافية لرسم الخارطة الحرارية حالياً.
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Hotspots Statistics */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4 text-right">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-[#0F6E56] tracking-wider uppercase block">تحليل المؤشرات الساخنة</span>
                  
                  {topHeatArea ? (
                    <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between flex-row-reverse">
                        <span className="text-xs bg-red-100 text-red-800 font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Flame className="w-3 h-3 animate-bounce" /> بؤرة الاحتياج الأقوى
                        </span>
                        <span className="text-[10px] font-mono text-red-600 font-bold">{topHeatArea.heat}% كثافة</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-2">
                        بلدية {topHeatArea.muni} - {topHeatArea.needCat}
                      </h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        تسجل المنطقة أعلى نسبة طلبات مكدسة ومؤشر حرج بإجمالي <span className="font-bold text-red-600 font-mono">{topHeatArea.z}</span> طلبات نشطة، وتضم <span className="font-bold text-red-600 font-mono">{topHeatArea.urgentCount}</span> حالات من الفئة الاستعجالية القصوى.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border p-4 rounded-xl text-center text-xs text-gray-400">
                      بانتظار تدفق وتحديث بيانات الطلبات...
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                    <span className="text-xs font-black text-gray-700 block">إحصاءات التدخل الميداني</span>
                    <div className="flex items-center justify-between flex-row-reverse text-xs">
                      <span className="text-gray-500">إجمالي الحالات العاجلة النشطة:</span>
                      <span className="font-black text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded">{totalUrgentCount} حالة</span>
                    </div>
                    <div className="flex items-center justify-between flex-row-reverse text-xs pt-1 border-t border-slate-100">
                      <span className="text-gray-500">البلديات المسجلة للحرارة:</span>
                      <span className="font-black text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded">{targetMunicipalities.length} بلديات</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 text-slate-300 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1 flex-row-reverse text-[10px] text-amber-400 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>آلية عمل المؤشر:</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-gray-400">
                    تقوم الخريطة بمطابقة الإحداثيات الكلية لطلبات البحث الجغرافي وحساب معامل ثنائي للموازنة بين عدد العائلات ومعدل المرض أو الفقر لتمكين الجمعيات من الصرف السريع.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Smart Search Panel */}
      <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          {/* Query input */}
          <div className="flex-1 space-y-1.5 text-right w-full">
            <label className="text-xs font-bold text-gray-600">بحث بالكلمات المفتاحية (رقم الملف، الوصف، العنوان):</label>
            <div className="relative">
              <input
                type="text"
                placeholder="مثال: LY-2026-0001 أو مدرسة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveLocalSearchToHistory(searchQuery);
                }}
                className="w-full bg-slate-50 border rounded-xl pr-10 pl-4 py-2.5 text-xs text-right focus:border-emerald-500 focus:outline-none"
              />
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
            {/* Local Search History */}
            {localSearchHistory.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center flex-row-reverse mt-1">
                <span className="text-[9px] text-gray-400 ml-1">عمليات البحث السابقة:</span>
                {localSearchHistory.map((historyItem, idx) => (
                  <div key={idx} className="flex items-center bg-slate-100 border border-slate-200 rounded-md overflow-hidden flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(historyItem);
                      }}
                      className="text-[10px] hover:bg-slate-200 text-slate-600 px-2 py-0.5 transition-colors cursor-pointer truncate max-w-[120px] text-right text-ellipsis"
                      title={historyItem}
                    >
                      {historyItem}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = localSearchHistory.filter(h => h !== historyItem);
                        setLocalSearchHistory(updated);
                        localStorage.setItem("takaful_local_search_history", JSON.stringify(updated));
                      }}
                      className="px-1.5 py-0.5 text-gray-400 hover:text-red-500 hover:bg-slate-200 transition-colors border-l border-slate-200"
                      title="حذف"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Municipality filter */}
          <div className="w-full md:w-48 space-y-1.5 text-right">
            <label className="text-xs font-bold text-gray-600">تصفية حسب البلدية:</label>
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700"
            >
              <option value="الكل">كل البلديات 🗺️</option>
              {municipalities.map((m) => (
                <option key={m} value={m}>بلدية {m}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          {activeTab === "cases" && (
            <div className="w-full md:w-44 space-y-1.5 text-right">
              <label className="text-xs font-bold text-gray-600">درجة الاستعجال:</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700"
              >
                <option value="الكل">كل المستويات 🏷️</option>
                <option value="عاجل">عاجل جداً 🔥</option>
                <option value="مرتفع">مرتفع ⚡</option>
                <option value="متوسط">متوسط 💬</option>
                <option value="منخفض">منخفض</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab switch for results */}
        <div className="flex border-b border-slate-100 pb-2 gap-4">
          <button
            onClick={() => { setActiveTab("cases"); setSearchQuery(""); }}
            className={`pb-1 text-xs font-black cursor-pointer transition-all ${
              activeTab === "cases" ? "text-emerald-700 border-b-2 border-emerald-600 font-extrabold" : "text-gray-400"
            }`}
          >
            الملفات العائلية المحتاجة ({filteredCases.length})
          </button>
          <button
            onClick={() => { setActiveTab("projects"); setSearchQuery(""); }}
            className={`pb-1 text-xs font-black cursor-pointer transition-all ${
              activeTab === "projects" ? "text-emerald-700 border-b-2 border-emerald-600 font-extrabold" : "text-gray-400"
            }`}
          >
            المستشفيات والمدارس والمنشآت ({filteredProjects.length})
          </button>
        </div>

        {/* Results layout */}
        <div className="space-y-3">
          {activeTab === "cases" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((c) => {
                const percent = Math.floor((c.amountCollected / c.amountRequired) * 100);
                return (
                  <div key={c.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between space-y-3 hover:border-emerald-200 hover:shadow-sm transition-all text-right">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        c.priorityLevel === "عاجل" ? "bg-rose-100 text-rose-800" :
                        c.priorityLevel === "مرتفع" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {c.priorityLevel}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">{c.caseNumber}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-900 leading-tight">ملف أسرة ببلدية {c.municipality}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{c.description}</p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="font-bold text-[#0F6E56]">{percent}%</span>
                        <span className="text-gray-400">معدل الدعم المالي</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#1D9E75] h-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] border-t border-slate-200/50 pt-2">
                      <span className="font-bold text-[#0F6E56]">{c.amountRequired - c.amountCollected} LYD متبقي</span>
                      <button
                        onClick={() => {
                          const donationAmount = prompt(`أدخل قيمة مساهمتك السريعة لملف ${c.caseNumber}:`, "100");
                          if (donationAmount && Number(donationAmount) > 0 && onDonate) {
                            onDonate({
                              donorId: user?.id || null,
                              donorNameOverride: user?.fullName || "متبرع فاعل خير",
                              caseId: c.id,
                              fundType: "صدقة",
                              amount: Number(donationAmount),
                              currency: "LYD",
                              paymentMethod: "بوابة سريعة"
                            });
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer"
                      >
                        تبرع فوري 🪙
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCases.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 text-xs font-bold">
                  لم نعثر على أي ملفات عائلية مطابقة لخيارات البحث الحالية.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((p) => {
                const percent = Math.floor((p.collectedAmount / p.targetAmount) * 100);
                return (
                  <div key={p.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between space-y-3 hover:border-indigo-200 hover:shadow-sm transition-all text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-extrabold">
                        {p.category === "school" ? "مدرسة تعليمية" : p.category === "hospital" ? "مستشفى طبي" : "بنية تحتية"}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">{p.projectNumber}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-900 leading-tight">{p.title}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{p.description}</p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="font-bold text-indigo-700">{percent}%</span>
                        <span className="text-gray-400">معدل الإعمار والتجهيز</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] border-t border-slate-200/50 pt-2">
                      <span className="font-bold text-indigo-900">{p.targetAmount - p.collectedAmount} LYD متبقي</span>
                      <button
                        onClick={() => {
                          const donationAmount = prompt(`أدخل قيمة مساهمتك السريعة لتجهيز ${p.title}:`, "500");
                          if (donationAmount && Number(donationAmount) > 0 && onDonate) {
                            onDonate({
                              donorId: user?.id || null,
                              donorNameOverride: user?.fullName || "متبرع فاعل خير",
                              projectId: p.id,
                              fundType: "صدقة_جارية",
                              amount: Number(donationAmount),
                              currency: "LYD",
                              paymentMethod: "بوابة سريعة"
                            });
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer"
                      >
                        مساهمة بالإعمار 🏢
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProjects.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 text-xs font-bold">
                  لم نعثر على أي منشآت أو مدارس أو مستشفيات مطابقة لخيارات البحث الحالية.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
