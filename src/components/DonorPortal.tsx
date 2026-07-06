import React, { useState, useEffect } from "react";
import { Case, MajorProject, OmniTransaction, User, SkillOffering } from "../types";
import { translations, Language } from "../translations";
import ImpactLeaderboard from "./ImpactLeaderboard";
import LibyaLeafletMap from "./LibyaLeafletMap";
import GISHeatmap from "./GISHeatmap";
import OngoingCharityTracker from "./OngoingCharityTracker";
import { Trophy, Medal, Award, Heart, Sparkles, TrendingUp, Target, Edit2, Share2, Download, CheckCircle, Copy } from "lucide-react";
import { customFetch } from "../utils/api";
import { triggerHaptic } from "../utils/haptics";

const fetch = customFetch;

const SEEDED_SUPPORTERS = [
  { name: "الحاج عادل الغرياني", amount: 25000, points: 2500, city: "الزاوية", avatar: "🧔", status: "محسن ذهبي" },
  { name: "عائلة القرقني الخيرية", amount: 18500, points: 1850, city: "صبراتة", avatar: "🏢", status: "عطاء بلاتيني" },
  { name: "د. آية الورفلي", amount: 12000, points: 1200, city: "الجميل", avatar: "👩‍⚕️", status: "شريكة الخير" },
  { name: "م. طارق البوعيشي", amount: 8700, points: 870, city: "صرمان", avatar: "👨‍💻", status: "داعم متواصل" },
  { name: "مؤسسة المدار للخدمات", amount: 5000, points: 500, city: "طرابلس", avatar: "📡", status: "مساهمة مؤسسية" }
];

const SEEDED_SUPPORTERS_WEEKLY = [
  { name: "د. آية الورفلي", amount: 3500, points: 350, city: "الجميل", avatar: "👩‍⚕️", status: "نجم الأسبوع" },
  { name: "م. طارق البوعيشي", amount: 2800, points: 280, city: "صرمان", avatar: "👨‍💻", status: "داعم نشط" },
  { name: "أبو بكر محمد السنوسي", amount: 1200, points: 120, city: "صبراتة", avatar: "🧔", status: "مساعِد مميز" },
];

interface DonorPortalProps {
  user: User | null;
  cases: Case[];
  projects: MajorProject[];
  onDonate: (donationData: any) => Promise<OmniTransaction>;
  onSubmitSkill: (skillData: any) => Promise<void>;
  activeGeoSOS: string | null;
  onTriggerGeoSOS: (msg: string | null) => void;
  lang: Language;
}

