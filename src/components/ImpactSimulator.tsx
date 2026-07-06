import React, { useState, useMemo } from "react";
import { Case } from "../types";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine
} from "recharts";
import { 
  Calculator, Sparkles, HelpCircle, Users, Scale, FileSpreadsheet, 
  TrendingUp, Compass, Flame, HeartHandshake, FileCheck
} from "lucide-react";

interface ImpactSimulatorProps {
  cases: Case[];
  municipality: string;
}

export default function ImpactSimulator({ cases, municipality }: ImpactSimulatorProps) {
  // Let's filter or fallback to standard templates
  const [selectedCaseId, setSelectedCaseId] = useState<string>("custom");
  const [customNeedType, setCustomNeedType] = useState<string>("medical");
  const [simulatedBudget, setSimulatedBudget] = useState<number>(5000);
  const [qualityTier, setQualityTier] = useState<"standard" | "high" | "lean">("standard");
  const [urgencyFactor, setUrgencyFactor] = useState<number>(1.2); // 1.0 to 1.5 multiplier

  // Find selected case if any
  const selectedCase = useMemo(() => {
    return cases.find(c => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Determine the primary need type
  const activeNeedType = useMemo(() => {
    if (selectedCase) {
      const type = selectedCase.needTypes[0]?.toLowerCase() || "general";
      if (type.includes("طب") || type.includes("صح") || type.includes("علاج") || type.includes("مرض")) return "medical";
      if (type.includes("غذ") || type.includes("تمو") || type.includes("سلة")) return "nutrition";
      if (type.includes("سكن") || type.includes("إيو") || type.includes("بيت")) return "housing";
      if (type.includes("تعليم") || type.includes("درس") || type.includes("كتب")) return "education";
      if (type.includes("مياه") || type.includes("بئر") || type.includes("سق")) return "water";
      return "general";
    }
    return customNeedType;
  }, [selectedCase, customNeedType]);

  // Cost per beneficiary based on need type
  const costPerBeneficiaryInfo = useMemo(() => {
    switch (activeNeedType) {
      case "medical":
        return { cost: 180, label: "رعاية صحية وتغطية دوائية", unit: "مريض مستفيد" };
      case "nutrition":
        return { cost: 65, label: "سلل غذائية متكاملة للأسر", unit: "فرد مؤمّن غذائياً" };
      case "housing":
        return { cost: 450, label: "بدل إيجار وإيواء اضطراري", unit: "مواطن مأوى بكرامة" };
      case "education":
        return { cost: 95, label: "توفير سكن ومأوى", unit: "طالب مدعوم دراسياً" };
      case "water":
        return { cost: 35, label: "شبكات توزيع ومياه نقية", unit: "مواطن يصله ماء عذب" };
      default:
        return { cost: 110, label: "مساعدات مالية ومستلزمات عامة", unit: "مستفيد مباشر" };
    }
  }, [activeNeedType]);

  // Adjusted Cost based on Efficiency Tier
  const adjustedCostPerBeneficiary = useMemo(() => {
    let base = costPerBeneficiaryInfo.cost;
    // quality tier modifier
    if (qualityTier === "high") base *= 1.35; // Premium/High Quality materials or treatment
    if (qualityTier === "lean") base *= 0.8;  // Streamlined/Bulk logistics
    
    // apply urgency factor (distress sometimes raises logistics cost)
    return Math.round(base * (1 + (urgencyFactor - 1) * 0.4));
  }, [costPerBeneficiaryInfo, qualityTier, urgencyFactor]);

  // Calculate simulated outcomes
  const simulationResult = useMemo(() => {
    const budget = selectedCase ? selectedCase.amountRequired : simulatedBudget;
    const directBeneficiaries = Math.max(1, Math.round(budget / adjustedCostPerBeneficiary));
    
    // Average Libyan family size multiplier (typically ~5.4 people per household)
    const familySize = 5.4;
    const indirectBeneficiaries = Math.round(directBeneficiaries * (familySize - 1));
    const totalImpactRating = Math.min(100, Math.round((directBeneficiaries * 1.5 + indirectBeneficiaries * 0.5) / 10));

    return {
      budget,
      directBeneficiaries,
      indirectBeneficiaries,
      totalImpactCount: directBeneficiaries + indirectBeneficiaries,
      totalImpactRating,
      costPerPerson: adjustedCostPerBeneficiary
    };
  }, [selectedCase, simulatedBudget, adjustedCostPerBeneficiary]);

  // Generate dataset for chart (Budget vs Expected Beneficiaries curve)
  const chartData = useMemo(() => {
    const baseBudget = selectedCase ? selectedCase.amountRequired : simulatedBudget;
    const points = 8;
    const step = Math.max(100, Math.round(baseBudget / 4));
    
    const data = [];
    for (let i = 1; i <= points; i++) {
      const b = i * step;
      const direct = Math.max(1, Math.round(b / adjustedCostPerBeneficiary));
      const indirect = Math.round(direct * 4.4);
      data.push({
        "الميزانية المستثمرة": b,
        "المستفيدون المباشرون": direct,
        "إجمالي الأثر المجتمعي": direct + indirect,
      });
    }
    return data;
  }, [selectedCase, simulatedBudget, adjustedCostPerBeneficiary]);

  // Handle case selection change
  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCaseId(val);
    if (val !== "custom") {
      const c = cases.find(item => item.id === val);
      if (c) {
        setSimulatedBudget(c.amountRequired);
      }
    }
  };

  const [savedSimulations, setSavedSimulations] = useState<Array<any>>([]);

  const handleSaveSimulation = () => {
    const name = selectedCase 
      ? `الحالة رقم ${selectedCase.caseNumber}` 
      : `محاكاة مخصصة (${costPerBeneficiaryInfo.label})`;
    
    const newSim = {
      id: Date.now().toString(),
      name,
      municipality: selectedCase ? selectedCase.municipality : municipality,
      budget: simulationResult.budget,
      direct: simulationResult.directBeneficiaries,
      total: simulationResult.totalImpactCount,
      costPerPerson: simulationResult.costPerPerson,
      timestamp: new Date().toLocaleTimeString("ar-LY", { hour: '2-digit', minute: '2-digit' })
    };
    setSavedSimulations(prev => [newSim, ...prev].slice(0, 4));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6 text-right" id="impact-simulator-container">
      
      {/* Header section with branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-700 dark:text-blue-400">
              <Calculator className="w-5 h-5" />
            </span>
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              محاكي التنبؤ ومقاييس الأثر الاجتماعي التنموي
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-10">
            أداة حسابية تخطيطية لتقدير أعداد المستفيدين وعوائد التكافل بناءً على ميزانية الصرف المعتمدة لتقديم تقارير شفافة
          </p>
        </div>
        <span className="text-[10px] bg-blue-100/70 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 font-bold px-3 py-1 rounded-full font-mono self-start md:self-center border border-blue-200/40">
          نموذج تنبؤ إحصائي معتمد ✓
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl space-y-4">
            
            {/* Case Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-700 dark:text-gray-300">
                1. حدد حالة تابعة للجمعية للمحاكاة:
              </label>
              <select
                value={selectedCaseId}
                onChange={handleCaseChange}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="custom">⚙️ محاكاة سيناريو مخصص حر</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    📄 {c.caseNumber} - {c.needTypes.join(" & ")} ({c.amountRequired} د.ل)
                  </option>
                ))}
              </select>
            </div>

            {/* Custom inputs if 'custom' is selected */}
            {selectedCaseId === "custom" && (
              <div className="space-y-3 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                
                {/* Need type select */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">
                    تصنيف حاجة المستفيدين المقترحة:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                    {[
                      { key: "medical", label: "💊 طبية وصحية" },
                      { key: "nutrition", label: "🍞 سلة تموينية" },
                      { key: "housing", label: "🏠 إيجار وإيواء" },
                      { key: "education", label: "📚 تعليم وكتب" },
                      { key: "water", label: "💧 سقاية مياه" },
                      { key: "general", label: "🤝 نقد ومساعدات" },
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCustomNeedType(item.key)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                          customNeedType === item.key
                            ? "bg-blue-600 text-white border-transparent"
                            : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider for Budget */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700 dark:text-gray-300">ميزانية الصرف المقترحة:</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400">{simulatedBudget.toLocaleString()} د.ل</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={simulatedBudget}
                    onChange={(e) => setSimulatedBudget(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                    <span>500 د.ل</span>
                    <span>100,000 د.ل</span>
                  </div>
                </div>

              </div>
            )}

            {/* Quality Tier selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-700 dark:text-gray-300">
                2. نمط الصرف والكفاءة اللوجستية:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {[
                  { key: "lean", label: "📦 توريد مخفض / بالجملة", desc: "أقصى وفر وتغطية للمواد" },
                  { key: "standard", label: "⚖️ توازن قياسي متزن", desc: "تغطية جودة ممتازة بأسعار السوق" },
                  { key: "high", label: "🌟 جودة ممتازة / علاج خاص", desc: "أرقى معايير الخدمات والأجهزة" }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setQualityTier(item.key as any)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                      qualityTier === item.key
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-400 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-[10px] font-black block">{item.label}</span>
                    <span className="text-[8px] text-slate-400 block font-normal leading-tight mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency Modifier */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-black text-gray-700 dark:text-gray-300">3. مؤشر الحاجة الاستثنائي بالبلدية:</label>
                <span className="font-mono font-bold text-amber-600">x{urgencyFactor}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={urgencyFactor}
                onChange={(e) => setUrgencyFactor(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>قياسي (خارج الطوارئ)</span>
                <span>متأثر جداً / نزوح ونقص حاد</span>
              </div>
            </div>

          </div>

          {/* Action button to save */}
          <button
            type="button"
            onClick={handleSaveSimulation}
            className="w-full bg-[#0C447C] hover:bg-[#083461] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span>💾</span>
            <span>تضمين السيناريو المقدر في تقارير الشفافية المسودة</span>
          </button>
        </div>

        {/* Output & Charts Panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Results Board */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/20 dark:from-blue-950/10 dark:to-indigo-950/5 border border-blue-100/60 dark:border-blue-900/30 p-4 rounded-2xl flex flex-col justify-between text-right">
              <div className="space-y-0.5">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold block">مستفيدون مباشرون متوقعون</span>
                <span className="text-2xl font-black text-blue-900 dark:text-blue-300 font-mono block mt-1">
                  {simulationResult.directBeneficiaries.toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] text-blue-500 font-bold block mt-2 border-t border-blue-100/40 pt-1">
                تغطية {costPerBeneficiaryInfo.unit}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl flex flex-col justify-between text-right">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold block">أثر عائلي ومجتمعي غير مباشر</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white font-mono block mt-1">
                  {simulationResult.indirectBeneficiaries.toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-bold block mt-2 border-t border-slate-100/30 pt-1">
                أفراد الأسر والمن يعولون
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col justify-between text-right">
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold block">متوسط تكلفة الفرد الفعلي</span>
                <span className="text-xl font-black text-emerald-900 dark:text-emerald-400 font-mono block mt-1">
                  {simulationResult.costPerPerson} د.ل
                </span>
              </div>
              <span className="text-[9px] text-emerald-600 font-bold block mt-2 border-t border-emerald-100/30 pt-1">
                شاملاً النقل واللوجستيات
              </span>
            </div>
          </div>

          {/* Graphic prediction curves */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
              📊 منحنى عائد الأثر التنموي بالنسبة لميزانية الصرف:
            </span>
            <div className="h-[180px] w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-3" style={{ direction: "ltr" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSimulatorImpact" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis 
                    dataKey="الميزانية المستثمرة" 
                    tick={{ fontSize: 8, fontWeight: "mono" }} 
                    stroke="#64748b" 
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fontWeight: "mono" }} 
                    stroke="#64748b" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      textAlign: "right", 
                      borderRadius: "12px", 
                      fontSize: "10px", 
                      direction: "rtl",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="إجمالي الأثر المجتمعي" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSimulatorImpact)" 
                    name="إجمالي الأثر المتوقع"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="المستفيدون المباشرون" 
                    stroke="#059669" 
                    strokeWidth={1.5}
                    fill="none" 
                    name="المستفيد المباشر"
                  />
                  {/* Current budget reference line */}
                  <ReferenceLine x={simulationResult.budget} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'ميزانيتك', fill: '#d97706', fontSize: 8, position: 'top' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saved Simulation Drafts */}
          {savedSimulations.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-4 space-y-2.5">
              <span className="text-[10px] font-black text-gray-500 block uppercase tracking-wide">السيناريوهات المحفوظة مؤخراً للتقارير (مسودة):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {savedSimulations.map(sim => (
                  <div key={sim.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-3 rounded-xl flex justify-between items-center flex-row-reverse shadow-2sm">
                    <div className="text-right">
                      <span className="font-bold text-gray-800 dark:text-gray-200 block leading-tight">{sim.name}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">ميزانية {sim.budget.toLocaleString()} د.ل | {sim.timestamp}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold block">+{sim.total} مستفيد</span>
                      <button 
                        onClick={() => setSavedSimulations(prev => prev.filter(p => p.id !== sim.id))}
                        className="text-[9px] text-rose-500 hover:underline block mt-0.5"
                      >
                        حذف المسودة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
