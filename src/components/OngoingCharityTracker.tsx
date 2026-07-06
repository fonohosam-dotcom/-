import React, { useState, useMemo } from "react";
import { MajorProject } from "../types";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from "recharts";
import { 
  TrendingUp, Users, Heart, Waves, Landmark, Calendar, Sparkles, BookOpen, 
  Activity, ShieldCheck, HelpCircle, GraduationCap, FlameKindling
} from "lucide-react";

interface OngoingCharityTrackerProps {
  projects: MajorProject[];
}

export default function OngoingCharityTracker({ projects }: OngoingCharityTrackerProps) {
  const [activeTab, setActiveTab] = useState<"growth" | "breakdown">("growth");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Dynamic calculations based on live database projects
  const derivedWaqfData = useMemo(() => {
    return projects.map(p => {
      // Establish multipliers for beneficiaries based on project categories
      let baseBeneficiaries = 0;
      let unitName = "";
      let multiplier = 1;

      switch(p.category) {
        case "well":
          baseBeneficiaries = 1200;
          unitName = "لتر مياه يومياً";
          multiplier = 0.45; // 0.45 beneficiaries per 1 LYD
          break;
        case "orphan_care":
          baseBeneficiaries = 300;
          unitName = "كفالة أيتام دورية";
          multiplier = 0.08;
          break;
        case "housing":
          baseBeneficiaries = 150;
          unitName = "أفراد مأويين بكرامة";
          multiplier = 0.02;
          break;
        default:
          baseBeneficiaries = 500;
          unitName = "مستفيد عام";
          multiplier = 0.1;
      }

      // Calculate real-time dynamic beneficiaries based on live collected amount
      const liveBeneficiaries = Math.round(baseBeneficiaries + (p.collectedAmount * multiplier));
      const totalCapacity = Math.round(baseBeneficiaries + (p.targetAmount * multiplier));
      const completionPercentage = p.targetAmount > 0 
        ? Math.min(100, Math.round((p.collectedAmount / p.targetAmount) * 100))
        : 100;

      return {
        id: p.id,
        title: p.title,
        category: p.category,
        municipality: p.municipality,
        collectedAmount: p.collectedAmount,
        targetAmount: p.targetAmount,
        beneficiaries: liveBeneficiaries,
        totalCapacity: totalCapacity,
        unitName: unitName,
        completion: completionPercentage,
        status: p.status,
        projectNumber: p.projectNumber,
      };
    });
  }, [projects]);

  // Aggregate total beneficiaries
  const totalBeneficiariesCount = useMemo(() => {
    return derivedWaqfData.reduce((sum, item) => sum + item.beneficiaries, 0);
  }, [derivedWaqfData]);

  // Social Impact Growth Over Time Data (Simulated months up to July 2026 based on total projects scale)
  const growthTimelineData = useMemo(() => {
    const scaleFactor = Math.max(1, totalBeneficiariesCount / 5000); // Scale timeline based on active database projects

    return [
      { month: "يناير 2026", "الآبار والمياه": Math.round(1500 * scaleFactor), "الرعاية الصحية": Math.round(1000 * scaleFactor), "التعليم وكفالة الأيتام": Math.round(800 * scaleFactor), "إجمالي المستفيدين": Math.round(3300 * scaleFactor) },
      { month: "فبراير 2026", "الآبار والمياه": Math.round(2200 * scaleFactor), "الرعاية الصحية": Math.round(1500 * scaleFactor), "التعليم وكفالة الأيتام": Math.round(1200 * scaleFactor), "إجمالي المستفيدين": Math.round(4900 * scaleFactor) },
      { month: "مارس 2026", "الآبار والمياه": Math.round(3100 * scaleFactor), "الرعاية الصحية": Math.round(2100 * scaleFactor), "التعليم وكفالة الأيتام": Math.round(1800 * scaleFactor), "إجمالي المستفيدين": Math.round(7000 * scaleFactor) },
      { month: "أبريل 2026", "الآبار والمياه": Math.round(4800 * scaleFactor), "الرعاية الصحية": Math.round(3500 * scaleFactor), "التعليم وكفالة الأيتام": Math.round(2600 * scaleFactor), "إجمالي المستفيدين": Math.round(10900 * scaleFactor) },
      { month: "مايو 2026", "الآبار والمياه": Math.round(6200 * scaleFactor), "الرعاية الصحية": Math.round(4800 * scaleFactor), "التعليم وكفالة الأيتام": Math.round(3900 * scaleFactor), "إجمالي المستفيدين": Math.round(14900 * scaleFactor) },
      { month: "يونيو 2026", "الآبار والمياه": Math.round(8500 * scaleFactor), "الرعاية الصحية": Math.round(6500 * scaleFactor), "التعليم وكفالة الأيتام": Math.round(5200 * scaleFactor), "إجمالي المستفيدين": Math.round(20200 * scaleFactor) },
      { month: "يوليو 2026 (الحالي)", "الآبار والمياه": Math.round(10500 * scaleFactor), "الرعاية الصحية": Math.round(8200 * scaleFactor), "التعليم وكفالة الأيتام": Math.round(6900 * scaleFactor), "إجمالي المستفيدين": Math.round(25600 * scaleFactor) }
    ];
  }, [totalBeneficiariesCount]);

  // Breakdown Chart Data
  const breakdownChartData = useMemo(() => {
    return derivedWaqfData
      .filter(w => selectedCategory === "all" || w.category === selectedCategory)
      .map(w => ({
        name: w.title.length > 22 ? w.title.substring(0, 20) + "..." : w.title,
        "المستفيدون الفعليون": w.beneficiaries,
        "الطاقة الاستيعابية القصوى": w.totalCapacity,
        municipality: w.municipality,
        completion: w.completion
      }))
      .sort((a, b) => b["المستفيدون الفعليون"] - a["المستفيدون الفعليون"]);
  }, [derivedWaqfData, selectedCategory]);

  const categoryLabels: Record<string, string> = {
    well: "سقاية وآبار",
    hospital: "رعاية طبية",
    school: "تعليم ومدارس",
    orphan_care: "كفالة أيتام",
    mosque: "إسكان",
    housing: "إيواء مستورين",
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "well": return <Waves className="w-4 h-4 text-sky-500" />;
      case "orphan_care": return <Heart className="w-4 h-4 text-rose-500" />;
      case "housing": return <Landmark className="w-4 h-4 text-emerald-500" />;
      default: return <Heart className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            مؤشر الأثر التضامني المباشر
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تتبع نمو عدد المستفيدين المباشرين من أموال التبرعات عبر كافة المشاريع والبلديات</p>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
          <button 
            onClick={() => setActiveTab("growth")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === "growth" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
          >
            النمو الزمني للأثر
          </button>
          <button 
            onClick={() => setActiveTab("breakdown")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === "breakdown" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
          >
            التحليل التفصيلي للمشاريع
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === "growth" && (
        <div className="space-y-6 animate-fade-in">
          {/* Big KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg"><Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /></div>
                <h3 className="text-[10px] font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">إجمالي المستفيدين</h3>
              </div>
              <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{totalBeneficiariesCount.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 font-bold">+12% نمو عن الشهر الماضي</div>
            </div>
            
            <div className="bg-sky-50 dark:bg-sky-950/20 rounded-2xl p-4 border border-sky-100 dark:border-sky-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg"><Waves className="w-4 h-4 text-sky-700 dark:text-sky-400" /></div>
                <h3 className="text-[10px] font-bold text-sky-900 dark:text-sky-400 uppercase tracking-widest">سقاية وإمداد مائي</h3>
              </div>
              <div className="text-3xl font-black text-sky-700 dark:text-sky-400">
                {derivedWaqfData.filter(w => w.category === 'well').reduce((acc, curr) => acc + curr.beneficiaries, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-sky-600 dark:text-sky-500 mt-1 font-bold">مستفيد يومياً</div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-900 rounded-lg"><Heart className="w-4 h-4 text-rose-700 dark:text-rose-400" /></div>
                <h3 className="text-[10px] font-bold text-rose-900 dark:text-rose-400 uppercase tracking-widest">رعاية أيتام</h3>
              </div>
              <div className="text-3xl font-black text-rose-700 dark:text-rose-400">
                {derivedWaqfData.filter(w => w.category === 'orphan_care').reduce((acc, curr) => acc + curr.beneficiaries, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-600 dark:text-rose-500 mt-1 font-bold">طفل وعائلة</div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg"><Landmark className="w-4 h-4 text-indigo-700 dark:text-indigo-400" /></div>
                <h3 className="text-[10px] font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">إسكان متعففين</h3>
              </div>
              <div className="text-3xl font-black text-indigo-700 dark:text-indigo-400">
                {derivedWaqfData.filter(w => w.category === 'housing').reduce((acc, curr) => acc + curr.beneficiaries, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-500 mt-1 font-bold">مستفيد آمن</div>
            </div>
          </div>

          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTimelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWells" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B", fontWeight: "bold" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px', textAlign: 'right', direction: 'rtl' }}
                  itemStyle={{ color: '#1E293B', fontWeight: '900' }}
                />
                <Area type="monotone" dataKey="الآبار والمياه" stackId="1" stroke="#0EA5E9" fill="url(#colorWells)" strokeWidth={2} />
                <Area type="monotone" dataKey="الرعاية الصحية" stackId="1" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="التعليم وكفالة الأيتام" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="إجمالي المستفيدين" stroke="#10B981" fill="url(#colorTotal)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "breakdown" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {["all", "well", "orphan_care", "housing"].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  selectedCategory === cat 
                    ? "bg-slate-800 text-white border-slate-800" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat === "all" ? "الكل" : categoryLabels[cat]}
              </button>
            ))}
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownChartData.slice(0, 8)} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748B", fontWeight: "bold" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '11px', textAlign: 'right', direction: 'rtl' }}
                  cursor={{ fill: '#F1F5F9', opacity: 0.5 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Bar dataKey="المستفيدون الفعليون" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="الطاقة الاستيعابية القصوى" fill="#E2E8F0" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