export default function DonorPortal({
  user,
  cases,
  projects,
  onDonate,
  onSubmitSkill,
  activeGeoSOS,
  onTriggerGeoSOS,
  lang,
}: DonorPortalProps) {
  // Published cases only
  const publishedCases = cases.filter((c) => c.status === "published");

  // Filtering states
  const [muniFilter, setMuniFilter] = useState("الكل");
  const [needFilter, setNeedFilter] = useState("الكل");
  const [priorityFilter, setPriorityLevel] = useState("الكل");

  // Cart state
  const [cart, setCart] = useState<Case[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartAmount, setCartAmount] = useState(100);
  const [isProcessingCart, setIsSubmittingCart] = useState(false);

  // Donation state (for direct modal)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedProject, setSelectedProject] = useState<MajorProject | null>(null);
  const [generalFundType, setGeneralFundType] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState(50);
const [activeTab, setActiveTab] = useState<"dashboard" | "inbox" | "impact">("dashboard");
  const [annualGoal, setAnnualGoal] = useState(() => {
    const saved = localStorage.getItem(`annualGoal_${user?.id || 'guest'}`);
    return saved ? parseInt(saved, 10) : 10000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
const [tempGoal, setTempGoal] = useState(annualGoal);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSaveGoal = () => {
    setAnnualGoal(tempGoal);
    localStorage.setItem(`annualGoal_${user?.id || 'guest'}`, tempGoal.toString());
    setIsEditingGoal(false);
  };
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"monthly" | "weekly" | "yearly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState("sadad");
  const [currency, setCurrency] = useState("LYD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<OmniTransaction | null>(null);

  // Leaderboard states & aggregation
  const [dbTransactions, setDbTransactions] = useState<OmniTransaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setDbTransactions(data);
      }
      
      const notifsRes = await fetch("/api/notifications");
      if (notifsRes.ok) {
        const notifs = await notifsRes.json();
        setNotifications(notifs.filter((n: any) => n.type === "donation"));
      }
    } catch (err) {
      // console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [receipt]);

  // Interactive sub-payment states
  const [mobicashPhone, setMobicashPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [mobiPin, setMobiPin] = useState("");
  
  // Card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Crypto states
  const [cryptoCopied, setCryptoCopied] = useState(false);
  const [cryptoAddress, setCryptoAddress] = useState("0x3b89e7c569f6918d6a8947bde93e08f5d023bf72");

  // Apple Pay / Biometrics states
  const [biometricPaying, setBiometricPaying] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Round up Subscription (T6)
  const [isRoundUpEnabled, setIsRoundUpEnabled] = useState(false);
  const [roundUpLimit, setRoundUpLimit] = useState(10);

  // Skill Matching Form states
  const [providerName, setProviderName] = useState(user?.fullName || "");
  const [providerContact, setProviderContact] = useState(user?.phone || "");
  const [specialty, setSpecialty] = useState("طب عيون");
  const [offeringType, setOfferingType] = useState<"medical" | "engineering" | "renovation" | "appliance">("medical");
  const [skillDesc, setSkillDesc] = useState("");
  const [isSubmittingSkill, setIsSubmittingSkill] = useState(false);
  const [skillSuccess, setSkillSuccess] = useState(false);

  // Filter cases
  const filteredCases = publishedCases.filter(c => {
    if (muniFilter !== "الكل" && c.municipality !== muniFilter) return false;
    if (needFilter !== "الكل" && !c.needTypes.includes(needFilter)) return false;
    if (priorityFilter !== "الكل" && c.priorityLevel !== priorityFilter) return false;
    return true;
  });

  // Handle Cart distribution
  const handleCartDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    triggerHaptic(50);
    setIsSubmittingCart(true);

    const share = Math.floor(cartAmount / cart.length);
    let lastReceipt: OmniTransaction | null = null;

    for (const c of cart) {
      const fund = c.needTypes.includes("علاج") || c.needTypes.includes("أجهزة طبية") ? "طوارئ" : "صدقة";
      lastReceipt = await onDonate({
        donorId: user?.id || null,
        donorNameOverride: user?.isAnonymous ? "فاعل خير" : (user?.fullName || "متبرع فاعل خير"),
        caseId: c.id,
        fundType: fund,
        amount: share,
        currency: "LYD",
        paymentMethod,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
    }

    setReceipt(lastReceipt);
    setCart([]);
    setShowCart(false);
    setIsSubmittingCart(false);
  };

  // Handle direct single donation
  const handleDirectDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(50);
    setIsProcessing(true);

    const targetFund = generalFundType 
      ? generalFundType
      : selectedCase
      ? (selectedCase.needTypes.includes("علاج") || selectedCase.needTypes.includes("أجهزة طبية") ? "طوارئ" : "صدقة")
      : "صدقة_جارية"; // for projects

    const tx = await onDonate({
      donorId: user?.id || null,
      donorNameOverride: user?.isAnonymous ? "فاعل خير" : undefined,
      caseId: selectedCase?.id,
      projectId: selectedProject?.id,
      fundType: targetFund,
      amount: donationAmount,
      currency,
      paymentMethod,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
    });

    setReceipt(tx);
    setIsProcessing(false);
    setSelectedCase(null);
    setSelectedProject(null);
    setGeneralFundType(null);
  };

  // Asset/Skill matching form submit
  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillDesc.trim()) return;
    triggerHaptic(50);
    setIsSubmittingSkill(true);
    await onSubmitSkill({
      providerName,
      providerContact,
      specialty,
      offeringType,
      description: skillDesc,
    });

    setIsSubmittingSkill(false);
    setSkillSuccess(true);
    setSkillDesc("");
    setTimeout(() => setSkillSuccess(false), 4000);
  };

  // Cart add toggle
  const toggleCart = (caseObj: Case) => {
    if (cart.some((c) => c.id === caseObj.id)) {
      setCart(cart.filter((c) => c.id !== caseObj.id));
    } else {
      setCart([...cart, caseObj]);
    }
  };

  // Dynamic tree image based on gamification points (T8: Gamification)
  const getGivingTreeAsset = () => {
    const pts = user?.gamificationPoints || 0;
    if (pts >= 300) {
      return {
        icon: "🌳",
        label: "شجرة العطاء الوارفة الكبرى",
        desc: "لقد أينعت شجرة تبرعاتك بالكامل وتفرعت أغصانها لتظليل العشرات من الأسر المتعففة! جزاك الله خيراً.",
        color: "text-emerald-600 bg-emerald-50",
      };
    } else if (pts >= 100) {
      return {
        icon: "🌿",
        label: "شجيرة العطاء الفتية الخضراء",
        desc: "أثمرت تبرعاتك وسهمك في تكافل وطنك لتنمو وتستطيل فروع شجرتك المباركة.",
        color: "text-green-600 bg-green-50",
      };
    } else {
      return {
        icon: "🌱",
        label: "برعم العطاء الناشئ",
        desc: "بداية مسيرتك المباركة في العطاء؛ سهم واحد يروي هذا البرعم لتنمو وتثمر تبرعاتك مستقبلاً.",
        color: "text-emerald-500 bg-slate-50",
      };
    }
  };

  const tree = getGivingTreeAsset();

  return (
    <div className="space-y-6">
      
      {/* Donor Tabs */}
      <div className="flex gap-2 justify-end mb-4 flex-row-reverse">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "dashboard" ? "bg-slate-950 text-white" : "text-slate-600 bg-white border border-slate-200"
          }`}
        >
          لوحة التبرعات
        </button>

        <button
          onClick={() => setActiveTab("impact")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "impact" ? "bg-slate-950 text-white" : "text-slate-600 bg-white border border-slate-200"
          }`}
        >
          أثري
        </button>
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === "inbox" ? "bg-slate-950 text-white" : "text-slate-600 bg-white border border-slate-200"
          }`}
        >
          صندوق تقارير الأثر
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
              {notifications.length}
            </span>
          )}
        </button>
      </div>


      {activeTab === "impact" ? (
        <div className="space-y-6 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-[#E5E3DA] p-6 rounded-2xl shadow-sm">
            
            {(() => {
              const userTransactions = dbTransactions.filter(t => t.donorId === user?.id);
              const totalContributions = userTransactions.reduce((sum, t) => sum + t.amount, 0);
              const uniqueCasesSupported = new Set(userTransactions.filter(t => t.caseId).map(t => t.caseId)).size;
              const uniqueProjectsSupported = new Set(userTransactions.filter(t => t.projectId).map(t => t.projectId)).size;
              const sortedTransactions = [...userTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              const handleShareText = async () => {
                const text = `ساهمت بـ ${totalContributions.toLocaleString()} د.ل لدعم ${uniqueCasesSupported} حالة و ${uniqueProjectsSupported} مشروع عبر منصة التكافل! #أثر_يبقى`;
                try {
                  await navigator.clipboard.writeText(text);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                } catch (err) {
                  console.error('Failed to copy', err);
                }
              };

              const handleShareImage = async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "ملخص الأثر الشخصي",
                      text: "لقد ساهمت في دعم الحالات الإنسانية. شارك في التكافل الاجتماعي!",
                    });
                  } catch (err) {
                    console.error('Share failed', err);
                  }
                } else {
                  alert("ميزة المشاركة غير مدعومة في متصفحك.");
                }
              };

              return (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      ملخص الأثر الشخصي
                    </h2>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={handleShareText} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors">
                        {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? "تم النسخ!" : "نسخ النص"}
                      </button>
                      <button onClick={handleShareImage} disabled={isGeneratingImage} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50">
                        {isGeneratingImage ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                        {isGeneratingImage ? "جاري الحفظ..." : "حفظ كصورة"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        هدف الأثر السنوي
                      </h3>
                      {!isEditingGoal && (
                        <button onClick={() => setIsEditingGoal(true)} className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          تعديل الهدف
                        </button>
                      )}
                    </div>
                    
                    {isEditingGoal ? (
                      <div className="flex gap-2 mb-4">
                        <input
                          type="number"
                          value={tempGoal}
                          onChange={(e) => setTempGoal(Number(e.target.value))}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button onClick={handleSaveGoal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">حفظ</button>
                        <button onClick={() => { setIsEditingGoal(false); setTempGoal(annualGoal); }} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">إلغاء</button>
                      </div>
                    ) : null}

                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">
                            {Math.min(100, Math.round((totalContributions / annualGoal) * 100))}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700">
                            {totalContributions.toLocaleString()} <span className="text-slate-400 font-normal">/ {annualGoal.toLocaleString()} د.ل</span>
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-indigo-100">
                        <div style={{ width: `${Math.min(100, (totalContributions / annualGoal) * 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>

                  <div id="impact-summary-card" className="bg-white p-4 -mx-4 md:mx-0 md:p-6 rounded-2xl border border-[#E5E3DA] space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center justify-center text-center">
                        <Heart className="w-8 h-8 text-emerald-500 mb-2" />
                        <span className="text-3xl font-black text-emerald-700">{totalContributions.toLocaleString()} د.ل</span>
                        <span className="text-xs font-bold text-emerald-600 mt-1">إجمالي التبرعات</span>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center text-center">
                        <Award className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-3xl font-black text-blue-700">{uniqueCasesSupported}</span>
                        <span className="text-xs font-bold text-blue-600 mt-1">حالة تم دعمها</span>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex flex-col items-center justify-center text-center">
                        <Sparkles className="w-8 h-8 text-amber-500 mb-2" />
                        <span className="text-3xl font-black text-amber-700">{uniqueProjectsSupported}</span>
                        <span className="text-xs font-bold text-amber-600 mt-1">مشروع تمت المساهمة فيه</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-t pt-4">
                      <span>{new Date().toLocaleDateString('ar-LY')}</span>
                      <span>منصة التكافل - Takaful</span>
                    </div>
                  </div>



                  <div>
                    <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">الجدول الزمني لعطائك</h3>
                    {sortedTransactions.length === 0 ? (
                      <p className="text-slate-500 text-sm">لم تقم بأي مساهمات بعد.</p>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {sortedTransactions.map((t, idx) => {
                          const c = cases.find(c => c.id === t.caseId);
                          const p = projects.find(p => p.id === t.projectId);
                          const title = c ? `مساهمة في حالة: ${c.caseNumber}` : p ? `دعم مشروع: ${p.title}` : `تبرع عام - ${t.fundType}`;
                          
                          return (
                            <div key={t.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <Heart className="w-4 h-4" />
                              </div>
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-slate-800 text-sm">{title}</span>
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{t.amount} د.ل</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">{new Date(t.createdAt).toLocaleDateString("ar-LY")} - {new Date(t.createdAt).toLocaleTimeString("ar-LY", {hour: '2-digit', minute:'2-digit'})}</div>
                                <div className="text-xs text-slate-600 mt-2">
                                  {t.fundType} عبر {t.paymentMethod}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : activeTab === "inbox" ? (

        <div className="space-y-6 animate-fade-in text-right">
          <div className="bg-white border border-[#E5E3DA] p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">تقارير الأثر وإشعارات التبرع</h2>
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-sm">لا توجد رسائل أثر حالياً.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((n, idx) => (
                  <div key={n.id || idx} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                    <h3 className="font-bold text-emerald-900 text-sm flex justify-between">
                      <span className="text-[10px] text-emerald-600 font-mono">{new Date(n.createdAt).toLocaleDateString("ar-LY")}</span>
                      <span>{n.title}</span>
                    </h3>
                    <p className="text-emerald-800 text-xs mt-2 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
      {/* Geo-SOS Banner (T9: Emergency push notification within 10 km) */}
      {activeGeoSOS && (
        <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-2xl shadow-md text-right space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full animate-bounce">
              ⚠️ إنذار طوارئ جغرافي عاجل (SOS-Geo)
            </span>
            <button
              onClick={() => onTriggerGeoSOS(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
            >
              إغلاق الإنذار ✕
            </button>
          </div>
          <p className="text-sm font-bold text-rose-950">
            حالة طبية طارئة على مسافة أقل من 10 كم من موقعك الحالي ببلدية صبراتة!
          </p>
          <p className="text-xs text-rose-900 leading-relaxed font-mono">
            &quot;{activeGeoSOS}&quot;
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                const sCase = cases.find((c) => c.priorityLevel === "عاجل" && c.status === "published");
                if (sCase) setSelectedCase(sCase);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
            >
              تبرّع فوراً لإنقاذ الحالة
            </button>
          </div>
        </div>
      )}

      {/* Gamification & Round Up Header (T8 / T6) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Virtual Giving Tree Card */}
        <div className="md:col-span-2 bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-5 items-center">
          <span className="text-6xl p-2 bg-[#E1F5EE]/40 rounded-full">{tree.icon}</span>
          <div className="text-right space-y-1">
            <span className="text-[10px] text-[#0F6E56] font-bold block uppercase tracking-wider">
              أثر عطائك التراكمي (Gamification)
            </span>
            <h3 className="text-lg font-bold text-gray-900">{tree.label}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{tree.desc}</p>
            <span className="text-[11px] font-mono text-emerald-700 font-bold block pt-1">
              أرصدة نقاطك الحالية: {user?.gamificationPoints || 0} نقطة تكافلية
            </span>
          </div>
        </div>

        {/* Round Up Spare Change Card */}
        <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>👛</span> ميزة &quot;اجبر الكسر&quot; (Micro-donations)
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              تتيح لك تقريب كسور عمليات الدفع الإلكترونية تلقائياً وتوجيه الفرق كأجزاء من الدينار لصندوق الطوارئ.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-3">
            <label className="text-xs font-bold text-gray-700 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRoundUpEnabled}
                onChange={(e) => setIsRoundUpEnabled(e.target.checked)}
                className="rounded border-[#E5E3DA]"
              />
              تفعيل التبرع التلقائي بالفكة
            </label>
            {isRoundUpEnabled && (
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">
                نشط حد {roundUpLimit} د.ل/شهرياً
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Main Browse Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Filter and Cart */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Smart Search Filters (T1/T2) */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm space-y-4 text-right">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">صندوق الفرز والبحث الذكي</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">البلدية</label>
              <select
                value={muniFilter}
                onChange={(e) => setMuniFilter(e.target.value)}
                className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs bg-white"
              >
                <option value="الكل">كل بلديات المنطقة الغربية</option>
                <option value="صبراتة">صبراتة</option>
                <option value="صرمان">صرمان</option>
                <option value="العجيلات">العجيلات</option>
                <option value="الجميل">الجميل</option>
                <option value="زوارة">زوارة</option>
                <option value="الزاوية">الزاوية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">تصنيف الاحتياج</label>
              <select
                value={needFilter}
                onChange={(e) => setNeedFilter(e.target.value)}
                className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs bg-white"
              >
                <option value="الكل">كل التصنيفات</option>
                <option value="غذاء">غذاء وسلال غذائية</option>
                <option value="علاج">عمليات علاجية وطبية</option>
                <option value="إيجار">سداد إيجارات متراكمة</option>
                <option value="ملابس">كسوة وملابس شتوية</option>
                <option value="أجهزة طبية">أجهزة ومستلزمات طبية</option>
                <option value="ترميم منازل">ترميم وصيانة مساكن</option>
                <option value="تعليم">مستلزمات وتكفل تعليمي</option>
                <option value="مشاريع صغيرة">مشاريع صغيرة (قرض حسن)</option>
                <option value="كفالة أيتام">كفالة أيتام وقصر</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-xs font-bold mb-1">مستوى الأولوية</label>
              <select
                className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs bg-white"
                onChange={(e) => {
                  // Custom filter handled in UI
                }}
              >
                <option value="all">كل الأولويات</option>
                <option value="عاجل">أولوية عاجلة</option>
                <option value="مرتفع">أولوية مرتفعة</option>
                <option value="متوسط">أولوية متوسطة</option>
              </select>
            </div>
          </div>

          {/* Central General Funds */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0F6E56] border-b pb-2">التبرع العام للصناديق المركزية</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              إذا لم ترغب في تحديد حالة معينة، يمكنك توجيه تبرعك لأحد الصناديق الشرعية ليتم توزيعها حسب الأولويات.
            </p>
            <div className="space-y-2">
              {["صدقة", "كفالة_يتيم", "صدقة_جارية", "طوارئ"].map((fund) => (
                <button
                  key={fund}
                  onClick={() => {
                    const amtStr = prompt(`أدخل قيمة التبرع لـ صندوق ${fund.replace("_", " ")} بالدينار الليبي:`, "100");
                    if (amtObjIsValid(amtStr)) {
                      handleProcessDirectDonation(null, null, fund, parseFloat(amtStr!));
                    }
                  }}
                  className="w-full text-right bg-slate-50 hover:bg-slate-100 text-xs p-2.5 rounded-lg border border-[#E5E3DA] text-gray-700 flex justify-between items-center transition-colors cursor-pointer"
                >
                  <span className="font-bold">صندوق {fund.replace("_", " ")}</span>
                  <span className="text-[10px] text-emerald-700 font-bold">تبرّع مباشر ←</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cart Panel widget */}
          {cart.length > 0 && (
            <div className="bg-[#E1F5EE] border border-[#1D9E75] rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-[#085041] flex items-center justify-between">
                <span>سلة التبرعات الذكية 🛒</span>
                <span className="bg-[#1D9E75] text-white px-2 py-0.5 rounded-full font-bold text-[9px]">
                  {cart.length} حالات
                </span>
              </h4>
              <p className="text-[10px] text-[#0F6E56] leading-relaxed">
                تبرع بقيمة موحدة وسيوزع النظام المبلغ بالتساوي التام على كل الحالات المحددة في سلتك فوراً.
              </p>
              <form onSubmit={handleCartDonation} className="space-y-3">
                <input
                  type="number"
                  min="10"
                  value={cartAmount}
                  onChange={(e) => setCartAmount(parseInt(e.target.value))}
                  className="w-full border border-[#1D9E75] bg-white rounded-lg p-2 text-xs font-mono font-bold"
                  placeholder="المبلغ الإجمالي للتوزيع"
                  required
                />
                <button
                  type="submit"
                  disabled={isProcessingCart}
                  className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                >
                  {isProcessingCart ? "جاري التوزيع والتسجيل..." : "توزيع وتأكيد التبرع"}
                </button>
              </form>
            </div>
          )}

          {/* Top Supporters Leaderboard (Gamified) */}
          <ImpactLeaderboard user={user} dbTransactions={dbTransactions} />

        </div>

        {/* Right Side: Published Cases & Major Projects */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Interactive GIS Case Map across Libya */}
          <LibyaLeafletMap
            cases={cases}
            lang={lang}
            onDonateDirect={(caseId, amount) => handleProcessDirectDonation(caseId, null, null, amount)}
          />

          {/* Interactive Geographic GIS Heatmap */}
          <GISHeatmap
            cases={cases}
            projects={projects}
            selectedMunicipality={muniFilter === "الكل" ? "صبراتة" : muniFilter}
            onSelectMunicipality={(muni) => {
              if (muniFilter === muni) {
                setMuniFilter("الكل");
              } else {
                setMuniFilter(muni);
              }
            }}
          />

          {/* Ongoing Charity Tracker */}
          <OngoingCharityTracker projects={projects} />
          
          {/* Major Infrastructure Projects (T10) */}
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <span>🏗️</span> الصدقة الجارية والمشاريع التنموية الكبرى
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.filter(p => muniFilter === "الكل" || p.municipality === muniFilter).map((p) => {
                const progress = (p.collectedAmount / p.targetAmount) * 100;
                return (
                  <div key={p.id} className="bg-white border border-[#E5E3DA] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    {p.coverImage && (
                      <img src={p.coverImage} alt={p.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-sky-600 font-mono">{p.projectNumber} | {p.category === "well" ? "بئر ماء" : "رعاية أيتام"}</span>
                        <h5 className="font-bold text-sm text-gray-900 mt-1 mb-2 line-clamp-1">{p.title}</h5>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.description}</p>
                      </div>

                      <div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${progressPercent(p.collectedAmount, p.targetAmount)}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mb-3">
                          <span>{p.collectedAmount} د.ل محصل</span>
                          <span>الهدف: {p.targetAmount} د.ل</span>
                        </div>

                        <button
                          onClick={() => {
                            const amt = prompt("أدخل قيمة المساهمة بالدينار الليبي:", "100");
                            if (amt) {
                              const num = parseFloat(amountValue(amt));
                              if (num > 0) {
                                handleProcessDirectDonation(null, p.id, "صدقة_جارية", num);
                              }
                            }
                          }}
                          disabled={p.status === "completed"}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                            p.status === "completed"
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100"
                          }`}
                        >
                          {p.status === "completed" ? "اكتمل المشروع" : "مساهمة صدقة جارية"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cases grid switchable */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                الحالات الأكثر استحقاقاً للنشر والمساعدة المباشرة
              </h3>
              <p className="text-xs text-slate-500">تم حجب الأسماء بالكامل والتفاصيل الحساسة حفاظاً على ماء وجه العائلات</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((c) => {
                const inCart = cart.some((item) => item.id === c.id);
                return (
                  <div key={c.id} className="bg-white border border-[#E5E3DA] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                    {/* Priority badge top-left */}
                    <div className="absolute top-4 left-4 flex gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.priorityLevel === "عاجل" 
                          ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" 
                          : c.priorityLevel === "مرتفع" 
                          ? "bg-amber-50 text-amber-600 border border-amber-100" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {c.priorityLevel}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-mono block">رقم الحالة: {c.caseNumber}</span>
                      <h4 className="font-bold text-sm text-gray-900 mt-2 mb-1">بلدية {c.municipality}</h4>
                      
                      <div className="flex flex-wrap gap-1 mt-1 mb-3">
                        {c.needTypes.map((t) => (
                          <span key={t} className="text-[9px] bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                        {c.description}
                      </p>
                    </div>

                    {/* Progress tracking */}
                    <div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
                        <div className="h-full bg-emerald-500" style={{ width: `${(c.amountCollected / c.amountRequired) * 100}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mb-4">
                        <span className="text-[#0F6E56] font-bold">{c.amountCollected} د.ل محصل</span>
                        <span>الهدف: {c.amountRequired} د.ل</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const amt = prompt("أدخل قيمة التبرع المباشر للحالة بالدينار الليبي:", "100");
                            if (amt) {
                              const num = parseFloat(amountValue(amt));
                              if (num > 0) {
                                handleProcessDirectDonation(c.id, null, null, num);
                              }
                            }
                          }}
                          className="flex-1 bg-[#0F6E56] hover:bg-[#085041] text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          تبرّع عاجل
                        </button>

                        <button
                          onClick={() => toggleCart(c)}
                          className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                            inCart
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-white border-[#E5E3DA] text-gray-600 hover:bg-slate-50"
                          }`}
                          title="إضافة السلة الذكية"
                        >
                          {inCart ? "✓ في السلة" : "🛒"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Matching & Offering Asset bank (T7) */}
          <div className="bg-[#FAFAF8] border border-[#E5E3DA] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span>🤝</span> بنك المهارات العينية والأصول العينية (Asset Matching)
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              إذا كنت طبيباً أو مهندساً ترغب في تقديم خدماتك مجاناً للحالات المصدقة، أو مواطناً يرغب في التبرع بأثاث أو أجهزة كهربائية ممتازة ليطابقها الباحث الاجتماعي مع حالات ترميم المنازل، الرجاء تسجيل عرضك هنا:
            </p>

            <form onSubmit={handleSkillSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">الاسم الكامل للمعيل/المتطوع</label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full border border-[#E5E3DA] bg-white rounded-lg p-2"
                  placeholder="مثال: د. حسام الطبطب"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">وسيلة التواصل (رقم الهاتف)</label>
                <input
                  type="text"
                  value={providerContact}
                  onChange={(e) => setProviderContact(e.target.value)}
                  className="w-full border border-[#E5E3DA] bg-white rounded-lg p-2"
                  placeholder="09XXXXXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">نوع المهارة أو العطاء العيني</label>
                <select
                  value={offeringType}
                  onChange={(e: any) => setOfferingType(e.target.value)}
                  className="w-full border border-[#E5E3DA] bg-white rounded-lg p-2"
                >
                  <option value="medical">خدمات طبية وعلاجية مجانية</option>
                  <option value="engineering">خدمات هندسية وتخطيط مجانية</option>
                  <option value="renovation">صيانة وترميم مباني ومنازل</option>
                  <option value="appliance">أجهزة كهربائية أو أثاث ممتاز</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-gray-700 font-bold mb-1">تفاصيل العرض وتفاصيل الخدمة</label>
                <input
                  type="text"
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                  className="w-full border border-[#E5E3DA] bg-white rounded-lg p-2"
                  placeholder="مثال: مستعد لإجراء 5 كشوفات مجانية لمرضى العيون شهرياً أو صيانة غرف متصدعة مجاناً"
                  required
                />
              </div>

              <div className="md:col-span-3 flex justify-between items-center">
                <button
                  type="submit"
                  disabled={isSubmittingSkill}
                  className="bg-[#0F6E56] hover:bg-[#085041] disabled:bg-slate-300 text-white font-bold py-2 px-6 rounded-lg text-xs cursor-pointer"
                >
                  {isSubmittingSkill ? "جاري التسجيل..." : "تسجيل في بنك العطاء العيني"}
                </button>
                {skillSuccess && (
                  <span className="text-emerald-700 font-bold font-mono">
                    ✓ تم التسجيل بنجاح في بنك المهارات الوطني!
                  </span>
                )}
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Donation Receipt Modal (T4: Coin Tracking QR & Hash receipt) */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
          <div className="bg-white border border-[#E5E3DA] rounded-2xl max-w-md w-full p-6 shadow-xl text-center space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 text-3xl">
              ✓
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-black text-[#0F6E56]">سند تبرع معتمد</h3>
              <p className="text-xs text-gray-500 mt-0.5">تم تسجيل تبرعك بنجاح في السجل الوطني الموحد لمكافحة الفقر</p>
            </div>

            <div className="space-y-3 text-xs text-right bg-slate-50 p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-gray-400">رقم السند المالي:</span>
                <span className="font-bold text-gray-800 font-mono">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">المبلغ المدفوع:</span>
                <span className="font-bold text-rose-600 font-mono">{receipt.amount} د.ل</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">طريقة الدفع الموحدة:</span>
                <span className="font-bold text-gray-800">{receipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-400 block">شفرة التتبع الفريدة (Hash):</span>
                <span className="font-bold text-slate-500 font-mono truncate max-w-[200px]" title={receipt.trackingHash}>
                  {receipt.trackingHash}
                </span>
              </div>
            </div>

            {/* QR verification code representation */}
            <div className="border border-dashed border-[#E5E3DA] p-3 rounded-xl bg-white w-[140px] h-[140px] mx-auto flex items-center justify-center">
              <div className="text-[10px] text-gray-400 font-mono text-center">
                {/* Simulated QR Code structure */}
                <div className="grid grid-cols-5 gap-1 w-20 h-20 mx-auto mb-2 opacity-80">
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-200"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-200"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-200"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-200"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-200"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                  <div className="bg-slate-200"></div>
                  <div className="bg-slate-800 rounded-sm"></div>
                </div>
                تأكيد QR رسمي للشفافية
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                طباعة السند / PDF
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 bg-white border border-[#E5E3DA] hover:bg-slate-50 text-gray-700 font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Direct Payment Gateway Dialog Modal */}
      {(selectedCase || selectedProject || generalFundType) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[190] overflow-y-auto animate-fade-in" id="payment-gateway-modal">
          <form onSubmit={handleDirectDonation} className="bg-white border border-[#E5E3DA] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl text-right flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-row-reverse">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {lang === "ar" ? "بوابة الدفع الموحدة المتكاملة (Omni-Channel)" : "Unified Omni-Channel Payment Gateway"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === "ar" ? "توجيه المساهمة لصالح:" : "Directing contribution to:"}{" "}
                  <span className="font-bold text-emerald-600">
                    {selectedCase 
                      ? (lang === "ar" ? `إعانة حالة عاجلة (${selectedCase.caseNumber})` : `Urgent Case Relief (${selectedCase.caseNumber})`) 
                      : selectedProject 
                      ? (lang === "ar" ? `مشروع صدقة جارية (${selectedProject.title})` : `Ongoing Charity Project (${selectedProject.title})`)
                      : (lang === "ar" ? `صندوق التكافل العام (${generalFundType})` : `General Takaful Fund (${generalFundType})`)}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedCase(null);
                  setSelectedProject(null);
                  setGeneralFundType(null);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtpCode("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-right">
              
              {/* Floating SMS OTP Mock Notification */}
              {otpSent && !otpVerified && (
                <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-bounce text-right flex-row-reverse justify-between">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-bold text-[11px] text-emerald-400 font-mono">SMS: TAKAFUL-SECURE</p>
                      <p className="text-[10px] text-slate-300">
                        {lang === "ar" 
                          ? "رمز التحقق الثنائي لمنصة التكافل الوطني: (5912). لا تشارك الرمز." 
                          : "Your National Takaful OTP verification code is: (5912). Do not share."}
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold text-[9px] animate-pulse">
                    {lang === "ar" ? "وصل الآن" : "Now"}
                  </span>
                </div>
              )}

              {/* Amount & Currency Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {lang === "ar" ? "قيمة المساهمة" : "Donation Amount"} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-rose-600 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {lang === "ar" ? "العملة المفضلة" : "Preferred Currency"}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-xs focus:outline-none"
                  >
                    <option value="LYD">دينار ليبي (LYD)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو أوروبي (EUR)</option>
                  </select>
                </div>
              </div>

              {/* Exchange Rate Converter Mock */}
              {currency !== "LYD" && (
                <div className="bg-emerald-50/50 border border-emerald-500/10 p-3 rounded-2xl flex justify-between items-center flex-row-reverse text-[10px] text-emerald-800 font-medium">
                  <span>📈 {lang === "ar" ? "محول أسعار الصرف الرسمي للشفافية" : "Official Exchange Rate Converter"}</span>
                  <span className="font-mono">
                    {donationAmount} {currency} ≈ {currency === "USD" ? (donationAmount * 4.85).toFixed(2) : (donationAmount * 5.25).toFixed(2)} LYD
                  </span>
                </div>
              )}

              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">
                  {lang === "ar" ? "اختر طريقة الدفع الآمنة:" : "Select secure payment channel:"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { key: "sadad", label: lang === "ar" ? "سداد المدار" : "Sadad (Al-Madar)", icon: "📱", group: "local" },
                    { key: "mobicash", label: lang === "ar" ? "موبي كاش" : "MobiCash (LTT)", icon: "💸", group: "local" },
                    { key: "stripe", label: lang === "ar" ? "بطاقة دفع / Stripe" : "Card / Stripe", icon: "💳", group: "global" },
                    { key: "applepay", label: "Apple / Google Pay", icon: "🍏", group: "global" },
                    { key: "binance", label: "USDT-TRC20 Crypto", icon: "💎", group: "crypto" },
                  ].map((pm) => (
                    <button
                      type="button"
                      key={pm.key}
                      onClick={() => {
                        setPaymentMethod(pm.key);
                        // reset states
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtpCode("");
                        setBiometricSuccess(false);
                        setBiometricPaying(false);
                      }}
                      className={`p-2.5 border rounded-2xl flex items-center justify-start gap-2 cursor-pointer transition-all flex-row-reverse text-right ${
                        paymentMethod === pm.key
                          ? "border-emerald-500 bg-emerald-50/60 text-emerald-900 font-bold ring-1 ring-emerald-500"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700"
                      }`}
                    >
                      <span className="text-base">{pm.icon}</span>
                      <span className="text-[10px] leading-tight block">{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurring Donation Setup */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-end space-y-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer flex-row-reverse text-right w-full justify-start">
                  <input 
                    type="checkbox" 
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span className="font-bold text-sm text-slate-800">تفعيل الاستقطاع المجدول (تبرع دوري)</span>
                </label>
                {isRecurring && (
                  <div className="w-full flex gap-2 flex-row-reverse justify-end mt-2">
                    {["monthly", "weekly", "yearly"].map(interval => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setRecurringInterval(interval as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          recurringInterval === interval
                            ? "bg-emerald-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {interval === "monthly" ? "شهري" : interval === "weekly" ? "أسبوعي" : "سنوي"}
                      </button>
                    ))}
                  </div>
                )}
                {isRecurring && (
                  <p className="text-[10px] text-slate-500 text-right w-full mt-2">بتمكينك هذا الخيار، سيتم استقطاع المبلغ المذكور بشكل آلي حسب الدورية المحددة لضمان استدامة الدعم للمحتاجين.</p>
                )}
              </div>

              {/* Dynamic Interactive Payment Method Screens */}
              <div className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-4">
                
                {/* 1. Local Wallets: Sadad / MobiCash */}
                {(paymentMethod === "sadad" || paymentMethod === "mobicash") && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5 flex-row-reverse">
                      <span>📱</span>
                      <span>
                        {paymentMethod === "sadad" 
                          ? (lang === "ar" ? "بوابة تبرع سداد لشبكة المدار الجديد" : "Al-Madar Sadad Payment Portal")
                          : (lang === "ar" ? "خدمة موبي كاش لشبكة تداول الوطنية" : "MobiCash Secure Payment Service")}
                      </span>
                    </h4>

                    {!otpSent ? (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-500">
                          {lang === "ar" 
                            ? "أدخل رقم الهاتف المشترك في الخدمة لتلقي رمز تحقق أمني مؤقت لخصم المساهمة مباشرة."
                            : "Enter the registered subscriber phone number to receive a temporary secure OTP."}
                        </p>
                        <div className="flex gap-2 flex-row-reverse">
                          <input
                            type="tel"
                            placeholder="091XXXXXXX"
                            value={mobicashPhone}
                            onChange={(e) => setMobicashPhone(e.target.value)}
                            className="flex-1 border border-slate-200 bg-white rounded-xl p-2.5 text-center font-mono font-bold text-slate-800 text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!mobicashPhone) return;
                              // Play tone
                              try {
                                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                const osc = ctx.createOscillator();
                                osc.frequency.value = 880;
                                osc.connect(ctx.destination);
                                osc.start(); osc.stop(ctx.currentTime + 0.15);
                              } catch(e){}
                              setOtpSent(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl cursor-pointer"
                          >
                            {lang === "ar" ? "أرسل رمز OTP" : "Send OTP"}
                          </button>
                        </div>
                      </div>
                    ) : !otpVerified ? (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-600 font-bold">
                          {lang === "ar" 
                            ? `✓ تم إرسال الرمز الهاتفي المؤقت بنجاح. أدخل الرمز (5912) للتأكيد:`
                            : `✓ OTP sent successfully. Enter code (5912) to verify:`}
                        </p>
                        <div className="flex gap-2 flex-row-reverse">
                          <input
                            type="text"
                            placeholder="XXXX"
                            value={otpCode}
                            maxLength={4}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="flex-1 border border-slate-200 bg-white rounded-xl p-2.5 text-center font-mono font-bold text-slate-800 text-sm tracking-widest focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (otpCode === "5912") {
                                try {
                                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                  const osc = ctx.createOscillator();
                                  osc.frequency.value = 1200;
                                  osc.connect(ctx.destination);
                                  osc.start(); osc.stop(ctx.currentTime + 0.25);
                                } catch(e){}
                                setOtpVerified(true);
                              } else {
                                alert(lang === "ar" ? "الرمز غير صحيح، يرجى إدخال 5912" : "Incorrect code, please enter 5912");
                              }
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 rounded-xl cursor-pointer"
                          >
                            {lang === "ar" ? "تأكيد الرمز" : "Verify Code"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-between flex-row-reverse">
                        <span className="font-bold font-mono">✓ {lang === "ar" ? "تم التحقق من ملكية الحساب" : "Phone Verified"}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">{mobicashPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Global Cards: Stripe / Visa / Mastercard */}
                {paymentMethod === "stripe" && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5 flex-row-reverse">
                      <span>💳</span>
                      <span>{lang === "ar" ? "بوابة Stripe الموحدة لبطاقات الائتمان الدولية" : "Stripe Unified Global Payment Gate"}</span>
                    </h4>

                    {/* Plastic Card visual representation */}
                    <div className="bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 p-5 rounded-2xl text-white font-mono shadow-md flex flex-col justify-between h-36 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -z-10"></div>
                      <div className="flex justify-between items-start flex-row-reverse">
                        <span className="text-xl font-black italic text-slate-300">VISA</span>
                        <div className="w-9 h-7 bg-amber-400/80 rounded-md"></div>
                      </div>
                      <div className="text-base tracking-widest text-center py-2 font-bold select-none text-slate-200">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-300 flex-row-reverse">
                        <div>
                          <p className="text-[7px] text-slate-400">CARD HOLDER</p>
                          <p className="font-bold truncate max-w-[120px] uppercase">{cardHolder || "FULL NAME"}</p>
                        </div>
                        <div>
                          <p className="text-[7px] text-slate-400">EXPIRES</p>
                          <p className="font-bold">{cardExpiry || "MM/YY"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Input card fields */}
                    <div className="grid grid-cols-2 gap-3 text-right">
                      <div className="col-span-2">
                        <label className="block text-slate-600 mb-1 font-bold">{lang === "ar" ? "اسم صاحب البطاقة" : "Cardholder Name"}</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Mohamed A Al-Touati"
                          className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none uppercase font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">{lang === "ar" ? "رقم البطاقة" : "Card Number"}</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                            setCardNumber(val);
                          }}
                          placeholder="4000 1234 5678 9010"
                          className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none font-mono text-center"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-right">
                        <div>
                          <label className="block text-slate-600 mb-1 font-bold">CVV</label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-bold">{lang === "ar" ? "تاريخ الصلاحية" : "Expiry"}</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Apple Pay / Google Pay */}
                {paymentMethod === "applepay" && (
                  <div className="space-y-4 text-center">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 text-right flex items-center justify-end gap-1.5 flex-row-reverse">
                      <span>🍏</span>
                      <span>Biometric Wallet Authentication (Apple / Google Pay)</span>
                    </h4>

                    <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                      {lang === "ar"
                        ? "اضغط لتشغيل مستشعر التحقق البصري أو بصمة الإصبع لجهازك لتأكيد التبرع بنقرة واحدة."
                        : "Trigger face or fingerprint ID biometric scanner to authenticate immediate checkout."}
                    </p>

                    {!biometricSuccess ? (
                      <button
                        type="button"
                        onClick={() => {
                          setBiometricPaying(true);
                          try {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            osc.frequency.value = 660;
                            osc.connect(ctx.destination);
                            osc.start(); osc.stop(ctx.currentTime + 0.1);
                          } catch(e){}
                          setTimeout(() => {
                            setBiometricPaying(false);
                            setBiometricSuccess(true);
                            try {
                              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                              const osc = ctx.createOscillator();
                              osc.frequency.setValueAtTime(800, ctx.currentTime);
                              osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
                              osc.connect(ctx.destination);
                              osc.start(); osc.stop(ctx.currentTime + 0.25);
                            } catch(e){}
                          }, 1500);
                        }}
                        disabled={biometricPaying}
                        className="bg-black hover:bg-slate-900 text-white font-black py-3 px-6 rounded-2xl cursor-pointer flex items-center justify-center gap-2 mx-auto active:scale-95 transition-transform"
                      >
                        {biometricPaying ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>{lang === "ar" ? "جاري قراءة البصمة..." : "Scanning Fingerprint..."}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-base">🍏</span>
                            <span>{lang === "ar" ? "تبرع بنقرة واحدة" : "Pay with Apple Pay"}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl inline-flex items-center gap-2 flex-row-reverse mx-auto">
                        <span className="text-xl">🟢</span>
                        <div className="text-right">
                          <p className="font-bold text-emerald-800 text-[11px]">{lang === "ar" ? "تم التحقق بالبصمة الحيوية بنجاح" : "Biometrics Verified Successfully"}</p>
                          <p className="text-[9px] text-slate-500 font-mono">TOKEN: APP-PAY-{Math.random().toString(16).substr(2,8).toUpperCase()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Cryptocurrency Tether USDT */}
                {paymentMethod === "binance" && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5 flex-row-reverse">
                      <span>💎</span>
                      <span>Tether TRC-20 Smart Contract & Binance Checkout</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="bg-white border border-slate-200 p-2 rounded-xl flex items-center justify-center max-w-[110px] mx-auto md:col-span-1">
                        {/* Simulated QR block code */}
                        <div className="grid grid-cols-4 gap-1 w-20 h-20 bg-slate-100 p-1">
                          <div className="bg-slate-800"></div><div className="bg-slate-800"></div><div className="bg-slate-200"></div><div className="bg-slate-800"></div>
                          <div className="bg-slate-200"></div><div className="bg-slate-800"></div><div className="bg-slate-200"></div><div className="bg-slate-200"></div>
                          <div className="bg-slate-800"></div><div className="bg-slate-200"></div><div className="bg-slate-800"></div><div className="bg-slate-800"></div>
                          <div className="bg-slate-800"></div><div className="bg-slate-800"></div><div className="bg-slate-200"></div><div className="bg-slate-800"></div>
                        </div>
                      </div>

                      <div className="md:col-span-2 text-right space-y-2">
                        <p className="text-[10px] text-slate-500">
                          {lang === "ar" 
                            ? "أرسل القيمة مباشرة لعنوان العقد الذكي الآمن للمنصة. يتم الكشف عن المعاملة والتسوية آلياً بالكامل."
                            : "Send payment to the platform secure smart contract. Receipt is detected and settled automatically."}
                        </p>
                        <div>
                          <label className="block text-slate-600 font-bold mb-0.5">{lang === "ar" ? "عنوان المحفظة (TRC-20)" : "USDT Wallet Address (TRC-20)"}</label>
                          <div className="flex gap-1.5 flex-row-reverse font-mono">
                            <input
                              type="text"
                              readOnly
                              value={cryptoAddress}
                              className="flex-1 bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-[10px] focus:outline-none text-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cryptoAddress);
                                setCryptoCopied(true);
                                setTimeout(() => setCryptoCopied(false), 2000);
                              }}
                              className="bg-slate-800 text-white font-bold px-2 rounded-lg hover:bg-slate-700 cursor-pointer"
                            >
                              {cryptoCopied ? "✓" : "Copy"}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between text-[9px] font-medium text-slate-500 flex-row-reverse">
                          <span>⛽ Gas Rate Estimation: <span className="font-mono text-emerald-600 font-bold">~ $1.20 (TRON)</span></span>
                          <span>⏳ Taker Confirmations: <span className="font-mono">12 blocks</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Accountant ledger notice */}
              <div className="bg-amber-50/50 border border-amber-500/10 p-3.5 rounded-2xl text-[10px] text-amber-800 leading-relaxed text-right flex gap-2 flex-row-reverse items-start">
                <span className="text-base leading-none">⚖️</span>
                <div>
                  <p className="font-bold">{lang === "ar" ? "نظام القيد المزدوج المتوازن (Double-Entry Bookkeeping)" : "Balanced Double-Entry Bookkeeping"}</p>
                  <p className="text-slate-500 mt-0.5 leading-normal">
                    {lang === "ar" 
                      ? "عند النقر على تأكيد، يقوم النظام الآلي فوراً بتشغيل محرك السندات المشفرة، وتسجيل قيد المحاسبة المزدوج لخصم النقدية وإضافتها لرصيد الصندوق المحدد لدعم أسر التمكين."
                      : "Upon confirmation, the system triggers the cryptographic coin-tracking engine, recording double-entry bookkeeping logs to debit cash holdings and credit the specified beneficiary fund."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 flex-row-reverse">
                <button
                  type="submit"
                  disabled={isProcessing || ((paymentMethod === "sadad" || paymentMethod === "mobicash") && !otpVerified) || (paymentMethod === "applepay" && !biometricSuccess)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{lang === "ar" ? "جاري الخصم والتسجيل المحاسبي..." : "Processing Bookkeeping Ledger..."}</span>
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>{lang === "ar" ? "تأكيد الدفع والتسجيل المالي" : "Confirm Donation & Settle"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCase(null);
                    setSelectedProject(null);
                    setGeneralFundType(null);
                    setOtpSent(false);
                    setOtpVerified(false);
                    setOtpCode("");
                  }}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl cursor-pointer text-sm"
                >
                  {lang === "ar" ? "إلغاء العملية" : "Cancel Transaction"}
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

        </>
      )}

    </div>
  );

  function amtObjIsValid(amtStr: string | null) {
    if (!amtStr) return false;
    const num = parseFloat(amtStr);
    return !isNaN(num) && num > 0;
  }

  function handleProcessDirectDonation(caseId: string | null, projId: string | null, fundType: string | null, amount: number) {
    triggerHaptic([50, 50]);
    if (caseId) {
      const caseObj = cases.find((c) => c.id === caseId);
      if (caseObj) {
        setSelectedCase(caseObj);
        setDonationAmount(amount);
      }
    } else if (projId) {
      const proj = projects.find((p) => p.id === projId);
      if (proj) {
        setSelectedProject(proj);
        setDonationAmount(amount);
      }
    } else if (fundType) {
      setGeneralFundType(fundType);
      setDonationAmount(amount);
    }
  }

  function progressPercent(collected: number, target: number) {
    return Math.min((collected / target) * 100, 100);
  }

  function amountValue(amt: string) {
    return amt;
  }
}
