import React, { useState } from "react";
import { MajorProject } from "../types";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Building2,
  ArrowLeftRight,
  Search,
  Filter,
  Check
} from "lucide-react";

interface ProjectTimelineProps {
  projects: MajorProject[];
  lang?: "ar" | "en" | "zh" | "fr" | "ru";
}

export default function ProjectTimeline({
  projects,
  lang = "ar"
}: ProjectTimelineProps) {
  const isAr = lang === "ar";
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const t = {
    title: isAr ? "الجدول الزمني ومراحل إنجاز المشاريع" : "Projects Milestone Timeline",
    subtitle: isAr
      ? "تتبع تفصيلي لمراحل تنفيذ المشاريع التنموية الكبرى والتواريخ المستهدفة للإنجاز والانتهاء"
      : "Detailed tracking of major project execution phases and target completion deadlines",
    searchPlaceholder: isAr ? "البحث باسم المشروع أو البلدية..." : "Search project or municipality...",
    categoryLabel: isAr ? "التصنيف" : "Category",
    all: isAr ? "كل المشاريع" : "All Projects",
    statusActive: isAr ? "نشط وقيد التنفيذ" : "Active & In Progress",
    statusCompleted: isAr ? "مكتمل ومسلم" : "Completed & Delivered",
    targetDate: isAr ? "التاريخ المستهدف:" : "Target Date:",
    noProjects: isAr ? "لا توجد مشاريع مطابقة حالياً" : "No matching projects found",
    completionRate: isAr ? "نسبة إقفال التمويل" : "Funding Collected",
    phasesTitle: isAr ? "المخطط الزمني للمراحل التنفيذية" : "Milestone Execution Timeline",
    well: isAr ? "حفر بئر مياه" : "Water Well Drilling",
    orphan_care: isAr ? "رعاية وبناء دار أيتام" : "Orphan Care Center",
    housing: isAr ? "مجمع سكني خيري" : "Charitable Housing Complex"
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "well": return t.well;
      case "orphan_care": return t.orphan_care;
      case "housing": return t.housing;
      default: return cat;
    }
  };

  const categories = ["all", "well", "orphan_care", "housing"];

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Keep selected project updated if filter changes list
  const activeProject = filteredProjects.find((p) => p.id === selectedProjectId) || filteredProjects[0];

  // Helper to format date with localized string
  const formatDate = (dateStr: string, weeksOffset: number = 0) => {
    try {
      const d = new Date(dateStr);
      if (weeksOffset > 0) {
        d.setDate(d.getDate() + weeksOffset * 7);
      }
      return d.toLocaleDateString(isAr ? "ar-LY" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Generate dynamic milestones based on project metadata
  const getMilestones = (project: MajorProject) => {
    if (!project) return [];

    const progressPercent = Math.min(
      Math.round((project.collectedAmount / project.targetAmount) * 100),
      100
    );

    const isFullyFunded = progressPercent >= 100;
    const isCompleted = project.status === "completed";

    return [
      {
        id: 1,
        titleAr: "المرحلة 1: الدراسة والتدقيق الهندسي",
        titleEn: "Phase 1: Feasibility Study & Engineering Audit",
        descAr: "تشمل مسح التربة وتوثيق الاحتياج المحلي للبلدية واعتماد المخططات الهندسية الأولية.",
        descEn: "Includes soil testing, mapping local community demand, and initial architectural blue-prints approval.",
        weeksOffset: 0,
        status: "completed" as const, // Always completed for existing projects
        badgeAr: "مكتملة بنجاح",
        badgeEn: "Successfully Completed"
      },
      {
        id: 2,
        titleAr: "المرحلة 2: إقفال الحملة وتعبئة الرصيد",
        titleEn: "Phase 2: Funding & Donation Target Close",
        descAr: `استقبال تبرعات المحسنين عبر بوابة تكافل الرقمية الموحدة لجمع المستهدف البالغ ${project.targetAmount.toLocaleString()} د.ل.`,
        descEn: `Securing required charity funds through the Takaful unified donation gateway. Target: ${project.targetAmount.toLocaleString()} LYD.`,
        weeksOffset: 4,
        status: isFullyFunded ? ("completed" as const) : ("active" as const),
        badgeAr: isFullyFunded ? "تم التمويل بنجاح" : `قيد جمع التبرعات (${progressPercent}%)`,
        badgeEn: isFullyFunded ? "Fully Funded" : `Fundraising (${progressPercent}%)`
      },
      {
        id: 3,
        titleAr: "المرحلة 3: التعاقد مباشرة والأعمال المدنية",
        titleEn: "Phase 3: Civil Works & General Contracting",
        descAr: "شراء وتوريد المواد الإنشائية والتعاقد مع المقاولين ومباشرة البناء والحفر على أرض الواقع.",
        descEn: "Procuring materials, awarding local contractors, and initiating physical ground civil works.",
        weeksOffset: 10,
        status: isCompleted
          ? ("completed" as const)
          : isFullyFunded
          ? ("active" as const)
          : progressPercent > 50
          ? ("active" as const)
          : ("pending" as const),
        badgeAr: isCompleted 
          ? "مكتمل" 
          : isFullyFunded 
          ? "مباشرة البناء الميداني" 
          : progressPercent > 50 
          ? "أعمال تحضيرية أولية" 
          : "بانتظار اكتمال التمويل",
        badgeEn: isCompleted 
          ? "Completed" 
          : isFullyFunded 
          ? "Active Construction" 
          : progressPercent > 50 
          ? "Site Preparation" 
          : "Pending Funds"
      },
      {
        id: 4,
        titleAr: "المرحلة 4: التدشين والتشغيل والتسليم",
        titleEn: "Phase 4: Operational Commissioning & Handover",
        descAr: "الفحص الفني النهائي للجودة والمطابقة ، وافتتاح المشروع رسمياً.",
        descEn: "Final technical quality inspection, validation with the social board, and official ribbon-cutting opening.",
        weeksOffset: 20,
        status: isCompleted ? ("completed" as const) : ("pending" as const),
        badgeAr: isCompleted ? "تم التسليم للبلدية" : "بانتظار المراحل السابقة",
        badgeEn: isCompleted ? "Handed Over to Municipality" : "Awaiting Previous Milestones"
      }
    ];
  };

  const activeMilestones = activeProject ? getMilestones(activeProject) : [];

  return (
    <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-6 text-right" id="projects-timeline-section">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#E5E3DA]" dir={isAr ? "rtl" : "ltr"}>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
            {t.title}
          </h3>
          <p className="text-xs text-gray-500">{t.subtitle}</p>
        </div>
        
        {/* Simple Summary Status Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1 rounded-lg">
            {projects.filter((p) => p.status === "completed").length} {isAr ? "مشاريع مكتملة ومسلمة" : "Completed Projects"}
          </span>
          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-1 rounded-lg">
            {projects.filter((p) => p.status === "active").length} {isAr ? "مشاريع جارية قيد التنفيذ" : "Active Projects"}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" dir={isAr ? "rtl" : "ltr"}>
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-[#E5E3DA] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F6E56]/40 focus:bg-white text-slate-700 placeholder-slate-400 font-sans"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E5E3DA] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F6E56]/40 focus:bg-white text-slate-700 font-sans appearance-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? t.all : getCategoryLabel(cat)}
              </option>
            ))}
          </select>
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Master/Detail Layout */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#E5E3DA] rounded-2xl text-slate-400 text-xs font-sans">
          <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          {t.noProjects}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left/Right Sidebar: Projects Selector List (5 Cols) */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1.5" dir={isAr ? "rtl" : "ltr"}>
            {filteredProjects.map((p) => {
              const isSelected = p.id === activeProject?.id;
              const progress = Math.min(
                Math.round((p.collectedAmount / p.targetAmount) * 100),
                100
              );
              
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  type="button"
                  className={`w-full text-right p-3.5 rounded-xl border transition-all duration-150 flex flex-col gap-2 relative overflow-hidden group ${
                    isSelected
                      ? "bg-[#0F6E56]/5 border-[#0F6E56] shadow-sm"
                      : "bg-white hover:bg-slate-50/70 border-[#E5E3DA]"
                  }`}
                >
                  {/* Category accent bar */}
                  <div className={`absolute top-0 bottom-0 ${isAr ? "right-0" : "left-0"} w-1 ${
                    p.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                  }`} />

                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-[10px] font-mono text-slate-400">
                      {p.projectNumber}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      p.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {p.status === "completed" ? t.statusCompleted : t.statusActive}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-slate-900">
                      {p.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isAr ? "البلدية:" : "Municipality:"} <span className="font-bold text-slate-600">{p.municipality}</span> | {getCategoryLabel(p.category)}
                    </p>
                  </div>

                  {/* Tiny progress status */}
                  <div className="space-y-1 pt-1 border-t border-dashed border-slate-100">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{progress}%</span>
                      <span>{t.completionRate}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 100 ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right/Left Detail Panel: The Interactive Timeline (7 Cols) */}
          {activeProject && (
            <div className="lg:col-span-7 bg-[#FCFBF7] border border-[#E5E3DA] p-5 rounded-2xl space-y-6 relative overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20" />
              
              {/* Selected Project Header Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                    {getCategoryLabel(activeProject.category)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeProject.projectNumber}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-800 leading-snug">
                  {activeProject.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {activeProject.description}
                </p>
              </div>

              {/* Milestones Stepper Tracker */}
              <div className="space-y-6 pt-2">
                <h4 className="text-xs font-black text-slate-800 border-b border-dashed border-[#E5E3DA] pb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0F6E56]" />
                  {t.phasesTitle}
                </h4>

                <div className="relative pr-6 pl-2 space-y-6 border-r-2 border-slate-200 mr-2.5">
                  {activeMilestones.map((ms, index) => {
                    const isDone = ms.status === "completed";
                    const isActive = ms.status === "active";
                    
                    return (
                      <div key={ms.id} className="relative">
                        
                        {/* Dot indicator on vertical line */}
                        <span className={`absolute -right-[33px] top-1 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm transition-all duration-150 ${
                          isDone 
                            ? "bg-emerald-500 border-emerald-600 text-white" 
                            : isActive 
                            ? "bg-amber-400 border-amber-500 text-slate-900 animate-pulse" 
                            : "bg-slate-100 border-slate-300 text-slate-400"
                        }`}>
                          {isDone ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <span className="text-[9px] font-mono font-bold">{ms.id}</span>
                          )}
                        </span>

                        {/* Milestone Card details */}
                        <div className={`p-3.5 rounded-xl border transition-all duration-150 ${
                          isDone 
                            ? "bg-white border-[#E5E3DA]" 
                            : isActive 
                            ? "bg-amber-50/50 border-amber-200/80 shadow-xs" 
                            : "bg-slate-50/40 border-slate-100 opacity-60"
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-1.5 border-b border-slate-100">
                            <span className={`text-xs font-bold ${
                              isDone ? "text-[#0F6E56]" : isActive ? "text-amber-700" : "text-slate-500"
                            }`}>
                              {isAr ? ms.titleAr : ms.titleEn}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isDone 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : isActive 
                                ? "bg-amber-50 text-amber-700 border border-amber-100" 
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {isAr ? ms.badgeAr : ms.badgeEn}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 pt-2 leading-relaxed">
                            {isAr ? ms.descAr : ms.descEn}
                          </p>

                          {/* Target Date footer */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100/50">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="font-sans text-[9px]">{t.targetDate}</span>
                            <span className="font-bold text-slate-600">
                              {formatDate(activeProject.createdAt, ms.weeksOffset)}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footnote stamp of security */}
              <div className="text-[10px] text-slate-400 bg-white border border-[#E5E3DA] p-3 rounded-xl flex items-center justify-between">
                <span>
                  {isAr ? "جهة الإشراف: لجنة الإسكان والمرافق" : "Supervising Body: Ministry of Housing"}
                </span>
                <span className="font-mono text-[9px] font-black text-[#0F6E56]">
                  {activeProject.status === "completed" ? "✓ APPROVED COMPLETED" : "⌚ MONITORING LIVE"}
                </span>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
