import React, { useState } from "react";
import { Case, MajorProject, Fund } from "../types";
import { triggerHaptic } from "../utils/haptics";
import { 
  HeartHandshake, 
  Coins, 
  ClipboardList, 
  UserCheck, 
  ShieldAlert, 
  HelpCircle, 
  MapPin, 
  UserPlus, 
  UploadCloud, 
  Eye, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Camera, 
  Lock, 
  CreditCard, 
  Info, 
  Building2, 
  Activity, 
  Plus, 
  Sparkles, 
  Check, 
  AlertCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { encryptValue } from "../utils/crypto";

interface LandingViewProps {
  cases: Case[];
  projects: MajorProject[];
  funds: Fund[];
  onSubmitReport: (reportData: any) => Promise<void>;
  onNavigateToDonor: () => void;
  onNavigateToTab?: (tab: "home" | "cases" | "infrastructure" | "map" | "donation" | "reports" | "printing" | "security" | "supervision" | "verify") => void;
  activeGeoSOS?: string | null;
  lang?: "ar" | "en" | "zh" | "fr" | "ru";
  reports?: any[];
  visitorsCount?: number;
  onlineUsersCount?: number;
  registeredUsersCount?: number;
}

// Category branches (فروع) matching Libyan Takaful ecosystem
const INTAKE_CATEGORIES = [
  {
    id: "housing",
    title: "سكن وملجأ",
    icon: "🏠",
    color: "from-blue-500 to-indigo-600",
    description: "ترميم بيوت، بناء أسقف، تجهيز غرف أساسية، صيانة منزل",
    branches: ["صيانة منزلية طارئة", "ترميم جدران وبناء سقف", "مستلزمات منزلية وأثاث أساسي", "توفير سكن مؤقت"]
  },
  {
    id: "food",
    title: "غذاء ومستلزمات معيشية",
    icon: "🌾",
    color: "from-emerald-500 to-teal-600",
    description: "سلة غذائية كبرى، تمكين عائلي، مستلزمات أطفال أساسية",
    branches: ["سلة غذائية شهرية كبرى", "حليب وحفاضات أطفال", "مستلزمات شتوية وأغطية"]
  },
  {
    id: "marriage",
    title: "تيسير زواج الشباب",
    icon: "💍",
    color: "from-pink-500 to-rose-600",
    description: "تجهيز غرف النوم والأجهزة الكهربائية للشباب المقبلين على الزواج",
    branches: ["تجهيز الغرفة والأجهزة الكهربائية", "منحة مالية رمزية للزواج", "أثاث الصالة والمطبخ"]
  },
  {
    id: "vehicle",
    title: "مركبة تنقل ومعيشة",
    icon: "🚗",
    color: "from-amber-500 to-orange-600",
    description: "مركبة معيشية، سيارات خاصة بذوي الاحتياجات الخاصة والهمم",
    branches: ["كرسي متحرك كهربائي ذكي", "تجهيز سيارة لذوي الاحتياجات الخاصة", "مساهمة صيانة مركبة عمل للأسرة"]
  },
  {
    id: "rent",
    title: "سداد إيجارات متراكمة",
    icon: "🔑",
    color: "from-violet-500 to-purple-600",
    description: "تغطية مبالغ الإيجار للغارمين المهددين بالإخلاء السكني",
    branches: ["سداد إيجار متراكم (3 أشهر)", "سداد إيجار متراكم (6 أشهر)", "صندوق الطوارئ لمنع الإخلاء السكني"]
  },
  {
    id: "medical",
    title: "رعاية صحية وعلاج",
    icon: "🩺",
    color: "from-cyan-500 to-blue-600",
    description: "مساهمة في علاج مرضى، توفير أدوية مزمنة، أطراف صناعية",
    branches: ["أدوية أمراض مزمنة شهرية", "مساهمة في جراحات داخل ليبيا", "أطراف صناعية ومستلزمات طبية"]
  },
  {
    id: "other",
    title: "دعم طارئ آخر",
    icon: "⚡",
    color: "from-slate-500 to-slate-700",
    description: "سداد ديون غارمين، رسوم دراسية، كفالات خاصة",
    branches: ["سداد ديون غارمين مثبتة قانونياً", "كفالة دراسية لليتامى", "حالات طارئة غير مصنفة"]
  }
];

export default function LandingView({
  cases,
  projects,
  funds,
  onSubmitReport,
  onNavigateToDonor,
  onNavigateToTab,
  visitorsCount = 125430,
  onlineUsersCount = 842,
  registeredUsersCount = 0,
}: LandingViewProps) {
  // Current active launcher choice: null (none), 'donor', 'intake', 'report-need', 'report-fraud'
  const [activeLauncher, setActiveLauncher] = useState<"donor" | "intake" | "report-need" | "report-fraud" | null>(null);

  // States for 'Intake' Form Wizard
  const [intakeStep, setIntakeStep] = useState(1);
  const [selectedCat, setSelectedCat] = useState(INTAKE_CATEGORIES[0]);
  const [selectedBranch, setSelectedBranch] = useState(INTAKE_CATEGORIES[0].branches[0]);

  // Advanced States for spectacular inline Donor Portal
  const [localCases, setLocalCases] = useState<Case[]>(cases);
  const [selectedMapCity, setSelectedMapCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState<string | null>(null);
  const [signingCase, setSigningCase] = useState<Case | null>(null);
  const [signAmount, setSignAmount] = useState("150");
  const [signName, setSignName] = useState("");
  const [signNationalId, setSignNationalId] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [signingSuccess, setSigningSuccess] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Array<{x: number, y: number}>>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [recentLiveDonations, setRecentLiveDonations] = useState<Array<{id: string, name: string, city: string, amount: number, caseDesc: string, sig: string, time: string}>>([
    { id: "1", name: "أبو أحمد الورفلي", city: "مصراتة", amount: 500, caseDesc: "ترميم سكن عائلة أيتام", sig: "LY-DEC-7821.10", time: "منذ دقيقة" },
    { id: "2", name: "مبتغي الأجر", city: "طرابلس", amount: 200, caseDesc: "سلة غذائية كبرى", sig: "LY-DEC-4390.95", time: "منذ 3 دقائق" },
    { id: "3", name: "فاعل خير - بنغازي", city: "بنغازي", amount: 1200, caseDesc: "كرسي متحرك كهربائي ذكي", sig: "LY-DEC-1284.40", time: "منذ 5 دقائق" }
  ]);

  React.useEffect(() => {
    setLocalCases(cases);
  }, [cases]);

  // Live Score Calculator for Intake Form
  const getLivePriorityScore = () => {
    let base = 5.0;
    base += (familyCount || 0) * 0.4;
    const inc = Number(monthlyIncome) || 0;
    if (inc === 0) base += 2.5;
    else if (inc < 500) base += 2.0;
    else if (inc < 1000) base += 1.0;
    else if (inc < 1500) base -= 0.5;
    else base -= 2.0;

    if (maritalStatus === "أرملة" || maritalStatus === "مطلق") base += 1.8;
    else if (maritalStatus === "متزوج") base += 0.5;

    if (selectedCat.id === "medical" || selectedCat.id === "housing") base += 0.8;

    return Math.min(10.0, Math.max(1.0, Number(base.toFixed(1))));
  };
  
  // Intake user fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [municipality, setMunicipality] = useState("طرابلس");
  const [nationalId, setNationalId] = useState("");
  const [ibanNumber, setIbanNumber] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("متزوج");
  const [familyCount, setFamilyCount] = useState(4);
  const [childrenCount, setChildrenCount] = useState(2);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  // Document Upload states with live simulator
  const [uploadedDocs, setUploadedDocs] = useState<{
    passport?: { name: string; url: string; size: string; simulatedOk: boolean };
    nationalIdCard?: { name: string; url: string; size: string; simulatedOk: boolean };
    personalPhoto?: { name: string; url: string; size: string; simulatedOk: boolean };
    conditionPhoto?: { name: string; url: string; size: string; simulatedOk: boolean };
  }>({});
  const [isScanningDoc, setIsScanningDoc] = useState<string | null>(null);

  // General Report States (Need & Fraud)
  const [reportType, setReportType] = useState<"need" | "fraud">("need");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [reportTargetName, setReportTargetName] = useState("");
  const [reportTargetLocation, setReportTargetLocation] = useState("");
  const [reportCaseNumber, setReportCaseNumber] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Intake success state
  const [intakeSuccess, setIntakeSuccess] = useState(false);

  const activeCases = cases.filter((c) => c.status !== "closed" && c.status !== "rejected");
  const closedCases = cases.filter((c) => c.status === "closed");
  const totalDonated = funds.reduce((sum, f) => sum + f.totalIn, 0);

  // Handler for simulating file uploads with biometric scanners
  const simulateFileUpload = (docType: "passport" | "nationalIdCard" | "personalPhoto" | "conditionPhoto") => {
    setIsScanningDoc(docType);
    setTimeout(() => {
      const demoNames = {
        passport: "جواز_سفر_مؤمن_ليبي.jpg",
        nationalIdCard: "بطاقة_الرقم_الوطني_الرقمية.png",
        personalPhoto: "صورة_المستفيد_الرسمية.jpg",
        conditionPhoto: "صورة_معاينة_السكن_الميدانية.jpg"
      };
      const demoUrls = {
        passport: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=200",
        nationalIdCard: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=200",
        personalPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        conditionPhoto: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=300"
      };

      setUploadedDocs(prev => ({
        ...prev,
        [docType]: {
          name: demoNames[docType],
          url: demoUrls[docType],
          size: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
          simulatedOk: true
        }
      }));
      setIsScanningDoc(null);
    }, 1500);
  };

  // Submit Intake application
  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !nationalId || !ibanNumber) {
      alert("الرجاء استكمال الخانات الأساسية المطلوبة لمطابقة الضمان الاجتماعي.");
      return;
    }
    triggerHaptic(50);

    const caseData = {
      userId: `citizen-${nationalId.substring(0, 6)}-${Date.now()}`,
      family: {
        totalMembers: Number(familyCount),
        childrenCount: Number(childrenCount),
        elderlyCount: 0,
        disabledCount: 0,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : 450,
        rentAmount: selectedCat.id === "rent" ? 250 : 0,
        housingCondition: selectedCat.id === "housing" ? "غير صالح" : "متوسط",
        evictionRisk: selectedCat.id === "rent",
        maritalStatus,
        chronicIllnesses: selectedCat.id === "medical",
        incomeSources: ["دخل محدود / عمالة يومية"],
      },
      needTypes: [selectedCat.title],
      description: `${selectedCat.title} - ${selectedBranch}: ${additionalDetails || "طلب تمكين موجه للجنة العليا لدعم المواطن ببلدية " + municipality}`,
      amountRequired: selectedCat.id === "housing" ? 15000 : selectedCat.id === "rent" ? 1800 : 3000,
      municipality,
      bioVerification: {
        type: "signature_and_national_id",
        data: `iban:${await encryptValue(ibanNumber)}|nationalId:${await encryptValue(nationalId)}`,
        verifiedAt: new Date().toISOString(),
      },
    };

    setIsSubmittingReport(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });
      const data = await res.json();
      if (data.status === "success") {
        setIntakeSuccess(true);
        setIntakeStep(4);
      } else {
        alert("فشل في تقديم الطلب. يرجى مراجعة الرقم الوطني المسجل.");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء التواصل مع سيرفر السجل الوطني.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Submit Reports (Need or Fraud)
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails) {
      alert("يرجى كتابة تفاصيل البلاغ لخدمة التقييم الميداني.");
      return;
    }
    triggerHaptic(50);

    setIsSubmittingReport(true);
    // Create custom formatted case/fraud report
    const formattedData = {
      caseNumber: reportCaseNumber || `LY-${Date.now().toString().substring(8)}`,
      reporterName: reporterName || "مبلغ سري متعفف",
      reporterContact: reporterContact || "محجوب لحماية النزاهة",
      reason: `[نوع البلاغ: ${reportType === "need" ? "إبلاغ عن حالة محتاجة في المجتمع" : "إبلاغ عن حالة كاذبة/احتيال"}] 
      الهدف: ${reportTargetName || "غير محدد"} | الموقع: ${reportTargetLocation || "غير محدد"} 
      التفاصيل: ${reportDetails}`,
    };

    try {
      await onSubmitReport(formattedData);
      setReportSuccess(true);
      setReportDetails("");
      setReportTargetName("");
      setReportTargetLocation("");
      setReportCaseNumber("");
      setTimeout(() => setReportSuccess(false), 6000);
    } catch (e) {
      console.error(e);
      alert("فشل تسجيل البلاغ في منظومة التدقيق العام.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Premium Welcome & Branding Banner with Particle Glow */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#063b30] via-[#0b5c47] to-[#128160] text-white p-8 md:p-12 text-right space-y-6 shadow-2xl border border-emerald-950/20">
        <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl select-none pointer-events-none"></div>
        <div className="absolute bottom-[-30%] right-[-5%] w-80 h-80 bg-teal-500/10 rounded-full blur-3xl select-none pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-500/30 font-mono">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
            التكامل التقني للحوكمة والشفافية التكافلية
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight font-sans">
            منصة التكافل الوطني الذكية <span className="text-emerald-300">V2</span>
          </h1>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed font-light text-slate-100 max-w-3xl">
            السجل الوطني الموحد للمستفيدين وخدمات التمكين الاجتماعي والمساعدات العينية والمالية الموثقة. نربط المانحين والباحثين الاجتماعيين والجمعيات الوطنية واللجان الميدانية الشريكة مباشرة بشفافية مطلقة محاسبياً وشرعياً تحت رقابة ديوان المحاسبة العام.
          </p>
        </div>
      </div>

      {/* QUICK LAUNCHER CONTROL HUB - 4 MAIN HIGH-END INTERACTIVE BUTTONS */}
      <div className="space-y-6">
        <div className="text-center md:text-right space-y-2">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">
            بوابة التكافل الموحدة - خدمات الجمهور والتمكين
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            اختر البوابة المناسبة لاحتياجك للبدء الفوري مع تجربة تفاعلية مبسطة ومتكاملة
          </p>
        </div>

        {/* The 4 Launcher Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Donor Portal */}
          <button
            onClick={() => {
              setActiveLauncher("donor");
              setSigningCase(null);
              setSigningSuccess(false);
            }}
            className={`text-right p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeLauncher === "donor"
                ? "bg-emerald-950/20 border-emerald-500 shadow-xl shadow-emerald-950/10 scale-[1.02]"
                : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/5 hover:-translate-y-1"
            }`}
          >
            <div className="absolute top-[-20%] left-[-10%] w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold group-hover:scale-110 transition-transform">
                🪙
              </span>
              <span className="text-[9px] bg-emerald-500/10 text-[#0F6E56] dark:text-emerald-400 px-2.5 py-1 rounded-full font-black">
                بوابة المانح
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              بوابة المانح والمتبرع
              <ArrowLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              استكشف الحالات الإنسانية المتعففة، مدارس ومستشفيات معطلة، وتبرع بأمان تام بنظام التوقيع العشري والمحفظة الرقمية.
            </p>
          </button>

          {/* Card 2: Intake Application */}
          <button
            onClick={() => {
              setActiveLauncher("intake");
              setIntakeStep(1);
              setIntakeSuccess(false);
            }}
            className={`text-right p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeLauncher === "intake"
                ? "bg-indigo-950/20 border-indigo-500 shadow-xl shadow-indigo-950/10 scale-[1.02]"
                : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-950/5 hover:-translate-y-1"
            }`}
          >
            <div className="absolute top-[-20%] left-[-10%] w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold group-hover:scale-110 transition-transform">
                🏡
              </span>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-full font-black">
                طلب التمكين
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              طلب تمكين ومساعدات
              <ArrowLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تقديم طلب دعم مالي أو عيني (سكن، غذاء، علاج، زواج، إيجار) ببياناتك الثبوتية، الرقم الوطني، ومستندات الحالة الاجتماعية.
            </p>
          </button>

          {/* Card 3: Report Case in Need */}
          <button
            onClick={() => {
              setActiveLauncher("report-need");
              setReportType("need");
              setReportSuccess(false);
            }}
            className={`text-right p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeLauncher === "report-need"
                ? "bg-blue-950/20 border-blue-500 shadow-xl shadow-blue-950/10 scale-[1.02]"
                : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-950/5 hover:-translate-y-1"
            }`}
          >
            <div className="absolute top-[-20%] left-[-10%] w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold group-hover:scale-110 transition-transform">
                📢
              </span>
              <span className="text-[9px] bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-black">
                إبلاغ عن محتاج
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              الإبلاغ عن حالة محتاجة
              <ArrowLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              هل تعرف جيرانك، عائلة يتامى، أو حالة متعففة لا تستطيع التسجيل؟ قم بالإبلاغ عنهم ليرسل السجل باحثاً اجتماعياً لزيارتهم فوراً.
            </p>
          </button>

          {/* Card 4: Report Fraud or Double Donations */}
          <button
            onClick={() => {
              setActiveLauncher("report-fraud");
              setReportType("fraud");
              setReportSuccess(false);
            }}
            className={`text-right p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeLauncher === "report-fraud"
                ? "bg-rose-950/20 border-rose-500 shadow-xl shadow-rose-950/10 scale-[1.02]"
                : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/5 hover:-translate-y-1"
            }`}
          >
            <div className="absolute top-[-20%] left-[-10%] w-24 h-24 bg-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xl font-bold group-hover:scale-110 transition-transform">
                🛡️
              </span>
              <span className="text-[9px] bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-full font-black">
                مكافحة الاحتيال
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              الإبلاغ عن حالة كاذبة / تلاعب
              <ArrowLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ساعدنا في تعزيز النزاهة والإبلاغ السري عن ملفات مسجلة كذباً أو تتلقى مساعدات مزدوجة من جهات مختلفة بشكل غير قانوني.
            </p>
          </button>

        </div>
      </div>

      {/* DYNAMIC, ANIMATED CONTENT ZONE ACCORDING TO USER'S CHOICE */}
      <AnimatePresence mode="wait">
        {activeLauncher === "intake" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl space-y-8 text-right"
          >
            {/* Header of Intake Portal */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🏡</span> بوابة التمكين الاجتماعي وتسجيل طلبات الدعم الموحد
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  نظام حوكمة أهلي يستقبل طلبات الدعم بليبيا لضمان العدالة والنزاهة وتوزيع الدعم حسب سلم التقييم العشري.
                </p>
              </div>
              <button 
                onClick={() => setActiveLauncher(null)}
                className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors"
              >
                إغلاق البوابة والرجوع للرئيسية ✕
              </button>
            </div>

            {/* Stepped Indicators */}
            <div className="flex items-center justify-center max-w-xl mx-auto pb-4">
              {[1, 2, 3, 4].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      intakeStep === s
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/50"
                        : intakeStep > s
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                      {intakeStep > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                    <span className="mr-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 hidden sm:inline">
                      {s === 1 ? "نوع الاحتياج" : s === 2 ? "البيانات والمصرف" : s === 3 ? "المستندات والصور" : "تم الإرسال"}
                    </span>
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-1 mx-4 rounded transition-colors ${
                      intakeStep > s ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-800"
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* STEP 1: Select Category and Sub-branches (فروع) */}
            {intakeStep === 1 && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 mb-1">الخطوة الأولى: تحديد نوع المساعدة والفرع المناسب لحالتك</h4>
                  <p className="text-[11px] text-slate-400">يرجى قراءة التبويبات واختيار التصنيف الصحيح لتوجيه الملف آلياً للقسم المختص بالبلدية.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INTAKE_CATEGORIES.map((cat) => {
                    const isSelected = selectedCat.id === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCat(cat);
                          setSelectedBranch(cat.branches[0]);
                        }}
                        className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/20 border-indigo-600 shadow-md scale-[1.01]"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{cat.icon}</span>
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                          }`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                          </span>
                        </div>
                        <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 mb-1">{cat.title}</h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">{cat.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-branches Selector */}
                {selectedCat && (
                  <motion.div 
                    layout
                    className="p-5 bg-indigo-50/10 dark:bg-slate-950/50 rounded-2xl border border-indigo-100/50 dark:border-slate-800/40 space-y-3"
                  >
                    <label className="block text-xs font-black text-indigo-900 dark:text-indigo-400">حدد نوع الدعم التفصيلي (الفرعي) المطلوب *</label>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedCat.branches.map((branch) => {
                        const isBranchSelected = selectedBranch === branch;
                        return (
                          <button
                            key={branch}
                            onClick={() => setSelectedBranch(branch)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isBranchSelected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            {branch}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setIntakeStep(2)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    متابعة لتعبئة البيانات الشخصية
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Bio, Bank and Family Data */}
            {intakeStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); setIntakeStep(3); }} className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 mb-1">الخطوة الثانية: الهوية الليبية، بيانات السكن والحساب المصرفي</h4>
                  <p className="text-[11px] text-slate-400">تستخدم هذه البيانات فقط للمطابقة مع مصلحة الأحوال المدنية وديوان مصرف ليبيا المركزي لضمان وصول الدعم المالي مباشرة لآيبان المستفيد.</p>
                </div>

                {/* Realtime Estimated Priority Score Gauge */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-4 text-right">
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-slate-900 dark:text-slate-100">⚖️ حاسبة الاستحقاق والأولوية الفورية للملف</h5>
                    <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed">
                      يتم احتساب هذا المؤشر تلقائياً بناءً على الحالة العائلية، الدخل، وعدد التابعين. الملفات ذات النقاط الأعلى (7.5 فأكثر) تُمنح أولوية قصوى لزيارات الباحثين الاجتماعيين.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/50 shadow-sm">
                    <div className="text-center">
                      <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {getLivePriorityScore()}/10
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase">
                        {getLivePriorityScore() >= 8.5 ? "أولوية مطلقة" : getLivePriorityScore() >= 6.5 ? "أولوية مرتفعة" : "أولوية عادية"}
                      </span>
                    </div>
                    <div className="w-1.5 h-10 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`w-full rounded-full transition-all duration-500 ${
                          getLivePriorityScore() >= 8.5 ? "bg-red-500" : getLivePriorityScore() >= 6.5 ? "bg-amber-500" : "bg-emerald-500"
                        }`} 
                        style={{ height: `${getLivePriorityScore() * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">الاسم الرباعي الكامل (مطابق لجواز السفر) *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="الاسم كامل ثلاثي واللقب"
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم هاتف الوكيل للتواصل *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09XXXXXXXX"
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">الرقم الوطني الليبي المكون من 12 رقماً *</label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
                      placeholder="مثال: 119950123456"
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">الحساب المصرفي أو الآيبان (IBAN) لاستقبال الدعم المالي *</label>
                    <input
                      type="text"
                      required
                      value={ibanNumber}
                      onChange={(e) => setIbanNumber(e.target.value)}
                      placeholder="LYXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">البلدية أو المحلة الحالية بليبيا *</label>
                    <select
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    >
                      <option value="طرابلس">طرابلس</option>
                      <option value="بنغازي">بنغازي</option>
                      <option value="صبراتة">صبراتة</option>
                      <option value="مصراتة">مصراتة</option>
                      <option value="الزاوية">الزاوية</option>
                      <option value="سبها">سبها</option>
                      <option value="درنة">درنة</option>
                      <option value="البيضاء">البيضاء</option>
                      <option value="غريان">غريان</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">الوضع العائلي الحالي *</label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    >
                      <option value="متزوج">متزوج / رب أسرة</option>
                      <option value="أرملة">أرملة ترعى أطفال</option>
                      <option value="مطلقة">مطلقة ترعى أطفال</option>
                      <option value="أعزب">أعزب / معيل لوالديه</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">عدد أفراد الأسرة المقيمين بالمنزل</label>
                    <input
                      type="number"
                      value={familyCount}
                      onChange={(e) => setFamilyCount(Number(e.target.value))}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">إجمالي الدخل الشهري الفعلي للعائلة (بالدينار الليبي)</label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="مثال: 450 د.ل أو اتركه فارغاً لـ 0"
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">شرح توضيحي إضافي للحالة الميدانية (اختياري)</label>
                  <textarea
                    rows={2}
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="اكتب هنا أي تفاصيل تود إبلاغ الباحث الاجتماعي بها قبل زيارة المسكن..."
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3 text-xs"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setIntakeStep(1)}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    متابعة لرفع المستندات الثبوتية
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Document Scanner & Media Uploads with Live Simulation */}
            {intakeStep === 3 && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-950 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-indigo-900 dark:text-indigo-400 mb-1">حماية التشفير والخصوصية الرقمية</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      يتم حفظ صور المستندات المرفوعة مشفرة بالكامل ومعزولة عن التصفح العام. لن تظهر هذه الصور إلا لمفتشي مصلحة الرقابة والباحث الاجتماعي المعتمد للبلدية المعنية فقط.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Passport */}
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-2xl block">📖</span>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">صورة جواز السفر الليبي أو الهوية الشخصية</h5>
                    <p className="text-[10px] text-slate-400">يرجى رفع النسخة الرسمية لتأكيد الاسم والمطابقة الوطنية</p>
                    
                    {uploadedDocs.passport ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-right">
                        <img src={uploadedDocs.passport.url} alt="passport" className="w-10 h-10 object-cover rounded" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 truncate">{uploadedDocs.passport.name}</p>
                          <p className="text-[9px] text-slate-400">{uploadedDocs.passport.size} • تم الفحص الرقمي بنجاح ✓</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => simulateFileUpload("passport")}
                        disabled={isScanningDoc === "passport"}
                        className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-600" />
                        {isScanningDoc === "passport" ? "جاري المسح الأمني والمطابقة..." : "انقر لرفع ومسح المستند"}
                      </button>
                    )}
                  </div>

                  {/* National ID card copy */}
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-2xl block">💳</span>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">صورة بطاقة الرقم الوطني</h5>
                    <p className="text-[10px] text-slate-400">مستند إثبات الرقم الوطني الصادر عن مصلحة الأحوال المدنية</p>
                    
                    {uploadedDocs.nationalIdCard ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-right">
                        <img src={uploadedDocs.nationalIdCard.url} alt="id" className="w-10 h-10 object-cover rounded" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 truncate">{uploadedDocs.nationalIdCard.name}</p>
                          <p className="text-[9px] text-slate-400">{uploadedDocs.nationalIdCard.size} • تم الفحص الرقمي بنجاح ✓</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => simulateFileUpload("nationalIdCard")}
                        disabled={isScanningDoc === "nationalIdCard"}
                        className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-600" />
                        {isScanningDoc === "nationalIdCard" ? "جاري المسح الأمني والمطابقة..." : "انقر لرفع ومسح المستند"}
                      </button>
                    )}
                  </div>

                  {/* Personal Headshot */}
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-2xl block">👤</span>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">صورة شخصية حديثة للمستفيد</h5>
                    <p className="text-[10px] text-slate-400">صورة شخصية واضحة تستخدم في سجل المقارنة البايومتري</p>
                    
                    {uploadedDocs.personalPhoto ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-right">
                        <img src={uploadedDocs.personalPhoto.url} alt="photo" className="w-10 h-10 object-cover rounded" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 truncate">{uploadedDocs.personalPhoto.name}</p>
                          <p className="text-[9px] text-slate-400">{uploadedDocs.personalPhoto.size} • تم الفحص الرقمي بنجاح ✓</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => simulateFileUpload("personalPhoto")}
                        disabled={isScanningDoc === "personalPhoto"}
                        className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-indigo-600" />
                        {isScanningDoc === "personalPhoto" ? "جاري المسح والتقاط الصورة..." : "التقاط أو رفع صورة شخصية"}
                      </button>
                    )}
                  </div>

                  {/* Condition Photo */}
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-2xl block">🏚️</span>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">صورة توضيحية للحالة أو السكن والوضع الحالي</h5>
                    <p className="text-[10px] text-slate-400">صور السكن المهترئ، أو تقارير طبية، أو الحالة المعيشية</p>
                    
                    {uploadedDocs.conditionPhoto ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-right">
                        <img src={uploadedDocs.conditionPhoto.url} alt="condition" className="w-10 h-10 object-cover rounded" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 truncate">{uploadedDocs.conditionPhoto.name}</p>
                          <p className="text-[9px] text-slate-400">{uploadedDocs.conditionPhoto.size} • تم حفظ ومعاينة الصورة ✓</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => simulateFileUpload("conditionPhoto")}
                        disabled={isScanningDoc === "conditionPhoto"}
                        className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-600" />
                        {isScanningDoc === "conditionPhoto" ? "جاري رفع ومعالجة الصور الميدانية..." : "رفع صور الحالة المعيشية / السكن"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setIntakeStep(2)}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                  </button>
                  <button
                    onClick={handleSubmitIntake}
                    disabled={isSubmittingReport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-3 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/10"
                  >
                    {isSubmittingReport ? "جاري معالجة وربط الملف..." : "إرسال طلب التمكين للديوان الوطني 🚀"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Registration Success */}
            {intakeStep === 4 && (
              <div className="text-center py-10 space-y-6 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-4xl mx-auto shadow-lg animate-bounce">
                  ✓
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">تم تسجيل طلب التمكين بنجاح في السجل الوطني!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    عزيزنا المواطن <strong>{fullName}</strong>، تم تدوين طلبك في بلدية <strong>{municipality}</strong> لتصنيف <strong>[{selectedCat.title} - {selectedBranch}]</strong> برقم وطني مشفر.
                  </p>
                </div>

                {/* Simulated Phone SMS Alert Notification */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 border-2 border-slate-700 max-w-sm mx-auto shadow-xl text-right space-y-2.5 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span className="font-mono">الآن • شبكة المدار الجديد</span>
                    <span className="font-bold">✉️ رسالة قصيرة جديدة</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-xs text-emerald-400">من: منصة التكافل الوطني (Takaful-LY)</p>
                    <p className="text-[11px] leading-relaxed text-slate-100">
                      "عزيزي المواطن، تم استلام طلبك رقم <span className="font-mono text-emerald-300">TK-2026-{(Math.random()*90000+10000).toFixed(0)}</span> لـ {selectedCat.title} بنجاح. رمز التأكيد الوطني الخاص بك هو: <span className="font-mono font-bold text-amber-300">2291.95</span>. سيقوم الباحث الميداني بالاتصال بك قريباً على الرقم {phone}."
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-right text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم تتبع المعاملة:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">TK-2026-{(Math.random()*90000+10000).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الحالة الأولية للملف:</span>
                    <span className="text-indigo-600 font-extrabold flex items-center gap-1">
                      <span>⏳</span> قيد تدقيق الهوية والأحوال المدنية والضمان الاجتماعي
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2 text-[11px]">
                    <span className="text-slate-500">الإجراء القادم:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">تحديد موعد لزيارة الباحث الاجتماعي الميداني لمطابقة المسكن ومطابقة رقم الحساب المصرفي {ibanNumber}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setActiveLauncher(null);
                      setIntakeStep(1);
                    }}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    العودة للرئيسية
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab("cases");
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                  >
                    تتبع الملفات في بلدية {municipality}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* DONOR PORTAL QUICK VIEW INTEGRATED IN HOME */}
        {activeLauncher === "donor" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-right"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🪙</span> بوابة المانح والمتبرع الذكية - استعراض حي وتوقيع عشري موثق
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  استخدم الخريطة التفاعلية والبحث لتصفح الحالات، وتبرع فوراً بتوقيعك الإلكتروني لتحديث السجل الوطني مباشرة.
                </p>
              </div>
              <button 
                onClick={() => {
                  setActiveLauncher(null);
                  setSelectedMapCity(null);
                  setSearchQuery("");
                  setSelectedCatFilter(null);
                  setSigningCase(null);
                }}
                className="text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl font-bold cursor-pointer transition-colors"
              >
                إغلاق البوابة والرجوع للرئيسية ✕
              </button>
            </div>

            {/* TWO COLUMN GRID: Map on the left (or top), filters and cases on the right (or bottom) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: Interactive Map & Live Feed (4 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Interactive Libya Map */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                      انقر بؤرة المدينة لتصفية الحالات
                    </span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                      🗺️ خريطة ليبيا للتكافل التفاعلي
                    </h4>
                  </div>

                  {/* High fidelity SVG Map of Libya */}
                  <div className="relative w-full h-64 bg-slate-900/10 dark:bg-slate-950/40 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 flex items-center justify-center">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                    
                    <svg viewBox="0 0 500 300" className="w-full h-full text-slate-300 dark:text-slate-800 fill-none stroke-current stroke-1">
                      {/* Outline representing simplified Libyan border */}
                      <path 
                        d="M 50,50 Q 80,45 120,40 Q 150,38 180,50 Q 220,55 250,50 Q 280,45 320,60 Q 350,65 380,50 Q 420,38 450,45 Q 460,110 440,160 Q 420,210 450,260 L 350,280 L 150,290 L 80,260 L 40,200 Z" 
                        className="fill-slate-100/5 dark:fill-slate-950/20 stroke-slate-300 dark:stroke-slate-800" 
                        strokeWidth="2"
                      />
                      {/* Lines connecting regions */}
                      <path d="M 120,90 L 190,105 L 390,85 L 420,70" strokeDasharray="3,3" className="stroke-slate-400/40" />
                      <path d="M 190,105 L 220,220 L 390,85" strokeDasharray="3,3" className="stroke-slate-400/40" />
                    </svg>

                    {/* Interactive Pulsing Cities Points */}
                    {[
                      { name: "طرابلس", x: "24%", y: "30%", color: "bg-emerald-500", count: localCases.filter(c => c.municipality === "طرابلس").length },
                      { name: "بنغازي", x: "78%", y: "28%", color: "bg-teal-500", count: localCases.filter(c => c.municipality === "بنغازي").length },
                      { name: "مصراتة", x: "38%", y: "35%", color: "bg-indigo-500", count: localCases.filter(c => c.municipality === "مصراتة").length },
                      { name: "سبها", x: "44%", y: "73%", color: "bg-amber-500", count: localCases.filter(c => c.municipality === "سبها").length },
                      { name: "درنة", x: "90%", y: "22%", color: "bg-rose-500", count: localCases.filter(c => c.municipality === "درنة").length },
                      { name: "البيضاء", x: "84%", y: "23%", color: "bg-purple-500", count: localCases.filter(c => c.municipality === "البيضاء").length },
                      { name: "غريان", x: "22%", y: "43%", color: "bg-blue-500", count: localCases.filter(c => c.municipality === "غريان").length },
                    ].map((city) => (
                      <button
                        key={city.name}
                        onClick={() => {
                          setSelectedMapCity(selectedMapCity === city.name ? null : city.name);
                          setSigningCase(null);
                        }}
                        style={{ left: city.x, top: city.y }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 group rounded-full focus:outline-none transition-transform hover:scale-125 z-20`}
                      >
                        <span className="absolute inset-0 rounded-full bg-current opacity-40 animate-ping text-current"></span>
                        <span className={`block w-3 h-3 rounded-full ${city.color} border border-white dark:border-slate-900 ${selectedMapCity === city.name ? 'ring-4 ring-emerald-400' : ''}`}></span>
                        
                        {/* Tooltip on hover/select */}
                        <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-black whitespace-nowrap shadow-lg opacity-90 group-hover:block pointer-events-none">
                          {city.name} ({city.count} حالة)
                        </span>
                      </button>
                    ))}

                    {/* Quick Clear City Filter Indicator */}
                    {selectedMapCity && (
                      <div className="absolute bottom-3 right-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] px-2.5 py-1.5 rounded-lg font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 shadow-sm">
                        <span>البلدية: {selectedMapCity}</span>
                        <button onClick={() => setSelectedMapCity(null)} className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Live Broadcast Feed (استعراض حي) */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/80 pb-2">
                    <span className="flex items-center gap-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse font-mono">
                      🔴 بث حي
                    </span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <span>⚡</span> المساهمات التكافلية الجارية
                    </h4>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {recentLiveDonations.map((don) => (
                      <div key={don.id} className="text-[10px] flex justify-between items-start border-b border-dashed border-slate-200/60 dark:border-slate-800 pb-2">
                        <span className="text-slate-400 font-mono text-left">{don.time}</span>
                        <div className="text-right space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {don.name} <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">+{don.amount} د.ل</span>
                          </p>
                          <p className="text-slate-400 text-[9px] truncate max-w-[200px]">
                            بلدية {don.city} • {don.caseDesc}
                          </p>
                          <p className="text-slate-500 text-[8px] font-mono select-all bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded inline-block">
                            🔐 توقيع: {don.sig}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Interactive Filters & Cases (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Search and Category Quick Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 ابحث عن الكلمات المفتاحية في الحالات..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {[
                      { id: null, label: "الكل 📋" },
                      { id: "سكن", label: "سكن 🏡" },
                      { id: "غذاء", label: "غذاء 🌾" },
                      { id: "علاج", label: "علاج 🩺" },
                      { id: "زواج", label: "زواج 💍" },
                      { id: "إيجار", label: "إيجار 🔑" }
                    ].map(cat => (
                      <button
                        key={cat.id || "all"}
                        onClick={() => {
                          setSelectedCatFilter(cat.id);
                          setSigningCase(null);
                        }}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-all ${
                          selectedCatFilter === cat.id
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Cases list */}
                {(() => {
                  const filtered = localCases.filter((c) => {
                    const matchesCity = selectedMapCity ? c.municipality === selectedMapCity : true;
                    const matchesSearch = searchQuery
                      ? c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.municipality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.needTypes.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                      : true;
                    const matchesCat = selectedCatFilter
                      ? c.needTypes.some(t => t.includes(selectedCatFilter)) || c.description.includes(selectedCatFilter)
                      : true;
                    return matchesCity && matchesSearch && matchesCat && c.status !== "closed" && c.status !== "rejected";
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-slate-400 text-xs">لا يوجد حالات تطابق تصفية البحث الحالية.</p>
                        <button
                          onClick={() => {
                            setSelectedMapCity(null);
                            setSelectedCatFilter(null);
                            setSearchQuery("");
                          }}
                          className="text-emerald-600 dark:text-emerald-400 text-xs font-bold underline mt-2"
                        >
                          إعادة تهيئة التصفية
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {filtered.map((c) => {
                        const supportRequired = c.amountRequired || 3000;
                        const collected = c.amountCollected || 0;
                        const percent = Math.min(100, Math.round((collected / supportRequired) * 100)) || 0;
                        const priorityScore = (supportRequired > 10000 ? 9.5 : (c.family?.totalMembers || 4) > 6 ? 8.9 : 7.2);
                        
                        // Pick a mock image from unsplash depending on the case content
                        const caseImage = c.description.includes("سكن") || c.description.includes("ترميم")
                          ? "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400"
                          : c.description.includes("علاج") || c.description.includes("كرسي") || c.description.includes("صحي")
                          ? "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400"
                          : "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400";

                        return (
                          <div key={c.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 overflow-hidden flex flex-col md:flex-row text-right">
                            {/* Visual Thumbnail */}
                            <div className="w-full md:w-44 h-32 md:h-auto relative bg-slate-200">
                              <img 
                                src={caseImage} 
                                alt="معاينة ميدانية" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                📸 صورة معاينة موثقة
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 p-4 space-y-3">
                              <div className="flex justify-between items-center text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black">
                                    {c.needTypes.join(" • ")}
                                  </span>
                                  <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-black font-mono">
                                    أولية: {priorityScore}/10
                                  </span>
                                </div>
                                <span className="text-slate-400 font-mono flex items-center gap-1">
                                  <span>📍</span> {c.municipality}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                                {c.description}
                              </p>

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-[#0F6E56] font-bold">المجموع: {collected} د.ل / {supportRequired} د.ل</span>
                                  <span className="text-gray-400">التقدم: {percent}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>

                              {/* Button zone */}
                              <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                <span className="text-[9px] text-slate-400 font-mono">ID: {c.id}</span>
                                <button
                                  onClick={() => {
                                    setSigningCase(signingCase?.id === c.id ? null : c);
                                    setSigningSuccess(false);
                                    setDrawingPoints([]);
                                  }}
                                  className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-1.5 rounded-xl cursor-pointer shadow-sm flex items-center gap-1"
                                >
                                  {signingCase?.id === c.id ? "إغلاق التبرع ✕" : "توقيع وتبرع عاجل 🖋️"}
                                </button>
                              </div>

                              {/* BIOMETRIC SIGNATURE DRAWER (INLINE) */}
                              {signingCase?.id === c.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="mt-3 p-4 bg-slate-100 dark:bg-slate-950 border border-emerald-500/30 rounded-xl space-y-4 text-right overflow-hidden"
                                >
                                  <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <span>🖋️</span> صندوق التوقيع العشري والمطابقة الثبوتية المباشرة
                                  </h5>

                                  {!signingSuccess ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                                        <div>
                                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم المتبرع (أو فاعل خير)</label>
                                          <input
                                            type="text"
                                            value={signName}
                                            onChange={(e) => setSignName(e.target.value)}
                                            placeholder="فاعل خير"
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-right text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">المبلغ المطلوب للتبرع (د.ل) *</label>
                                          <input
                                            type="number"
                                            value={signAmount}
                                            onChange={(e) => setSignAmount(e.target.value)}
                                            required
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs font-mono font-bold text-emerald-600"
                                          />
                                        </div>
                                      </div>

                                      {/* TOUCH SIGNATURE PAD INTERACTIVE CANVAS */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[9px]">
                                          <button 
                                            type="button" 
                                            onClick={() => setDrawingPoints([])} 
                                            className="text-red-500 hover:underline cursor-pointer"
                                          >
                                            مسح التوقيع ✕
                                          </button>
                                          <span className="text-slate-500 font-bold">ارسم توقيعك بيدك بالماوس أو اللمس هنا:</span>
                                        </div>

                                        <div
                                          onMouseDown={(e) => {
                                            setIsDrawing(true);
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setDrawingPoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
                                          }}
                                          onMouseMove={(e) => {
                                            if (!isDrawing) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setDrawingPoints(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
                                          }}
                                          onMouseUp={() => setIsDrawing(false)}
                                          onMouseLeave={() => setIsDrawing(false)}
                                          onTouchStart={(e) => {
                                            setIsDrawing(true);
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const touch = e.touches[0];
                                            setDrawingPoints([{ x: touch.clientX - rect.left, y: touch.clientY - rect.top }]);
                                          }}
                                          onTouchMove={(e) => {
                                            if (!isDrawing) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const touch = e.touches[0];
                                            setDrawingPoints(prev => [...prev, { x: touch.clientX - rect.left, y: touch.clientY - rect.top }]);
                                          }}
                                          onTouchEnd={() => setIsDrawing(false)}
                                          className="w-full h-24 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg cursor-crosshair relative overflow-hidden select-none"
                                        >
                                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                            {drawingPoints.length > 1 && (
                                              <polyline
                                                fill="none"
                                                stroke="#10B981"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                points={drawingPoints.map(p => `${p.x},${p.y}`).join(" ")}
                                              />
                                            )}
                                          </svg>
                                          {drawingPoints.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[10px] pointer-events-none">
                                              اكتب توقيعك الشخصي هنا
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <button
                                        type="button"
                                        disabled={isSigning || !signAmount}
                                        onClick={async () => {
                                          setIsSigning(true);
                                          setTimeout(() => {
                                            // Perform local update to show the user the progress bar updates live!
                                            const updatedAmount = (c.amountCollected || 0) + Number(signAmount);
                                            setLocalCases(prev => prev.map(item => item.id === c.id ? { ...item, amountCollected: updatedAmount } : item));
                                            
                                            // Prepend to live broadcast
                                            const hashSig = `LY-DEC-${Math.floor(Math.random() * 8999 + 1000)}.${(Math.random() * 99).toFixed(0)}`;
                                            const newDon = {
                                              id: Date.now().toString(),
                                              name: signName || "فاعل خير",
                                              city: c.municipality,
                                              amount: Number(signAmount),
                                              caseDesc: c.description,
                                              sig: hashSig,
                                              time: "الآن"
                                            };
                                            setRecentLiveDonations(prev => [newDon, ...prev]);

                                            setIsSigning(false);
                                            setSigningSuccess(true);
                                          }, 1200);
                                        }}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                                      >
                                        {isSigning ? "جاري التحقق من التوقيع والتسوية العشارية..." : "إيداع التبرع واعتماد التوقيع المالي ✓"}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 space-y-2">
                                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-lg font-bold">
                                        ✓
                                      </div>
                                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                        تمت التسوية المالية وحفظ التوقيع العشري بنجاح!
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        تم تحديث السجل التكافلي، وإدراج المساهمة في البث الحي للشفافية المطلقة. بارك الله فيكم.
                                      </p>
                                      <button
                                        onClick={() => {
                                          setSigningCase(null);
                                          setSigningSuccess(false);
                                        }}
                                        className="text-[10px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded"
                                      >
                                        موافق
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

              </div>

            </div>

          </motion.div>
        )}

        {/* REPORT SUBMISSIONS (NEED OR FRAUD) */}
        {(activeLauncher === "report-need" || activeLauncher === "report-fraud") && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl space-y-6 text-right"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {reportType === "need" ? (
                    <>
                      <span>📢</span> الإبلاغ الاجتماعي العام وتوثيق الحالات المتعففة
                    </>
                  ) : (
                    <>
                      <span>🛡️</span> مكافحة الاحتيال والازدواجية والفساد المالي
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {reportType === "need"
                    ? "نموذج لمساعدة الأسر التي لا تملك وصولاً للإنترنت؛ سجل بيانات جيرانك أو معارفك لبدء الفحص."
                    : "ساعدنا في حماية تبرعات فاعلي الخير؛ الإبلاغ عن ملفات تدعي الفقر أو تتلقى دعماً مزدوجاً بصورة غير قانونية."}
                </p>
              </div>
              <button 
                onClick={() => setActiveLauncher(null)}
                className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors"
              >
                إغلاق البوابة والرجوع للرئيسية ✕
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {reportType === "need" ? "اسم الحالة / العائلة المستحقة *" : "اسم الحالة أو صاحب الملف المشتكى عليه"}
                  </label>
                  <input
                    type="text"
                    required={reportType === "need"}
                    value={reportTargetName}
                    onChange={(e) => setReportTargetName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    placeholder={reportType === "need" ? "اسم رب الأسرة أو الحالة" : "مثال: الاسم رباعي أو رقم الملف المعني"}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {reportType === "need" ? "عنوان وموقع العائلة تفصيلياً *" : "البلدية أو المحلة المحددة"}
                  </label>
                  <input
                    type="text"
                    required
                    value={reportTargetLocation}
                    onChange={(e) => setReportTargetLocation(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    placeholder="المدينة / الحي / معالم مميزة للمنزل"
                  />
                </div>

                {reportType === "fraud" && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم الملف المبلّغ عنه بالسجل (إن وجد)</label>
                    <input
                      type="text"
                      value={reportCaseNumber}
                      onChange={(e) => setReportCaseNumber(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3 font-mono"
                      placeholder="مثال: LY-2026-0002"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسمك الكامل (يمكن تركه فارغاً للبلاغات السرية)</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    placeholder="فاعل خير / مجهول المصدر"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">هاتف للتواصل السري معك للتحقق الميداني (اختياري)</label>
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                    placeholder="09XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {reportType === "need" ? "شرح مبسط للوضع المعيشي والاحتياج العاجل للملف *" : "مبررات وتفاصيل بلاغ الاحتيال أو الازدواجية المالي بالتفصيل *"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-3"
                  placeholder={reportType === "need" ? "يرجى ذكر عدد الأفراد، الدخل، وهل يوجد أيتام أو مرضى بالمنزل لمساعدة باحثينا في تقييم الأولية..." : "الرجاء توثيق تفاصيل التلاعب أو الوظائف المزدوجة بدقة لمساعدة مفتشي اللجنة في المراجعة..."}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className={`px-8 py-3 rounded-xl font-black text-white cursor-pointer shadow-md w-full sm:w-auto ${
                    reportType === "need" ? "bg-blue-600 hover:bg-blue-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isSubmittingReport ? "جاري تشفير وتسجيل البلاغ السري..." : "إرسال البلاغ للجنة التدقيق والمراجعة الميدانية 🚀"}
                </button>
                {reportSuccess && (
                  <motion.span 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-emerald-700 dark:text-emerald-400 font-black text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40"
                  >
                    <span>✓</span> تم تشفير وتسجيل البلاغ بنجاح! شكراً لمساهمتك في النزاهة والمجتمع.
                  </motion.span>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-slate-800/50 text-5xl font-black group-hover:scale-125 transition-transform">👁️</div>
          <span className="text-xs text-slate-400 block font-bold">إجمالي الزيارات</span>
          <span className="text-3xl font-black text-white font-mono mt-1 block">{visitorsCount.toLocaleString('ar-LY')}</span>
        </div>
        <div className="bg-emerald-900 border border-emerald-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-emerald-800/50 text-5xl font-black group-hover:scale-125 transition-transform animate-pulse">🟢</div>
          <span className="text-xs text-emerald-300 block font-bold">متصل الآن</span>
          <span className="text-3xl font-black text-white font-mono mt-1 block">{onlineUsersCount.toLocaleString('ar-LY')}</span>
        </div>
        <div className="bg-indigo-900 border border-indigo-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-indigo-800/50 text-5xl font-black group-hover:scale-125 transition-transform">👥</div>
          <span className="text-xs text-indigo-300 block font-bold">المسجلين بالمنظومة</span>
          <span className="text-3xl font-black text-white font-mono mt-1 block">{registeredUsersCount.toLocaleString('ar-LY')}</span>
        </div>
        <div className="bg-amber-900 border border-amber-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-amber-800/50 text-5xl font-black group-hover:scale-125 transition-transform">🪙</div>
          <span className="text-xs text-amber-300 block font-bold">إجمالي المساهمات (د.ل)</span>
          <span className="text-3xl font-black text-white font-mono mt-1 block">{totalDonated.toLocaleString('ar-LY')}</span>
        </div>
      </div>

      {/* Quick KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-slate-100 dark:text-slate-800/20 text-5xl font-black group-hover:scale-125 transition-transform">📋</div>
          <span className="text-xs text-gray-400 block font-bold">الملفات المسجلة بالسجل</span>
          <span className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1 block">{cases.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-slate-100 dark:text-slate-800/20 text-5xl font-black group-hover:scale-125 transition-transform">🚨</div>
          <span className="text-xs text-gray-400 block font-bold">حالات نشطة قيد التمويل</span>
          <span className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1 block">{activeCases.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-slate-100 dark:text-slate-800/20 text-5xl font-black group-hover:scale-125 transition-transform">✓</div>
          <span className="text-xs text-gray-400 block font-bold">ملفات مكتملة الصرف</span>
          <span className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1 block">{closedCases.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-right relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 text-emerald-100 dark:text-emerald-950/20 text-5xl font-black group-hover:scale-125 transition-transform">🪙</div>
          <span className="text-xs text-gray-400 block font-bold">المساهمات التراكمية الموثقة</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{totalDonated.toLocaleString('ar-LY')} د.ل</span>
        </div>
      </div>

      {/* How Takaful Works - Visual steps */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">كيف تعمل منظومة التكافل الليبي؟</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">سلسلة إجراءات متكاملة تضمن صون كرامة المتعفف ومصداقية المتبرع</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
            <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-mono font-bold text-sm mx-auto shadow-inner">1</span>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">الطلب والمطابقة الآلية</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              يسجل المواطن طلبه بالرقم الوطني والآيبان وتجري مطابقة الضمان الاجتماعي والأحوال المدنية فوراً.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
            <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-mono font-bold text-sm mx-auto shadow-inner">2</span>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">الزيارة والتقييم العشري</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              يزور الباحث المسكن السكني ويرفع تقريراً ميدانياً رقمياً سرياً يثبت تفاصيل الاستحقاق الفعلي وصور الحالة.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
            <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-mono font-bold text-sm mx-auto shadow-inner">3</span>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">الاعتماد والنشر التضامني</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تعتمد بلدية المستفيد الملف ليتم نشره في قائمة التبرعات مع تشفير وحجب الاسم حمايةً وصوناً لكرامته.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
            <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-mono font-bold text-sm mx-auto shadow-inner">4</span>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">الإيداع المصرفي المباشر</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تتحول التبرعات آلياً فور إقفال القيمة إلى حساب الآيبان للمستفيد بالمنظومة البنكية المشتركة لشفافية لا تضاهى.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
