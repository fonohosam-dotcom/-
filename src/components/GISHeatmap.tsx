import React, { useState } from "react";
import { Case, MajorProject, User } from "../types";

interface GISHeatmapProps {
  cases: Case[];
  projects: MajorProject[];
  users?: User[]; // Optional for backward compatibility, but we will pass it
  charities?: User[];
  selectedMunicipality: string;
  onSelectMunicipality: (muni: string) => void;
  showEmergency?: boolean;
  showProjects?: boolean;
  showCharities?: boolean;
}

export default function GISHeatmap({
  cases,
  projects,
  users = [],
  charities = [],
  selectedMunicipality,
  onSelectMunicipality,
  showEmergency = true,
  showProjects = true,
  showCharities = true
}: GISHeatmapProps) {
  // Municipalities list
  const municipalities = [
    { name: "صبراتة", x: 260, y: 120, r: 45, color: "rgba(226, 75, 74, 0.2)" }, // Center
    { name: "صرمان", x: 380, y: 150, r: 38, color: "rgba(239, 159, 39, 0.2)" },  // East
    { name: "العجيلات", x: 140, y: 180, r: 42, color: "rgba(55, 138, 221, 0.2)" }, // Southwest
    { name: "الجميل", x: 60, y: 220, r: 35, color: "rgba(226, 75, 74, 0.15)" },  // Far west
    { name: "زوارة", x: 80, y: 70, r: 40, color: "rgba(15, 110, 86, 0.15)" },   // Northwest coast
    { name: "الزاوية", x: 460, y: 110, r: 50, color: "rgba(226, 75, 74, 0.1)" }, // Far East coast
  ];

  const [showResearchers, setShowResearchers] = useState(false);
  const researchers = users.filter(u => u.role === "researcher");

  // Calculate dynamic stats for each municipality based on current data
  const getStats = (muniName: string) => {
    const muniCases = showEmergency ? cases.filter((c) => c.municipality === muniName) : [];
    const muniProjects = showProjects ? projects.filter((p) => p.municipality === muniName) : [];
    const muniCharities = showCharities ? charities.filter((ch) => ch.municipality === muniName) : [];
    
    const urgentCount = muniCases.filter((c) => c.priorityLevel === "عاجل" && c.status !== "closed").length;
    const activeCasesCount = muniCases.filter((c) => c.status !== "closed" && c.status !== "rejected").length;
    const projectsCount = muniProjects.length;
    const charitiesCount = muniCharities.length;
    
    // Sum of all donations collected for cases and projects in this municipality
    const totalDonations = 
      muniCases.reduce((sum, c) => sum + (c.amountCollected || 0), 0) +
      muniProjects.reduce((sum, p) => sum + (p.collectedAmount || 0), 0);

    // Determine dominant need color
    // Red = Urgent poverty, Blue = Water (Well), Yellow/Amber = Medical / Renovation
    let urgentWeight = urgentCount * 3;
    let waterWeight = muniProjects.filter((p) => p.category === "well" && p.status === "active").length * 5;
    let medicalWeight = muniCases.filter((c) => c.needTypes.includes("علاج") && c.status !== "closed").length * 2;

    let heatColor = "stroke-gray-300 fill-gray-50 hover:fill-gray-100";
    let bgPulseColor = "bg-gray-400";
    let dominantText = "مستقرة";

    if (urgentWeight > waterWeight && urgentWeight > medicalWeight && urgentWeight > 0) {
      heatColor = "stroke-rose-400 fill-rose-100 hover:fill-rose-200";
      bgPulseColor = "bg-rose-500";
      dominantText = "خط فقر مدقع / أولويات عاجلة";
    } else if (waterWeight > urgentWeight && waterWeight > medicalWeight && waterWeight > 0) {
      heatColor = "stroke-blue-400 fill-blue-100 hover:fill-blue-200";
      bgPulseColor = "bg-blue-500";
      dominantText = "شح مياه / بحاجة لآبار";
    } else if (medicalWeight > 0) {
      heatColor = "stroke-amber-400 fill-amber-100 hover:fill-amber-200";
      bgPulseColor = "bg-amber-500";
      dominantText = "احتياجات علاجية وأجهزة طبية";
    }

    return {
      urgentCount,
      activeCasesCount,
      projectsCount: muniProjects.length,
      totalDonations,
      heatColor,
      bgPulseColor,
      dominantText,
    };
  };

  const selectedStats = getStats(selectedMunicipality || "صبراتة");

  return (
    <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: SVG Map */}
        <div className="flex-1">
          <div className="mb-4 flex justify-between items-start flex-row-reverse">
            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 justify-end flex-row-reverse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                الخريطة الحرارية التفاعلية للبلديات (GIS Map)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                اضغط على أي بلدية في الخريطة لتصفية الحالات المعروضة واستعراض احتياجاتها بشكل فوري.
              </p>
            </div>
            <button 
              onClick={() => setShowResearchers(!showResearchers)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${showResearchers ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              🗺️ مسار الباحثين ميدانياً
            </button>
          </div>

          <div className="relative border border-dashed border-[#E5E3DA] rounded-xl p-4 bg-slate-50 flex justify-center">
            {/* Compass rose or water lines */}
            <div className="absolute top-4 left-4 text-[10px] text-gray-400 font-mono select-none">
              N 32.79° / E 12.48° <br />
              WESTERN REGION GIS
            </div>

            <svg
              viewBox="0 0 540 300"
              className="w-full max-w-[500px] h-auto drop-shadow-sm select-none"
            >
              {/* Simulated Coastline */}
              <path
                d="M 10 50 Q 150 40 280 80 T 530 90"
                fill="none"
                className="stroke-sky-200 stroke-[6]"
              />
              <path
                d="M 10 50 Q 150 40 280 80 T 530 90"
                fill="none"
                className="stroke-sky-100 stroke-[2] stroke-dasharray-[4,4]"
              />
              <text x="440" y="40" className="fill-sky-400 text-[10px] italic font-serif">البحر الأبيض المتوسط</text>

              {/* Connecting roads or boundaries */}
              <line x1="80" y1="70" x2="140" y2="180" className="stroke-slate-200 stroke-[1.5] stroke-dasharray-[2,2]" />
              <line x1="140" y1="180" x2="260" y2="120" className="stroke-slate-200 stroke-[1.5] stroke-dasharray-[2,2]" />
              <line x1="260" y1="120" x2="380" y2="150" className="stroke-slate-200 stroke-[1.5] stroke-dasharray-[2,2]" />
              <line x1="380" y1="150" x2="460" y2="110" className="stroke-slate-200 stroke-[1.5] stroke-dasharray-[2,2]" />

              {/* Render Municipality Circles */}
              {municipalities.map((muni) => {
                const stats = getStats(muni.name);
                const isSelected = selectedMunicipality === muni.name;

                return (
                  <g
                    key={muni.name}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => onSelectMunicipality(muni.name)}
                  >
                    {/* Pulsing ring for selected or urgent */}
                    {stats.urgentCount > 0 && (
                      <circle
                        cx={muni.x}
                        cy={muni.y}
                        r={muni.r + 8}
                        className={`fill-none stroke-rose-400 opacity-30 stroke-[1.5] animate-ping`}
                        style={{ transformOrigin: `${muni.x}px ${muni.y}px` }}
                      />
                    )}

                    {/* Main Municipality Bubble */}
                    <circle
                      cx={muni.x}
                      cy={muni.y}
                      r={muni.r}
                      className={`transition-all duration-300 stroke-[2] ${
                        isSelected
                          ? "stroke-[#0F6E56] fill-[#E1F5EE] scale-105 filter drop-shadow-md"
                          : stats.heatColor
                      }`}
                      style={{ transformOrigin: `${muni.x}px ${muni.y}px` }}
                    />

                    {/* Text Label */}
                    <text
                      x={muni.x}
                      y={muni.y - 4}
                      textAnchor="middle"
                      className={`text-xs font-bold ${
                        isSelected ? "fill-[#085041] scale-105" : "fill-[#2C2C2A]"
                      }`}
                    >
                      {muni.name}
                    </text>

                    {/* Case / Project Counter Badge inside Map Bubble */}
                    <text
                      x={muni.x}
                      y={muni.y + 14}
                      textAnchor="middle"
                      className="text-[9px] fill-[#5F5E5A] font-mono"
                    >
                      {stats.activeCasesCount} حالات | {stats.projectsCount} مش.
                    </text>
                  </g>
                );
              })}

              {/* Show Researchers Layer */}
              {showResearchers && researchers.map((r, i) => {
                // Mock coordinate logic just for visualization, ideally we use real GPS
                const muni = municipalities.find(m => m.name === r.municipality) || municipalities[0];
                const dx = (Math.random() - 0.5) * 30;
                const dy = (Math.random() - 0.5) * 30;
                return (
                  <g key={`researcher-${r.id}-${i}`} className="animate-fade-in pointer-events-none">
                    <circle 
                      cx={muni.x + dx} 
                      cy={muni.y + dy} 
                      r={4} 
                      className="fill-indigo-600 stroke-white stroke-[1.5]"
                    />
                    <circle 
                      cx={muni.x + dx} 
                      cy={muni.y + dy} 
                      r={12} 
                      className="fill-none stroke-indigo-400 stroke-1 opacity-50 animate-ping"
                    />
                    <text 
                      x={muni.x + dx} 
                      y={muni.y + dy - 6} 
                      textAnchor="middle" 
                      className="text-[7px] font-bold fill-indigo-900 drop-shadow-sm"
                    >
                      {r.fullName.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Color coding legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-400"></span>
              أولويات عاجلة / فقر
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-400"></span>
              مشاريع آبار / مياه
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400"></span>
              مساعدات طبية / ترميم
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded-full bg-[#E1F5EE] border border-[#0F6E56]"></span>
              البلدية المحددة حالياً
            </span>
          </div>
        </div>

        {/* Right: Detailed Sidebar Stats */}
        <div className="w-full lg:w-[260px] flex flex-col justify-between border-r lg:border-r-0 lg:border-r border-[#E5E3DA] pr-0 lg:pr-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F6E56] font-mono">
              تفاصيل المؤشرات الجغرافية
            </span>
            <h4 className="text-xl font-black text-gray-900 mt-1 mb-2">
              بلدية {selectedMunicipality || "صبراتة"}
            </h4>

            <div className="space-y-4 my-4">
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-emerald-800 font-bold">إجمالي التبرعات الموزعة</p>
                  <p className="text-lg font-black text-emerald-700 font-mono">
                    {selectedStats.totalDonations.toLocaleString()} د.ل
                  </p>
                </div>
                <span className="text-lg">💰</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-500">حالات نشطة بالبلدية</p>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedStats.activeCasesCount}
                  </p>
                </div>
                <span className="text-lg">📋</span>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-rose-700 font-medium">أولويات عاجلة جداً</p>
                  <p className="text-xl font-bold text-rose-600">
                    {selectedStats.urgentCount}
                  </p>
                </div>
                <span className="text-lg animate-pulse">🚨</span>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-blue-700 font-medium">مشاريع تنموية كبرى</p>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedStats.projectsCount}
                  </p>
                </div>
                <span className="text-lg">🏗️</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-[#E5E3DA] p-3 rounded-xl">
            <span className="text-[10px] text-gray-500 block">طبيعة الاحتياج المهيمن</span>
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${selectedStats.bgPulseColor} inline-block animate-pulse`}></span>
              {selectedStats.dominantText}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
