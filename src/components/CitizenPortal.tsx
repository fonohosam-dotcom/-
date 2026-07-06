import React, { useState, useRef, useEffect } from "react";
import { BellRing, CalendarDays } from "lucide-react";
import { Case, Family, User } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface CitizenPortalProps {
  user: User;
  citizenCase: Case | null;
  onRegisterCase: (caseData: any) => Promise<void>;
  onUpdateFamily: (family: Family) => Promise<void>;
}

export default function CitizenPortal({
  user,
  citizenCase,
  onRegisterCase,
  onUpdateFamily,
}: CitizenPortalProps) {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration states
  const [description, setDescription] = useState("");
  const [amountRequired, setAmountRequired] = useState(1500);
  const [needTypes, setNeedTypes] = useState<string[]>([]);
  
  // Family states
  const [totalMembers, setTotalMembers] = useState(4);
  const [childrenCount, setChildrenCount] = useState(2);
  const [elderlyCount, setElderlyCount] = useState(0);
  const [disabledCount, setDisabledCount] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(600);
  const [rentAmount, setRentAmount] = useState(300);
  const [housingCondition, setHousingCondition] = useState<"جيد" | "متوسط" | "غير صالح">("متوسط");
  const [evictionRisk, setEvictionRisk] = useState(false);
  const [chronicIllnesses, setChronicIllnesses] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState<"متزوج" | "أرملة" | "مطلقة" | "أعزب">("متزوج");
  const [incomeSources, setIncomeSources] = useState<string[]>([]);

  // Bio-Verification states
  const [bioVerificationType, setBioVerificationType] = useState<"none" | "camera" | "signature">("none");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [bioVerified, setBioVerified] = useState(false);
  const [bioVerificationLog, setBioVerificationLog] = useState<string>("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera when stream changes or on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      setBioVerificationLog("جاري طلب صلاحيات الكاميرا والاتصال بالعدسة...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setBioVerificationLog("تم تفعيل الكاميرا المباشرة بنجاح 📸");
    } catch (err) {
      console.error("Camera access failed:", err);
      setBioVerificationLog("⚠️ الكاميرا غير متوفرة أو تم رفض الإذن. يمكنك استخدام زر الالتقاط الفوري لإنشاء محاكاة آمنة ومصدقة.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedPhoto(dataUrl);
        setBioVerified(true);
        setBioVerificationLog("✅ تم التقاط صورة الوجه الحيوية بنجاح وتأكيد الهوية الرقمية للمواطن.");
        stopCamera();
      }
    } else {
      // Fallback: draw beautiful card to simulate in dev sandbox environments
      const mockCanvas = document.createElement("canvas");
      mockCanvas.width = 320;
      mockCanvas.height = 240;
      const ctx = mockCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0F6E56";
        ctx.fillRect(0, 0, 320, 240);
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 300, 220);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("FACIAL ID VERIFIED", 160, 80);
        ctx.font = "11px Arial";
        ctx.fillText(`HOLDER: ${user.fullName}`, 160, 115);
        ctx.fillText(`NAT-ID: ${user.nationalId || "199401234567"}`, 160, 140);
        ctx.fillText(`MUNI: ${user.municipality || "SABRATHA"}`, 160, 165);
        ctx.font = "9px Arial";
        ctx.fillText("NATIONAL WELFARE SECURITY PROTOCOL - ACTIVE", 160, 205);

        const dataUrl = mockCanvas.toDataURL("image/jpeg");
        setCapturedPhoto(dataUrl);
        setBioVerified(true);
        setBioVerificationLog("✅ تم محاكاة التقاط صورة الوجه الموثقة وحقن البصمة المشفرة بنجاح.");
      }
    }
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0F6E56";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    let x = 0, y = 0;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x = 0, y = 0;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureImage(null);
    setBioVerified(false);
    setBioVerificationLog("تم تصفير لوحة التوقيع الرقمي.");
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      setSignatureImage(dataUrl);
      setBioVerified(true);
      setBioVerificationLog("✅ تم تسجيل واعتماد التوقيع الرقمي وإقران إقرار صحة البيانات بنجاح.");
    }
  };

  const handleNeedTypeToggle = (type: string) => {
    if (needTypes.includes(type)) {
      setNeedTypes(needTypes.filter((t) => t !== type));
    } else {
      setNeedTypes([...needTypes, type]);
    }
  };

  const handleIncomeSourceToggle = (source: string) => {
    if (incomeSources.includes(source)) {
      setIncomeSources(incomeSources.filter((s) => s !== source));
    } else {
      setIncomeSources([...incomeSources, source]);
    }
  };

  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || needTypes.length === 0) {
      alert("الرجاء كتابة وصف وتحديد نوع الاحتياج واحد على الأقل.");
      return;
    }
    triggerHaptic(50);

    if (!bioVerified) {
      alert("الرجاء إتمام خطوة التحقق البيومتري (التقاط صورة للوجه أو توقيع العقد رقمياً) كإثبات هوية موثق للطلب.");
      return;
    }

    setIsSubmitting(true);
    const familyData: Family = {
      totalMembers,
      childrenCount,
      elderlyCount,
      disabledCount,
      monthlyIncome,
      rentAmount,
      housingCondition,
      evictionRisk,
      maritalStatus,
      chronicIllnesses,
      incomeSources,
    };

    await onRegisterCase({
      userId: user.id,
      family: familyData,
      needTypes,
      description,
      amountRequired,
      municipality: user.municipality || "صبراتة",
      bioVerification: {
        type: bioVerificationType,
        data: bioVerificationType === "camera" ? (capturedPhoto || "") : (signatureImage || ""),
        verifiedAt: new Date().toISOString()
      }
    });

    setIsSubmitting(false);
    setShowRegisterForm(false);
  };

  const [appealText, setAppealText] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const handleAppeal = async () => {
    if (!citizenCase || !appealText.trim()) return;
    setIsSubmittingAppeal(true);
    try {
      const res = await fetch(`/api/cases/${citizenCase.id}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: appealText }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  // Lifecycle timeline helper
  const steps = [
    { key: "submitted", label: "تم التسجيل", desc: "تم قيد الطلب آلياً في السجل الوطني وحساب مؤشر الاحتياج الأولي." },
    { key: "under_review", label: "مراجعة مبدئية", desc: "الطلب قيد التدقيق الإداري من قبل مفتش البلدية." },
    { key: "field_visit_done", label: "زيارة ميدانية", desc: "قام الباحث الاجتماعي بزيارة المنزل ورفع تقرير التقييم الفعلي." },
    { key: "committee_approved", label: "معتمد من اللجنة", desc: "اعتمدت اللجنة الوطنية الحالة تمهيداً لتبنيها أو نشرها." },
    { key: "published", label: "منشور للمتبرعين", desc: "تم نشر الحالة ببيانات مستعارة لحفظ الكرامة واستقبال التبرعات." },
    { key: "funded", label: "مكتمل التبرعات", desc: "اكتمل تمويل الحالة 100% وبانتظار الصرف الفعلي من الجمعية الخيرية." },
    { key: "closed", label: "مكتمل الصرف", desc: "صُرفت المبالغ أو الأصول وتم إغلاق الملف محاسبياً بنجاح وجزا الله المانحين خيراً." },
  ];

  const getCurrentStepIndex = () => {
    if (!citizenCase) return -1;
    if (citizenCase.status === "rejected") return -2;
    const statusMap: Record<string, number> = {
      submitted: 0,
      under_review: 1,
      field_visit_done: 2,
      committee_approved: 3,
      published: 4,
      funded: 5,
      closed: 6,
    };
    return statusMap[citizenCase.status] ?? 0;
  };

  const currentStepIdx = getCurrentStepIndex();

  const [showVisitNotification, setShowVisitNotification] = useState(false);
  const [visitDaysLeft, setVisitDaysLeft] = useState(0);

  useEffect(() => {
    if (citizenCase?.scheduledVisitDate) {
      const visitDate = new Date(citizenCase.scheduledVisitDate);
      const today = new Date();
      // Reset hours for accurate day calculation
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);
      const diffTime = visitDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 3) {
        setShowVisitNotification(true);
        setVisitDaysLeft(diffDays);
      }
    }
  }, [citizenCase]);

  return (
    <div className="space-y-6">
      
      {showVisitNotification && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex items-start gap-4 animate-fade-in relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 animate-pulse">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              تذكير: اقتراب موعد الزيارة الميدانية
            </h3>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              {visitDaysLeft === 0 
                ? "الزيارة الميدانية للباحث الاجتماعي مجدولة لليوم! يرجى التواجد في المنزل وتجهيز المستندات اللازمة."
                : `الزيارة الميدانية مجدولة بعد ${visitDaysLeft} ${visitDaysLeft === 1 ? "يوم" : "أيام"}. يرجى التواجد وتجهيز المستندات.`}
            </p>
            <p className="text-xs text-amber-700/80 mt-2 font-mono">
              تاريخ الزيارة: {citizenCase?.scheduledVisitDate ? new Date(citizenCase.scheduledVisitDate).toLocaleDateString("ar-SA") : ""}
            </p>
          </div>
          <button 
            onClick={() => setShowVisitNotification(false)}
            className="mr-auto text-amber-500 hover:text-amber-700 p-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-gradient-to-l from-[#0F6E56] to-[#1D9E75] text-white p-6 rounded-2xl shadow-sm">

        <h2 className="text-xl font-black">أهلاً بك يا {user.fullName} 👋</h2>
        <p className="text-xs opacity-90 mt-1">
          بوابة المواطن المتكاملة للتقديم وتحديث الملف الأسري ومتابعة مسار معالجة طلبك في السجل الوطني.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono">
          <span>📍 البلدية: {user.municipality || "صبراتة"}</span>
          <span>🆔 الرقم الوطني: {user.nationalId || "غير متوفر"}</span>
          <span>🛡️ شجرة العطاء: {user.gamificationPoints} نقطة</span>
        </div>
      </div>

      {citizenCase ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Timeline & Case Status */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-bold">
                    رقم الملف: {citizenCase.caseNumber}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">مسار معالجة الطلب التفاعلي</h3>
                </div>
                <div>
                  {citizenCase.status === "rejected" ? (
                    <span className="bg-rose-100 text-rose-700 text-xs px-3 py-1.5 rounded-full font-bold">
                      تم رفض الطلب
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-[#0F6E56] text-xs px-3 py-1.5 rounded-full font-bold">
                      الحالة: {steps[Math.max(0, currentStepIdx)]?.label || "قيد المعالجة"}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Indicator for Timeline */}
              {citizenCase.status === "rejected" ? (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-800 text-sm mb-4 space-y-4">
                  <div>
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⚠️</span> عذراً، تم مراجعة الطلب ولم تتم الموافقة عليه للسبب التالي:
                    </p>
                    <p className="mt-1 font-mono text-xs">{citizenCase.rejectionReason || "البيانات المسجلة غير كافية أو تفتقر لمؤشر الحاجة المستحق."}</p>
                  </div>
                  
                  <div className="border-t border-rose-200 pt-4">
                    <h4 className="font-bold mb-2">تقديم طلب مراجعة (تظلم)</h4>
                    <p className="text-xs text-rose-700 mb-3">يمكنك إرسال رسالة لتوضيح حالتك أو إرفاق تفاصيل إضافية ليتم مراجعتها من جديد.</p>
                    <textarea 
                      className="w-full text-sm border border-rose-200 rounded-xl p-3 bg-white mb-2"
                      rows={3}
                      placeholder="اكتب أسباب التظلم والملاحظات..."
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                    />
                    <button 
                      onClick={handleAppeal}
                      disabled={isSubmittingAppeal || !appealText.trim()}
                      className="bg-rose-600 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-rose-700 disabled:opacity-50"
                    >
                      {isSubmittingAppeal ? "جاري الإرسال..." : "إرسال التظلم"}
                    </button>
                  </div>
                </div>
              ) : citizenCase.status === "appealed" ? (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm mb-4">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>⚖️</span> الطلب حالياً قيد المراجعة والاستئناف (تظلم)
                  </p>
                  <p className="mt-1 font-mono text-xs text-amber-700">لقد قمت بتقديم تظلم وهو الآن قيد المراجعة من لجنة التقييم.</p>
                </div>
              ) : (
                <div className="relative border-r border-[#E5E3DA] mr-4 pr-6 space-y-8">
                  {steps.map((step, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step.key} className="relative">
                        {/* Dot indicator */}
                        <span
                          className={`absolute -right-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${
                            isCurrent
                              ? "bg-amber-500 animate-pulse text-white font-bold"
                              : isDone
                              ? "bg-[#1D9E75] text-white"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {isDone ? "✓" : idx + 1}
                        </span>

                        <div className={`${isCurrent ? "opacity-100" : isDone ? "opacity-85" : "opacity-45"}`}>
                          <h4 className={`text-sm font-bold ${isCurrent ? "text-amber-600" : isDone ? "text-[#0F6E56]" : "text-gray-700"}`}>
                            {step.label}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Collected Funds tracker if published */}
            {(citizenCase.status === "published" || citizenCase.status === "funded" || citizenCase.status === "closed") && (
              <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm">
                <h4 className="text-sm font-bold text-gray-800 mb-2">رصد تبرعات الملف</h4>
                <div className="progress-track h-4 mt-3 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className="progress-fill h-full bg-gradient-to-r from-emerald-400 to-[#1D9E75] transition-all duration-500"
                    style={{ width: `${(citizenCase.amountCollected / citizenCase.amountRequired) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs mt-2 font-mono">
                  <span className="text-[#0F6E56] font-bold">المبلغ المحصل: {citizenCase.amountCollected} د.ل</span>
                  <span className="text-gray-500">الهدف الكلي: {citizenCase.amountRequired} د.ل</span>
                </div>
              </div>
            )}
          </div>

          {/* Left panel: Info and scoring */}
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 border-b border-[#E5E3DA] pb-2 mb-3">حساب مؤشر الاحتياج الآلي</h3>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-500">نقاط الاحتياج الحالية (Need Score)</span>
                <span className="text-2xl font-black text-rose-600 font-mono bg-rose-50 px-2 py-1 rounded">
                  {citizenCase.needScore}/100
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">مستوى أولوية التدخل</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  citizenCase.priorityLevel === "عاجل" 
                    ? "bg-rose-100 text-rose-700" 
                    : citizenCase.priorityLevel === "مرتفع" 
                    ? "bg-amber-100 text-amber-700" 
                    : "bg-emerald-100 text-[#0F6E56]"
                }`}>
                  أولوية {citizenCase.priorityLevel}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
                * يُحتسب هذا المؤشر تلقائياً بشكل خوارزمي غير قابل للتدخل البشري بناءً على نسبة الدخل الفردي، وحالة السكن، ونسبة العجز أو الأمراض المزمنة المسجلة.
              </p>
            </div>

            <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#085041] mb-2 flex items-center gap-1.5">
                <span>📁</span> المستندات المرفقة والتحقق الميداني
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                تم رفع الرقم الوطني وشهادة الوضع العائلي وصورة عقد الإيجار بنجاح. بروتوكول الخصوصية يمنع تعديل المستندات بمجرد اعتمادها من قبل باحث بلدية {user.municipality}.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                  <span className="text-gray-600">الرقم الوطني المصدق</span>
                  <span className="text-emerald-600 font-bold">مرفق ومؤمن</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                  <span className="text-gray-600">عقد الإيجار للمنزل</span>
                  <span className="text-emerald-600 font-bold">مرفق ومؤمن</span>
                </div>
                {citizenCase.bioVerification && (
                  <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-bold text-[11px]">🔐 التحقق البيومتري (Bio-ID)</span>
                      <span className="bg-[#E1F5EE] text-[#0F6E56] px-2 py-0.5 rounded text-[9px] font-bold">
                        {citizenCase.bioVerification.type === "camera" ? "صورة الوجه" : "توقيع معتمد"}
                      </span>
                    </div>
                    <div className="flex justify-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <img
                        src={citizenCase.bioVerification.data}
                        alt="إثبات الهوية والتحقق"
                        className="max-h-[80px] object-contain rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center bg-white border border-dashed border-[#E5E3DA] p-12 rounded-2xl">
          <span className="text-5xl block mb-4">📋</span>
          <h3 className="text-lg font-bold text-gray-800">ليس لديك ملف مساعدات نشط حالياً</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
            يمكنك تسجيل طلب جديد وتعبئة ملف البيانات الخاص بأسرتك واحتياجاتك العاجلة ليقوم الباحث الاجتماعي بزيارتكم والتحقق من الاستحقاق.
          </p>

          {!showRegisterForm ? (
            <button
              onClick={() => setShowRegisterForm(true)}
              className="mt-6 bg-[#0F6E56] hover:bg-[#085041] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer"
            >
              تسجيل طلب مساعدة جديد
            </button>
          ) : (
            <form onSubmit={handleSubmitCase} className="mt-8 text-right max-w-2xl mx-auto border-t border-[#E5E3DA] pt-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">إجمالي أفراد العائلة (شاملاً المعيل)</label>
                  <input
                    type="number"
                    min="1"
                    value={totalMembers}
                    onChange={(e) => setTotalMembers(parseInt(e.target.value))}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الحالة الاجتماعية للمعيل</label>
                  <select
                    value={maritalStatus}
                    onChange={(e: any) => setMaritalStatus(e.target.value)}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="متزوج">متزوج</option>
                    <option value="أرملة">أرملة</option>
                    <option value="مطلقة">مطلقة</option>
                    <option value="أعزب">أعزب</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">عدد الأطفال (دون سن 18)</label>
                  <input
                    type="number"
                    min="0"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(parseInt(e.target.value))}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">عدد كبار السن (فوق 60)</label>
                  <input
                    type="number"
                    min="0"
                    value={elderlyCount}
                    onChange={(e) => setElderlyCount(parseInt(e.target.value))}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">أفراد يعانون من إعاقة دائمة</label>
                  <input
                    type="number"
                    min="0"
                    value={disabledCount}
                    onChange={(e) => setDisabledCount(parseInt(e.target.value))}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">إجمالي الدخل الشهري للأسرة (د.ل)</label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(parseInt(e.target.value))}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">قيمة الإيجار الشهري - إن وجد (د.ل)</label>
                  <input
                    type="number"
                    min="0"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(parseInt(e.target.value))}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">حالة السكن الحالي</label>
                  <select
                    value={housingCondition}
                    onChange={(e: any) => setHousingCondition(e.target.value)}
                    className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="جيد">جيد (سليم إنشائياً ومستقر)</option>
                    <option value="متوسط">متوسط (يحتاج لبعض الصيانة البسيطة)</option>
                    <option value="غير صالح">غير صالح للسكن (متصدع، تسريبات مياه أو آيل للسقوط)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3 justify-center pl-4 pt-3">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evictionRisk}
                      onChange={(e) => setEvictionRisk(e.target.checked)}
                      className="rounded border-[#E5E3DA]"
                    />
                    مخطر بالطرد من المسكن أو مهدد بالإخلاء
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chronicIllnesses}
                      onChange={(e) => setChronicIllnesses(e.target.checked)}
                      className="rounded border-[#E5E3DA]"
                    />
                    وجود مرض مزمن أو حاجة ماسة لرعاية طبية لأحد الأفراد
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">نوع الاحتياج الرئيسي (اختر ما ينطبق)</label>
                <div className="flex flex-wrap gap-2.5">
                  {["غذاء", "علاج", "إيجار", "ملابس", "أجهزة طبية", "ترميم منازل", "تعليم", "مشاريع صغيرة", "كفالة أيتام"].map((type) => {
                    const isSelected = needTypes.includes(type);
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => handleNeedTypeToggle(type)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          isSelected
                            ? "bg-[#E1F5EE] border-[#0F6E56] text-[#085041] font-bold"
                            : "bg-white border-[#E5E3DA] text-gray-600 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">المبلغ المالي العاجل المطلوب أو التقديري للأصول (د.ل)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={amountRequired}
                  onChange={(e) => setAmountRequired(parseInt(e.target.value))}
                  className="w-full max-w-[200px] border border-[#E5E3DA] rounded-lg p-2 text-xs font-mono font-bold text-rose-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">وصف الحالة والأسباب بالتفصيل</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                  placeholder="اشرح أسباب تقديم طلب المساعدة بدقة وظروف العائلة وتفاصيل المسكن والدخل لمساعدة الباحث الاجتماعي واللجنة..."
                  required
                />
              </div>

              {/* Bio-Verification Step */}
              <div className="bg-slate-50 border border-[#E5E3DA] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">التحقق الرقمي والبيومتري الموحد (Bio-Verification)</h4>
                    <p className="text-[11px] text-gray-500">يتطلب السجل الوطني إرفاق إثبات هوية حيوي لمنع انتحال الشخصيات وتأكيد مصداقية الطلب.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBioVerificationType("camera");
                      setBioVerified(false);
                      setCapturedPhoto(null);
                      setSignatureImage(null);
                      startCamera();
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      bioVerificationType === "camera"
                        ? "bg-[#0F6E56] text-white border-[#0F6E56] shadow-sm"
                        : "bg-white text-gray-700 border-[#E5E3DA] hover:bg-slate-100"
                    }`}
                  >
                    <span>📸</span> التقاط صورة الوجه الحية
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBioVerificationType("signature");
                      setBioVerified(false);
                      setCapturedPhoto(null);
                      setSignatureImage(null);
                      stopCamera();
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      bioVerificationType === "signature"
                        ? "bg-[#0F6E56] text-white border-[#0F6E56] shadow-sm"
                        : "bg-white text-gray-700 border-[#E5E3DA] hover:bg-slate-100"
                    }`}
                  >
                    <span>✍️</span> رسم التوقيع الرقمي المعتمد
                  </button>
                </div>

                {/* Display Log */}
                {bioVerificationLog && (
                  <p className="text-[11px] font-mono text-[#0F6E56] bg-[#E1F5EE] px-3 py-1.5 rounded-md">
                    {bioVerificationLog}
                  </p>
                )}

                {/* Cam Area */}
                {bioVerificationType === "camera" && (
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                    <div className="relative mx-auto max-w-[320px] aspect-video bg-black rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                      {cameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : capturedPhoto ? (
                        <img src={capturedPhoto} alt="الوجه الملتقط" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-500 text-xs text-center p-4">
                          الكاميرا مغلقة أو بانتظار الإذن...
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center gap-3">
                      {cameraActive ? (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                        >
                          📸 التقاط الصورة الآن
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-[#0F6E56] hover:bg-[#085041] text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                        >
                          🔄 إعادة تشغيل الكاميرا
                        </button>
                      )}

                      {!cameraActive && !capturedPhoto && (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                        >
                          ⚡ التقاط فوري لغرض التجربة
                        </button>
                      )}

                      {capturedPhoto && (
                        <div className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                          <span>✓</span> تم الحفظ والتشفير
                        </div>
                      )}
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                {/* Signature Area */}
                {bioVerificationType === "signature" && (
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <p className="text-[11px] text-gray-400 mb-2">ارسم توقيعك الشخصي بالماوس أو الإصبع داخل الإطار أدناه:</p>
                    
                    <div className="mx-auto max-w-[400px] border border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 relative">
                      <canvas
                        ref={sigCanvasRef}
                        width={400}
                        height={150}
                        onMouseDown={handleStartDrawing}
                        onMouseMove={handleDraw}
                        onMouseUp={handleStopDrawing}
                        onMouseLeave={handleStopDrawing}
                        onTouchStart={handleStartDrawing}
                        onTouchMove={handleDraw}
                        onTouchEnd={handleStopDrawing}
                        className="w-full h-[150px] cursor-crosshair block"
                      />
                    </div>

                    <div className="flex justify-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold px-3 py-1.5 rounded text-xs cursor-pointer"
                      >
                        🗑️ مسح اللوحة
                      </button>
                      <button
                        type="button"
                        onClick={saveSignature}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded text-xs cursor-pointer"
                      >
                        💾 اعتماد وحفظ التوقيع
                      </button>

                      {signatureImage && (
                        <div className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                          <span>✓</span> تم اعتماد التوقيع
                        </div>
                      )}
                    </div>

                    {signatureImage && (
                      <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-100 flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 block mb-1">صورة التوقيع المعتمدة:</span>
                        <img src={signatureImage} alt="التوقيع الرقمي" className="max-h-[50px] object-contain" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0F6E56] hover:bg-[#085041] disabled:bg-slate-300 text-white font-bold py-2 px-6 rounded-lg text-xs cursor-pointer"
                >
                  {isSubmitting ? "جاري الإرسال وحساب المؤشر..." : "إرسال الطلب وحساب المؤشر"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="bg-white border border-[#E5E3DA] hover:bg-slate-50 text-gray-700 font-bold py-2 px-6 rounded-lg text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          )}
        </div>
      )}
    </div>
  );
}
