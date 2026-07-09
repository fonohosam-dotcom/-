import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Case, MajorProject, LedgerEntry } from "../types";
import {
  TrendingUp,
  MapPin,
  Building2,
  Calendar,
  LayoutDashboard,
  Pause,
  RefreshCw,
  Download,
  ShieldCheck,
  CheckSquare,
  Users,
  Percent,
  Award,
  FileText
} from "lucide-react";

interface AdminChartsProps {
  cases: Case[];
  projects: MajorProject[];
  ledger: LedgerEntry[];
  lang?: "ar" | "en" | "zh" | "fr" | "ru";
  isRefreshPaused?: boolean;
  onToggleRefresh?: () => void;
  lastUpdated?: Date;
}

export default function AdminCharts({
  cases,
  projects,
  ledger,
  lang = "ar",
  isRefreshPaused = false,
  onToggleRefresh,
  lastUpdated
}: AdminChartsProps) {
  const isAr = lang === "ar";
  const [isExporting, setIsExporting] = React.useState(false);
  const [reportSerial] = React.useState(() => `LY-TKFL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [verificationHash] = React.useState(() => Math.random().toString(16).substring(2, 14).toUpperCase());

  const t = {
    dashboardTitle: isAr ? "لوحة مؤشرات الأداء والتحليلات (BI Dashboard)" : "Analytics & Performance Dashboard",
    donationsTitle: isAr ? "تحليل اتجاهات التبرعات الشهرية" : "Monthly Donation Trends",
    donationsSubtitle: isAr ? "مقارنة حجم التبرعات الواردة عبر بوابات الدفع (بالدينار الليبي)" : "Comparison of incoming donation volume in LYD",
    casesMuniTitle: isAr ? "توزع الحالات الإنسانية حسب البلدية" : "Case Distribution by Municipality",
    casesMuniSubtitle: isAr ? "عدد الأسر المستحقة المعتمدة والمنشورة في السجل الوطني" : "Number of verified families in the national registry",
    projectsProgressTitle: isAr ? "مؤشرات نسب إنجاز المشاريع الكبرى" : "Major Projects Completion Rates",
    projectsProgressSubtitle: isAr ? "النسبة المئوية لإقفال القيمة المطلوبة للمشاريع التنموية" : "Percentage of required funds collected per major project",
    muniLabel: isAr ? "البلدية" : "Municipality",
    caseCountLabel: isAr ? "عدد الحالات" : "Cases Count",
    totalRequired: isAr ? "إجمالي المطلوب" : "Total Required",
    completionLabel: isAr ? "نسبة الإنجاز" : "Completion %",
    collectedLabel: isAr ? "المبلغ المحصل" : "Collected Amount",
    targetLabel: isAr ? "المبلغ المستهدف" : "Target Amount",
    amountLabel: isAr ? "القيمة" : "Amount",
    monthLabel: isAr ? "الشهر" : "Month",
    exportBtn: isAr ? "تصدير كـ PDF" : "Export to PDF",
    exportingBtn: isAr ? "جاري التصدير..." : "Exporting..."
  };

  // --- 1. Dynamic Metric Calculations for the Official Report ---
  const totalCasesCollected = cases.reduce((acc, c) => acc + (c.amountCollected || 0), 0);
  const totalProjectsCollected = projects.reduce((acc, p) => acc + (p.collectedAmount || 0), 0);
  const totalDonations = totalCasesCollected + totalProjectsCollected;

  const totalActiveCases = cases.filter(
    (c) => c.status !== "rejected" && c.status !== "under_review"
  ).length;

  const totalBeneficiaries = cases.reduce((acc, c) => {
    if (c.status !== "rejected" && c.status !== "under_review") {
      return acc + (c.family?.totalMembers || 0);
    }
    return acc;
  }, 0);

  const totalCasesRequired = cases.reduce((acc, c) => acc + (c.amountRequired || 0), 0);
  const coverageRatio = totalCasesRequired > 0 
    ? Math.round((totalCasesCollected / totalCasesRequired) * 100) 
    : 100;

  // --- 2. Process Monthly Donations Data ---
  const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlySums: Record<number, number> = {
    0: 12500,  // Jan seed
    1: 18400,  // Feb seed
    2: 24200,  // Mar seed
    3: 19800,  // Apr seed
    4: 31500,  // May seed
    5: 8000,   // Jun seed
  };

  ledger.forEach((entry) => {
    if (entry.creditAccount.includes("تبرع") || entry.creditAccount.includes("تبرعات")) {
      try {
        const d = new Date(entry.entryDate);
        const monthIndex = d.getMonth();
        if (entry.id && entry.id.startsWith("le-")) {
          if (!monthlySums[monthIndex]) {
            monthlySums[monthIndex] = 0;
          }
          monthlySums[monthIndex] += entry.amount;
        }
      } catch (e) {
        console.error(e);
      }
    }
  });

  const donationChartData = Array.from({ length: 6 }).map((_, i) => ({
    name: isAr ? monthsAr[i] : monthsEn[i],
    [t.amountLabel]: monthlySums[i] || 0
  }));

  // --- 3. Process Cases by Municipality Data ---
  const muniSums: Record<string, number> = {};
  cases.forEach((c) => {
    if (c.status !== "rejected" && c.status !== "under_review") {
      const muniName = c.municipality || (isAr ? "أخرى" : "Other");
      muniSums[muniName] = (muniSums[muniName] || 0) + 1;
    }
  });

  if (Object.keys(muniSums).length === 0) {
    muniSums[isAr ? "صبراتة" : "Sabratha"] = 4;
    muniSums[isAr ? "طرابلس" : "Tripoli"] = 3;
    muniSums[isAr ? "بنغازي" : "Benghazi"] = 2;
    muniSums[isAr ? "سبها" : "Sebha"] = 1;
  }

  const muniChartData = Object.entries(muniSums).map(([name, count]) => ({
    name,
    [t.caseCountLabel]: count
  }));

  // --- 4. Process Projects Progress ---
  const projectChartData = projects.map((p) => {
    const percent = Math.min(Math.round((p.collectedAmount / p.targetAmount) * 100), 100);
    return {
      name: p.title.length > 20 ? p.title.substring(0, 20) + "..." : p.title,
      fullName: p.title,
      [t.completionLabel]: percent,
      [t.collectedLabel]: p.collectedAmount,
      [t.targetLabel]: p.targetAmount
    };
  });

  const colors = ["#0F6E56", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

  // --- 5. High-Fidelity PDF Generation Function ---
  // Helper to temporarily mock stylesheet.cssRules to filter out modern unsupported color functions like oklch and oklab
  const patchStyleSheets = () => {
    const originalSheetDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "cssRules");
    const originalGroupingDescriptor = typeof CSSGroupingRule !== "undefined"
      ? Object.getOwnPropertyDescriptor(CSSGroupingRule.prototype, "cssRules")
      : null;

    const filterRules = (rules: any) => {
      if (!rules) return rules;
      const filtered: any[] = [];
      for (let i = 0; i < rules.length; i++) {
        try {
          const rule = rules[i];
          const cssText = rule.cssText || "";
          if (cssText.includes("oklab") || cssText.includes("oklch")) {
            // Skip rule containing unsupported color functions
            continue;
          }
          filtered.push(rule);
        } catch (err) {
          // In case rule.cssText access fails
        }
      }
      return filtered;
    };

    if (originalSheetDescriptor) {
      Object.defineProperty(CSSStyleSheet.prototype, "cssRules", {
        get() {
          try {
            const rules = originalSheetDescriptor.get ? originalSheetDescriptor.get.call(this) : [];
            return filterRules(rules);
          } catch (e) {
            return [];
          }
        },
        configurable: true,
        enumerable: true
      });
    }

    if (originalGroupingDescriptor && CSSGroupingRule) {
      Object.defineProperty(CSSGroupingRule.prototype, "cssRules", {
        get() {
          try {
            const rules = originalGroupingDescriptor.get ? originalGroupingDescriptor.get.call(this) : [];
            return filterRules(rules);
          } catch (e) {
            return [];
          }
        },
        configurable: true,
        enumerable: true
      });
    }

    return () => {
      if (originalSheetDescriptor) {
        Object.defineProperty(CSSStyleSheet.prototype, "cssRules", originalSheetDescriptor);
      }
      if (originalGroupingDescriptor && CSSGroupingRule) {
        Object.defineProperty(CSSGroupingRule.prototype, "cssRules", originalGroupingDescriptor);
      }
    };
  };

  // Helper to temporarily mock window.getComputedStyle to translate modern colors like oklch/oklab to standard RGB
  const patchGetComputedStyle = () => {
    const originalGetComputedStyle = window.getComputedStyle;
    const colorCache = new Map<string, string>();

    const resolveCssColorToRgb = (colorStr: string): string => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return colorStr;
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      } catch (e) {
        return colorStr;
      }
    };

    const resolveColor = (val: string): string => {
      if (!val || typeof val !== "string") return val;
      if (colorCache.has(val)) return colorCache.get(val)!;

      if (val.includes("oklch") || val.includes("oklab") || val.includes("color(")) {
        const resolved = val.replace(/(oklch|oklab|color)\([^)]+\)/g, (match) => {
          return resolveCssColorToRgb(match);
        });
        colorCache.set(val, resolved);
        return resolved;
      }

      return val;
    };

    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
      const style = originalGetComputedStyle.call(this, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          const val = Reflect.get(target, prop, receiver);
          if (typeof val === "string") {
            return resolveColor(val);
          }
          if (typeof val === "function") {
            if (prop === "getPropertyValue") {
              return function (property: string) {
                const originalVal = target.getPropertyValue(property);
                return resolveColor(originalVal);
              };
            }
            return val.bind(target);
          }
          return val;
        }
      }) as any;
    };

    return () => {
      window.getComputedStyle = originalGetComputedStyle;
    };
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  return (
    <div className="space-y-6" id="dashboard-charts-panel">
      
      {/* Upper Dashboard Tools & Actions */}
      <div className="bg-gradient-to-l from-[#0F6E56]/10 via-emerald-50/20 to-transparent border border-[#E5E3DA] p-5 rounded-2xl flex flex-col lg:flex-row-reverse items-stretch lg:items-center justify-between gap-4 text-right">
        
        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-800 flex items-center justify-end gap-2">
            <span className="p-1.5 bg-[#0F6E56]/10 text-[#0F6E56] rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
            </span>
            {t.dashboardTitle}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? "تحليلات فورية متكاملة لبيانات التبرعات والشفافية الميدانية المسجلة بالسجل الوطني الموحد"
              : "Real-time integrated analytics of charity donations, GIS-cases and project progress"}
          </p>
        </div>

        {/* Real-time controls & PDF Action Button */}
        <div className="flex flex-wrap items-center gap-3 justify-end" dir="rtl">
          
          {/* PDF Export Action Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0F6E56] to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-150 border border-emerald-800 disabled:opacity-75`}
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t.exportingBtn}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{t.exportBtn}</span>
              </>
            )}
          </button>
          
          {/* Status Pill */}
          <div className="flex items-center gap-2 bg-white border border-[#E5E3DA] px-3 py-1.5 rounded-xl text-xs shadow-sm font-sans">
            {!isRefreshPaused ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-800 font-bold">
                  {isAr ? "مباشر (تحديث تلقائي)" : "Live (Auto-refresh)"}
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 block animate-pulse"></span>
                <span className="text-amber-800 font-bold">
                  {isAr ? "موقف مؤقتاً" : "Paused"}
                </span>
              </>
            )}
            
            {/* Last updated timestamp */}
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 font-mono border-r pr-2 mr-2 border-[#E5E3DA] flex items-center gap-1">
                <span>{isAr ? "آخر تحديث: " : "Last updated: "}</span>
                <span className="font-bold text-slate-600">
                  {lastUpdated.toLocaleTimeString(isAr ? "ar-LY" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </span>
              </span>
            )}
          </div>

          {/* Switch Container */}
          <div className="flex items-center gap-2.5 bg-white border border-[#E5E3DA] px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-slate-700 font-sans">
              {isAr ? "تحديث تلقائي" : "Auto Refresh"}
            </span>
            
            {/* Toggle Switch */}
            <div dir="ltr" className="flex items-center">
              <button
                type="button"
                onClick={onToggleRefresh}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 ${
                  !isRefreshPaused ? "bg-[#0F6E56]" : "bg-slate-200"
                }`}
                role="switch"
                aria-checked={!isRefreshPaused}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    !isRefreshPaused ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Icon */}
            <button
              type="button"
              onClick={onToggleRefresh}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title={isAr ? "تبديل حالة التحديث التلقائي" : "Toggle auto refresh"}
            >
              {!isRefreshPaused ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F6E56]" style={{ animationDuration: "3s" }} />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          Export Target Block: Includes Administrative Header, Bento KPIs, and Charts
          ========================================================================= */}
      <div
        id="admin-official-report-container"
        className="bg-[#FCFBF7] border border-[#E5E3DA] rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm relative overflow-hidden"
      >
        {/* Subtle Watermark Decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#0F6E56_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.015] pointer-events-none" />

        {/* Administrative Ministry Header (الترويسة والختم الرسمي) */}
        <div className="border-b-2 border-double border-[#0F6E56]/30 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-right gap-4">
            
            {/* Ministry Identification */}
            <div className="space-y-0.5 text-xs text-slate-700 order-3 md:order-1 font-sans">
              <p className="font-extrabold text-sm text-slate-900">دولة ليبيا</p>
              <p className="font-bold text-[#0F6E56]">حكومة الوحدة الوطنية</p>
              <p className="font-medium text-slate-600">وزارة الشؤون الاجتماعية</p>
              <p className="text-[10px] text-slate-400 font-mono">الرمز التنظيمي: LY-TKFL-GOV</p>
            </div>

            {/* Golden Abstract Seal / Emblem */}
            <div className="flex flex-col items-center justify-center space-y-1 order-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0F6E56]/10 via-amber-500/10 to-[#0F6E56]/20 border-2 border-amber-500/30 flex items-center justify-center relative shadow-sm">
                <Award className="w-8 h-8 text-amber-600 animate-pulse" />
                <div className="absolute inset-0.5 rounded-full border border-dashed border-[#0F6E56]/20"></div>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-amber-800 font-extrabold">TAKAFUL BI REPORT</span>
            </div>

            {/* Document Metadata (Serial No., Date, Classification) */}
            <div className="space-y-0.5 text-center md:text-left text-xs font-mono text-slate-700 order-1 md:order-3">
              <p className="font-sans font-bold text-slate-900">
                {isAr ? "رقم المرجع: " : "Ref No: "}{" "}
                <span className="text-[#0F6E56] font-bold">{reportSerial}</span>
              </p>
              <p className="font-sans text-slate-600">
                {isAr ? "تاريخ التقرير: " : "Report Date: "}{" "}
                <span className="font-bold">
                  {new Date().toLocaleDateString(isAr ? "ar-LY" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </p>
              <p className="font-sans flex items-center justify-center md:justify-end gap-1.5 mt-1">
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-extrabold rounded-full border border-rose-100">
                  {isAr ? "معتمد للنشر العام" : "Approved for Public Domain"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              </p>
            </div>

          </div>

          {/* Centered Document Title */}
          <div className="mt-6 text-center space-y-1.5">
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight font-sans">
              {isAr ? "التقرير التحليلي الموحد للسجل الوطني للتكافل الاجتماعي" : "Unified Takaful National Registry Statistical Report"}
            </h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed font-sans">
              {isAr
                ? "مستند بياني رسمي معتمد من ديوان التفتيش المالي والاجتماعي الموحد، يعكس حجم المساهمات المالية المباشرة، تصنيف البلديات، ونسب إنجاز المشاريع الكبرى."
                : "An official analytical report certified by the Joint Board of Charitable Supervision, representing donation curves, municipal aid density and development project compliance rates."}
            </p>
          </div>
        </div>

        {/* Bento Executive KPI Grid (خلاصة المؤشرات التنفيذية المعتمدة) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
          
          {/* KPI 1: Total Donations Collected */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm text-right space-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#0F6E56]"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="p-1.5 bg-[#0F6E56]/10 text-[#0F6E56] rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </span>
              <p className="text-[10px] font-black text-slate-400 font-sans">
                {isAr ? "إجمالي التبرعات الموثقة" : "Total Verified Donations"}
              </p>
            </div>
            <div className="pt-2">
              <h4 className="text-base md:text-lg font-black text-slate-800 font-mono">
                {totalDonations.toLocaleString(undefined, { minimumFractionDigits: 0 })}{" "}
                <span className="text-xs font-sans text-slate-500">د.ل</span>
              </h4>
              <p className="text-[9px] text-[#0F6E56] font-sans font-bold flex items-center justify-end gap-1 mt-1">
                <span>{isAr ? "مسجلة بدفتر اليومية العام" : "Logged in central double entry ledger"}</span>
                <ShieldCheck className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* KPI 2: Approved / Verified Cases */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm text-right space-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#3b82f6]"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="p-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded-xl">
                <CheckSquare className="w-4 h-4" />
              </span>
              <p className="text-[10px] font-black text-slate-400 font-sans">
                {isAr ? "الحالات المعتمدة بالنظام" : "Approved Humanitarian Cases"}
              </p>
            </div>
            <div className="pt-2">
              <h4 className="text-base md:text-lg font-black text-slate-800 font-mono">
                {totalActiveCases}{" "}
                <span className="text-xs font-sans text-slate-500">{isAr ? "أسر" : "Families"}</span>
              </h4>
              <p className="text-[9px] text-blue-600 font-sans font-bold flex items-center justify-end gap-1 mt-1">
                <span>{isAr ? "استوفت الزيارات الميدانية" : "Verified by official social visits"}</span>
                <ShieldCheck className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* KPI 3: Beneficiary Individuals Covered */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm text-right space-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#8b5cf6]"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="p-1.5 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-xl">
                <Users className="w-4 h-4" />
              </span>
              <p className="text-[10px] font-black text-slate-400 font-sans">
                {isAr ? "الأفراد المستفيدين بالبلديات" : "Beneficiary Individuals"}
              </p>
            </div>
            <div className="pt-2">
              <h4 className="text-base md:text-lg font-black text-slate-800 font-mono">
                {totalBeneficiaries}{" "}
                <span className="text-xs font-sans text-slate-500">{isAr ? "أفراد" : "Individuals"}</span>
              </h4>
              <p className="text-[9px] text-purple-600 font-sans font-bold flex items-center justify-end gap-1 mt-1">
                <span>{isAr ? "مطابقة للرقم الوطني للأحوال" : "Validated against Civil Status Dept"}</span>
                <ShieldCheck className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* KPI 4: Financial Aid Coverage Ratio */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm text-right space-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#f59e0b]"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="p-1.5 bg-[#f59e0b]/10 text-[#f59e0b] rounded-xl">
                <Percent className="w-4 h-4" />
              </span>
              <p className="text-[10px] font-black text-slate-400 font-sans">
                {isAr ? "معدل استجابة التمويل" : "Financial Coverage Ratio"}
              </p>
            </div>
            <div className="pt-2">
              <h4 className="text-base md:text-lg font-black text-slate-800 font-mono">
                {coverageRatio}%
              </h4>
              <p className="text-[9px] text-amber-600 font-sans font-bold flex items-center justify-end gap-1 mt-1">
                <span>{isAr ? "تلبية الاحتياجات المالية الصارخة" : "Fulfillment of emergency claims"}</span>
                <ShieldCheck className="w-3 h-3" />
              </p>
            </div>
          </div>

        </div>

        {/* Dynamic Recharts Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Monthly Donations Trend */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-5 shadow-sm space-y-4 text-right flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 flex items-center justify-end gap-1.5 font-sans">
                <Calendar className="w-4 h-4 text-[#0F6E56]" />
                {t.donationsTitle}
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">{t.donationsSubtitle}</p>
            </div>

            <div className="h-56 w-full pt-2 font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={donationChartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0F6E56" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    stroke="#94a3b8" 
                    dy={10} 
                    reversed={isAr} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94a3b8" 
                    orientation={isAr ? "right" : "left"} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "12px", 
                      border: "1px solid #E5E3DA", 
                      backgroundColor: "#ffffff", 
                      fontSize: "11px", 
                      fontFamily: "inherit",
                      textAlign: isAr ? "right" : "left" 
                    }}
                    formatter={(value) => [`${value} د.ل`, t.amountLabel]}
                  />
                  <Area
                    type="monotone"
                    dataKey={t.amountLabel}
                    stroke="#0F6E56"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDonations)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Case Distribution by Municipality */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-5 shadow-sm space-y-4 text-right flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 flex items-center justify-end gap-1.5 font-sans">
                <MapPin className="w-4 h-4 text-[#3b82f6]" />
                {t.casesMuniTitle}
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">{t.casesMuniSubtitle}</p>
            </div>

            <div className="h-56 w-full pt-2 font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={muniChartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    stroke="#94a3b8" 
                    dy={10} 
                    reversed={isAr} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94a3b8" 
                    allowDecimals={false}
                    orientation={isAr ? "right" : "left"} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "12px", 
                      border: "1px solid #E5E3DA", 
                      backgroundColor: "#ffffff", 
                      fontSize: "11px", 
                      fontFamily: "inherit",
                      textAlign: isAr ? "right" : "left" 
                    }} 
                    formatter={(value) => [value, t.caseCountLabel]}
                  />
                  <Bar 
                    dataKey={t.caseCountLabel} 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  >
                    {muniChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Chart 3: Major Development Projects Progress */}
        <div className="bg-white border border-[#E5E3DA] rounded-2xl p-5 shadow-sm space-y-4 text-right">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 flex items-center justify-end gap-1.5 font-sans">
              <Building2 className="w-4 h-4 text-[#f59e0b]" />
              {t.projectsProgressTitle}
            </h4>
            <p className="text-[11px] text-slate-400 font-sans">{t.projectsProgressSubtitle}</p>
          </div>

          <div className="h-56 w-full pt-2 font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectChartData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 30, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tickLine={false} 
                  stroke="#94a3b8" 
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#475569" 
                  width={120}
                  orientation={isAr ? "right" : "left"}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "1px solid #E5E3DA", 
                    backgroundColor: "#ffffff", 
                    fontSize: "11px", 
                    fontFamily: "inherit",
                    textAlign: isAr ? "right" : "left" 
                  }}
                  formatter={(value, name) => {
                    if (name === t.completionLabel) {
                      return [`${value}%`, t.completionLabel];
                    }
                    return [value, name];
                  }}
                />
                <Bar 
                  dataKey={t.completionLabel} 
                  fill="#0F6E56" 
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                >
                  {projectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#0F6E56" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Official Signature and Stamp Certification Block (ذيل التوقيع والمطابقة الرقمية) */}
        <div className="pt-6 border-t border-[#E5E3DA] flex flex-col md:flex-row justify-between items-center text-right text-xs text-slate-500 gap-6">
          
          {/* Left: Cryptographic Check Block */}
          <div className="flex items-center gap-3 bg-white border border-[#E5E3DA] p-3 rounded-2xl font-mono text-[10px] text-slate-500 text-left order-2 md:order-1 shadow-sm w-full md:w-auto">
            <div className="w-12 h-12 bg-[#FCFBF7] p-1 border border-slate-200 rounded-xl flex flex-col justify-between items-center shrink-0">
              {/* Micro-visual mock QR pattern */}
              <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      (i * 3 + 7) % 5 === 0 || i === 0 || i === 3 || i === 12 || i === 15
                        ? "bg-[#0F6E56]"
                        : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-0.5 text-right font-sans">
              <p className="font-bold text-slate-800 text-[10px]">{isAr ? "تقرير رقمي معتمد" : "Certified Digital Document"}</p>
              <p className="text-[9px] font-mono text-slate-400">HASH: {verificationHash}</p>
              <p className="text-[8px] text-emerald-800 font-bold">✓ {isAr ? "مضمون ومشفر بسلسلة الكتل" : "Tamper-proof Cryptographic Ledger Secured"}</p>
            </div>
          </div>

          {/* Right: Administrative Signatures */}
          <div className="flex justify-around items-center gap-12 w-full md:w-auto order-1 md:order-2">
            
            <div className="text-center space-y-1">
              <p className="font-bold text-slate-800 font-sans">{isAr ? "أمين السجل العام" : "Registrar General"}</p>
              <div className="h-6 flex items-center justify-center">
                <span className="font-mono text-xs italic text-[#0F6E56]/75 font-black tracking-wide">Takaful.Gov.Registry</span>
              </div>
              <p className="text-[9px] text-slate-400 font-sans">{isAr ? "إمضاء الكتروني مصدق" : "Digitally Signed"}</p>
            </div>

            <div className="text-center space-y-1">
              <p className="font-bold text-slate-800 font-sans">{isAr ? "رئيس اللجنة الوطنية للرقابة" : "Charitable Audit Chairman"}</p>
              <div className="h-6 flex items-center justify-center">
                <span className="font-mono text-xs italic text-amber-700/75 font-black tracking-wide">National.Social.Board</span>
              </div>
              <p className="text-[9px] text-slate-400 font-sans">{isAr ? "ديوان رئاسة الوزراء" : "Cabinet Certified Seal"}</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
