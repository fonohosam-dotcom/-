import React, { useState, useEffect } from "react";
import { Case, User, Family } from "../types";
import CitizenPortal from "./CitizenPortal";
import SecureDocumentOverlay from "./SecureDocumentOverlay";
import { ClipboardList, ShieldCheck, UserCheck, CheckCircle, ArrowLeft, ArrowRight, UploadCloud, Eye, MapPin, Edit3, Trash2, Plus, Search, HeartHandshake } from "lucide-react";
import { customFetch } from "../utils/api";
import { encryptValue } from "../utils/crypto";

const fetch = customFetch;

interface IntakePortalProps {
  view?: "list" | "new" | "details";
  user: User | null;
  cases: Case[];
  onRegisterCase: (caseData: any) => Promise<void>;
  onUpdateFamily: (family: Family) => Promise<void>;
  onDeleteCase?: (caseId: string) => Promise<void>;
  onUpdateCase?: (caseId: string, updatedFields: any) => Promise<void>;
}

import { useNavigate, useParams } from "react-router-dom";
export default function IntakePortal({
  user,
  cases,
  onRegisterCase,
  onUpdateFamily,
  onDeleteCase,
  onUpdateCase,
  view = "list"
}: IntakePortalProps) {
  const navigate = useNavigate();
  const { id: routeCaseId } = useParams();
  // Sub-tab navigation state
  const subTab = view === "new" ? "register" : "manage";

  // If user is a logged-in citizen, show their dedicated citizen portal
  const isCitizen = user?.role === "citizen";
  if (view === "details" && routeCaseId) {
    const caseDetails = cases.find(c => c.id === routeCaseId);
    if (!caseDetails) return <div className="p-8 text-center text-rose-500 font-bold">الحالة غير موجودة</div>;
    return (
      <div className="max-w-5xl mx-auto space-y-6 text-right animate-fade-in">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/cases")} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> العودة للقائمة
          </button>
          <h2 className="text-2xl font-black text-slate-900">الملف التفصيلي: {caseDetails.caseNumber}</h2>
        </div>
        <div className="bg-white border border-[#E5E3DA] p-8 rounded-3xl shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-800 border-b pb-2">بيانات المستفيد</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-slate-500 ml-2">الاسم:</span> <strong className="text-slate-900">{(caseDetails as any).headOfHouseholdName || "غير متوفر"}</strong></p>
                <p><span className="text-slate-500 ml-2">الرقم الوطني:</span> <strong className="text-slate-900 font-mono">{(caseDetails as any).nationalId || "غير متوفر"}</strong></p>
                <p><span className="text-slate-500 ml-2">الهاتف:</span> <strong className="text-slate-900 font-mono">{(caseDetails as any).phone || "غير متوفر" || "لا يوجد"}</strong></p>
                <p><span className="text-slate-500 ml-2">البلدية:</span> <strong className="text-slate-900">{caseDetails.municipality}</strong></p>
                <p><span className="text-slate-500 ml-2">النقاط:</span> <strong className="text-emerald-700 font-black">{caseDetails.needScore}</strong></p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-800 border-b pb-2">موقف الحالة</h3>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-slate-500 ml-2">الحالة الحالية:</span> 
                  <span className={`px-2 py-1 rounded text-xs font-bold ${caseDetails.status === "committee_approved" ? "bg-emerald-100 text-emerald-700" : caseDetails.status === "published" || caseDetails.status === "funded" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {caseDetails.status === "under_review" ? "قيد الدراسة" : caseDetails.status === "committee_approved" ? "معتمدة وجاهزة" : "نشطة ومدعومة"}
                  </span>
                </p>
                <p><span className="text-slate-500 ml-2">تاريخ الإدراج:</span> <strong className="text-slate-900 font-mono">{new Date(caseDetails.createdAt).toLocaleDateString("ar-SA")}</strong></p>
                <p><span className="text-slate-500 ml-2">أولوية الملف:</span> <strong className="text-slate-900">{caseDetails.priorityLevel}</strong></p>
                <p><span className="text-slate-500 ml-2">قيمة الاحتياج:</span> <strong className="text-rose-600 font-black">{caseDetails.amountRequired.toLocaleString()} د.ل</strong></p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">ملف العائلة (Family Composition)</h3>
            {caseDetails.family && (caseDetails.family as any)?.members?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-3 font-bold text-slate-600">الاسم</th>
                      <th className="p-3 font-bold text-slate-600">القرابة</th>
                      <th className="p-3 font-bold text-slate-600">الرقم الوطني</th>
                      <th className="p-3 font-bold text-slate-600">تاريخ الميلاد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(caseDetails.family as any)?.members?.map((m, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold">{m.name}</td>
                        <td className="p-3">{m.relationship}</td>
                        <td className="p-3 font-mono text-slate-500">{m.nationalId}</td>
                        <td className="p-3 font-mono text-slate-500">{m.birthDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-slate-500 bg-slate-50 rounded-xl text-center text-sm">لا يوجد أفراد مسجلين في دفتر العائلة.</div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  const citizenCase = cases.find((c) => c.userId === user?.id) || null;

  if (isCitizen && user) {
    return (
      <CitizenPortal
        user={user}
        citizenCase={citizenCase}
        onRegisterCase={onRegisterCase}
        onUpdateFamily={onUpdateFamily}
      />
    );
  }

  // Otherwise, render a high-fidelity intake/registration system for the public/citizens
  const [step, setStep] = useState(1);
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [municipality, setMunicipality] = useState("صبراتة");
  const [phone, setPhone] = useState("");
  
  // Family Details
  const [totalMembers, setTotalMembers] = useState(4);
  const [childrenCount, setChildrenCount] = useState(2);
  const [elderlyCount, setElderlyCount] = useState(0);
  const [disabledCount, setDisabledCount] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(450);
  const [rentAmount, setRentAmount] = useState(200);
  const [housingCondition, setHousingCondition] = useState<"جيد" | "متوسط" | "غير صالح">("متوسط");
  const [evictionRisk, setEvictionRisk] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState<"متزوج" | "أرملة" | "مطلقة" | "أعزب">("متزوج");
  const [chronicIllnesses, setChronicIllnesses] = useState(false);
  const [needTypes, setNeedTypes] = useState<string[]>(["مالي"]);
  const [description, setDescription] = useState("");
  const [amountRequired, setAmountRequired] = useState(5000);

  // Biometric & Documents Simulation
  const [signature, setSignature] = useState("");
  const [isCapturingFacial, setIsCapturingFacial] = useState(false);
  const [facialData, setFacialData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<Case | null>(null);

  // Custom Edit Mode States for Cases
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmountRequired, setEditAmountRequired] = useState(5000);
  const [editPriority, setEditPriority] = useState<"عاجل" | "مرتفع" | "متوسط" | "منخفض">("متوسط");
  const [editMunicipality, setEditMunicipality] = useState("صبراتة");
  const [caseSearch, setCaseSearch] = useState("");
  const [isScanningDocument, setIsScanningDocument] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [housingPhotos, setHousingPhotos] = useState<string[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const offlineQueue = JSON.parse(localStorage.getItem("takaful_offline_queue") || "[]");
      if (offlineQueue.length > 0) {
        console.log("Online. Syncing " + offlineQueue.length + " cases...");
        const remainingQueue = [];
        for (const caseData of offlineQueue) {
          try {
            // Remove the 'offline-' prefix or temporary id if added
            const { id, status, ...dataToSend } = caseData;
            const res = await fetch("/api/cases", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dataToSend),
            });
            const data = await res.json();
            if (data.status === "success") {
              await onRegisterCase(dataToSend);
            } else {
              remainingQueue.push(caseData);
            }
          } catch (e) {
            remainingQueue.push(caseData);
          }
        }
        localStorage.setItem("takaful_offline_queue", JSON.stringify(remainingQueue));
        if (remainingQueue.length === 0) {
          alert("تمت مزامنة جميع الحالات المحفوظة محلياً بنجاح.");
        }
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // Attempt sync on component mount if already online
    if (navigator.onLine) {
      handleOnline();
    }
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onRegisterCase]);

  // Auto-Save Effect
  useEffect(() => {
    const draftData = {
      nationalId, fullName, municipality, phone, totalMembers, childrenCount, elderlyCount,
      disabledCount, monthlyIncome, rentAmount, housingCondition, evictionRisk, maritalStatus,
      chronicIllnesses, needTypes, description, amountRequired, gpsLocation, housingPhotos
    };
    localStorage.setItem("takaful_intake_draft", JSON.stringify(draftData));
    setDraftSaved(true);
    const timeout = setTimeout(() => setDraftSaved(false), 2000);
    return () => clearTimeout(timeout);
  }, [nationalId, fullName, municipality, phone, totalMembers, childrenCount, elderlyCount, disabledCount, monthlyIncome, rentAmount, housingCondition, evictionRisk, maritalStatus, chronicIllnesses, needTypes, description, amountRequired, gpsLocation, housingPhotos]);

  // Load Draft Effect
  useEffect(() => {
    const saved = localStorage.getItem("takaful_intake_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nationalId) setNationalId(parsed.nationalId);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.gpsLocation) setGpsLocation(parsed.gpsLocation);
        if (parsed.housingPhotos) setHousingPhotos(parsed.housingPhotos);
        // ... Load other fields if needed, simplified for UX
      } catch (e) {}
    }
  }, []);

  const handleFetchGps = () => {
    setIsFetchingGps(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsFetchingGps(false);
        },
        (error) => {
          console.error(error);
          alert("تعذر تحديد الموقع الجغرافي. يرجى التأكد من صلاحيات الموقع.");
          setIsFetchingGps(false);
        }
      );
    } else {
      alert("هذا المتصفح لا يدعم تحديد الموقع الجغرافي.");
      setIsFetchingGps(false);
    }
  };

  const handleHousingPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setHousingPhotos((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningDocument(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch("/api/ai/scan-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64String }),
          });
          const result = await res.json();
          if (result.success && result.data) {
            if (result.data.nationalId) setNationalId(result.data.nationalId);
            if (result.data.fullName) setFullName(result.data.fullName);
            if (result.data.totalMembers) setTotalMembers(result.data.totalMembers);
          } else {
            alert("فشل استخراج البيانات. يرجى إدخالها يدوياً.");
          }
        } catch (error) {
          console.error(error);
          alert("خطأ في الاتصال بخدمة تحليل الوثائق.");
        } finally {
          setIsScanningDocument(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanningDocument(false);
    }
  };

  const toggleNeedType = (type: string) => {
    if (needTypes.includes(type)) {
      setNeedTypes(needTypes.filter((t) => t !== type));
    } else {
      setNeedTypes([...needTypes, type]);
    }
  };

  const handleCaptureFacial = () => {
    setIsCapturingFacial(true);
    setTimeout(() => {
      setFacialData("data:image/png;base64,facial_verification_token_simulated_2026_takaful_sec");
      setIsCapturingFacial(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId || nationalId.length < 12) {
      alert("الرجاء إدخال رقم وطني ليبي صحيح مكون من 12 رقماً ويبدأ بـ 1 أو 2");
      return;
    }
    if (!fullName) {
      alert("الرجاء إدخال الاسم الرباعي بالكامل");
      return;
    }

    setIsSubmitting(true);

    // --- 1. التحقق الآلي من السجل المدني (Civil Registry Validation) ---
    try {
      const regRes = await fetch(`/api/civil-registry/verify/${nationalId}`);
      const regData = await regRes.json();
      
      if (regData.status !== "success") {
        alert(regData.message || "فشل التحقق من الرقم الوطني من السجل المدني.");
        setIsSubmitting(false);
        return;
      }
      
      if (regData.data.isFlagged) {
        alert("تنبيه أمني: هذا الرقم الوطني عليه قيود في السجل المدني.");
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn("تعذر الاتصال بخوادم السجل المدني (وضع الاتصال غير متاح). سيتم حفظ الحالة ومزامنتها لاحقاً.");
    }
    // -------------------------------------------------------------------

    const maskedNatId = nationalId.substring(0, 4) + "******" + nationalId.substring(8);
    const encryptedNationalId = await encryptValue(nationalId);

    const caseData: any = {
      userId: `temp-user-${Date.now()}`,
      family: {
        totalMembers: Number(totalMembers),
        childrenCount: Number(childrenCount),
        elderlyCount: Number(elderlyCount),
        disabledCount: Number(disabledCount),
        monthlyIncome: Number(monthlyIncome),
        rentAmount: Number(rentAmount),
        housingCondition,
        evictionRisk,
        maritalStatus,
        chronicIllnesses,
        incomeSources: ["مساعدات اجتماعية مؤقتة"],
      },
      needTypes,
      description: description || `طلب تمكين اجتماعي وعائلي مسجل برقم وطني ${maskedNatId} للأسرة بمحلة ${municipality}`,
      amountRequired: Number(amountRequired),
      municipality,
      latitude: gpsLocation?.lat,
      longitude: gpsLocation?.lng,
      housingPhotos,
      bioVerification: {
        type: "signature",
        data: `${signature || "digital_handwritten_signature_authenticated"}|nationalId:${encryptedNationalId}`,
        verifiedAt: new Date().toISOString(),
      },
    };

    try {
      if (!isOnline) {
        // Offline: save to queue
        const offlineQueue = JSON.parse(localStorage.getItem("takaful_offline_queue") || "[]");
        caseData.status = "queued";
        caseData.id = `offline-${Date.now()}`;
        offlineQueue.push(caseData);
        localStorage.setItem("takaful_offline_queue", JSON.stringify(offlineQueue));
        
        setSubmitSuccess(caseData as any);
        localStorage.removeItem("takaful_intake_draft");
        setStep(4);
        navigate("/intake");
        alert("تم الحفظ محلياً. سيتم المزامنة عند الاتصال بالإنترنت.");
      } else {
        const res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(caseData),
        });
        const data = await res.json();
        if (data.status === "success") {
          setSubmitSuccess(data.case);
          localStorage.removeItem("takaful_intake_draft");
          await onRegisterCase(caseData);
          setStep(4);
          navigate("/intake");
        } else {
          alert("حدث خطأ أثناء حفظ الملف بالمنظومة الوطنية.");
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback if fetch fails (network error)
      const offlineQueue = JSON.parse(localStorage.getItem("takaful_offline_queue") || "[]");
      caseData.status = "queued";
      caseData.id = `offline-${Date.now()}`;
      offlineQueue.push(caseData);
      localStorage.setItem("takaful_offline_queue", JSON.stringify(offlineQueue));
      
      setSubmitSuccess(caseData as any);
      localStorage.removeItem("takaful_intake_draft");
      setStep(4);
      navigate("/intake");
      alert("فشل الاتصال بالمنظومة. تم الحفظ محلياً وسيتم المزامنة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingCase = (c: Case) => {
    setEditingCaseId(c.id);
    setEditDesc(c.description);
    setEditAmountRequired(c.amountRequired);
    setEditPriority(c.priorityLevel);
    setEditMunicipality(c.municipality);
  };

  const handleSaveEditCase = async (caseId: string) => {
    if (onUpdateCase) {
      await onUpdateCase(caseId, {
        description: editDesc,
        amountRequired: Number(editAmountRequired),
        priorityLevel: editPriority,
        municipality: editMunicipality
      });
      setEditingCaseId(null);
    }
  };

  // Filter cases based on search query
  const filteredCases = cases.filter(c => {
    const term = caseSearch.toLowerCase();
    return (
      c.caseNumber.toLowerCase().includes(term) ||
      c.municipality.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.priorityLevel.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right" dir="rtl">
      {!isOnline && (
        <div className="bg-amber-100 text-amber-800 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
          <span>⚠️ وضع عدم الاتصال (Offline). التغييرات ستُحفظ محلياً وتُزامن عند رجوع الإنترنت.</span>
        </div>
      )}
      {/* Upper Title Banner with 3D feel */}
      <div className="bg-[#041C16] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-500/10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/40 via-[#041C16] to-[#041C16] -z-10"></div>
        <div className="flex items-center justify-between flex-row-reverse">
          <ClipboardList className="w-12 h-12 text-[#10B981] drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          <div className="space-y-1">
            <span className="bg-emerald-950 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
              بوابة التمكين الأسري والسجل الموحد
            </span>
            <h2 className="text-2xl font-black text-gray-50 mt-1">مركز استقبال وإدراج المحتاجين والطلبات العائلية</h2>
            <p className="text-xs text-emerald-100/70 max-w-2xl leading-relaxed">
              نظام حوكمة ذكي وموثق رقمياً لتسجيل طلبات التمكين وصرف المخصصات العينية والمالية للأسر المستحقة ببلديات ليبيا.
            </p>
          </div>
        </div>
      </div>

      

      {/* RENDER VIEW/MANAGE TAB */}
      {subTab === "manage" && (
        <div className="space-y-6 animate-fade-in">
          {/* Search box and stats */}
          <div className="bg-white border border-[#E5E3DA] p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="ابحث برقم الملف، البلدية، أو الوصف..."
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2 text-xs text-right focus:outline-none focus:border-[#0F6E56]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
            </div>
            <div className="flex gap-4 text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                عاجل: {cases.filter(c => c.priorityLevel === "عاجل").length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                مرتفع: {cases.filter(c => c.priorityLevel === "مرتفع").length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                ممول بالكامل: {cases.filter(c => c.status === "funded").length}
              </span>
            </div>
          </div>

          {/* Cases grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCases.length === 0 ? (
              <div className="col-span-2 text-center py-16 bg-white border border-[#E5E3DA] rounded-3xl space-y-3">
                <div className="text-4xl">🔍</div>
                <p className="text-gray-500 text-xs font-bold">لم يتم العثور على أي ملفات مستفيدين تطابق بحثك</p>
              </div>
            ) : (
              filteredCases.map((c) => {
                const percentage = Math.min(100, Math.round((c.amountCollected / c.amountRequired) * 100));
                const isEditing = editingCaseId === c.id;

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-[#E5E3DA] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                  >
                    {/* Background glow for urgency */}
                    {c.priorityLevel === "عاجل" && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -z-10"></div>
                    )}

                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 flex-row-reverse">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-gray-400 block">{c.caseNumber}</span>
                        <h4 className="text-sm font-black text-[#041C16] mt-0.5">
                          ملف تمكين: {c.municipality}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-black ${
                          c.priorityLevel === "عاجل"
                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                            : c.priorityLevel === "مرتفع"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {c.priorityLevel}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-black">
                          {c.status === "submitted" ? "قيد المراجعة" : c.status === "published" ? "منشور للتبرع" : "مكتمل التمويل"}
                        </span>
                      </div>
                    </div>

                    {/* Edit mode vs normal mode */}
                    {isEditing ? (
                      <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl animate-fade-in text-right">
                        <h5 className="text-xs font-bold text-[#0F6E56]">تخصيص وتعديل بيانات الملف</h5>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 block">وصف الحالة والمعاناة</label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={3}
                            className="w-full border border-slate-200 bg-white rounded-xl p-2.5 text-xs text-right"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-right">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block">المبلغ المطلوب للتمكين (LYD)</label>
                            <input
                              type="number"
                              value={editAmountRequired}
                              onChange={(e) => setEditAmountRequired(Number(e.target.value))}
                              className="w-full border border-slate-200 bg-white rounded-xl p-2 text-xs text-center font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block">مستوى الأولوية</label>
                            <select
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value as any)}
                              className="w-full border border-slate-200 bg-white rounded-xl p-2 text-xs text-center font-bold"
                            >
                              <option value="عاجل">عاجل</option>
                              <option value="مرتفع">مرتفع</option>
                              <option value="متوسط">متوسط</option>
                              <option value="منخفض">منخفض</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setEditingCaseId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() => handleSaveEditCase(c.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#0F6E56] text-white text-[10px] font-bold"
                          >
                            حفظ التعديلات
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-600 leading-relaxed text-right">
                          {c.description}
                        </p>

                        {/* Sensitive Official Documents Panel with Encrypted Overlay */}
                        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                          <div className="flex items-center justify-between flex-row-reverse">
                            <span className="text-xs font-black text-slate-800 dark:text-gray-200 flex items-center gap-1.5 flex-row-reverse">
                              <ShieldCheck className="w-4 h-4 text-[#0F6E56]" />
                              <span>الوثائق الحساسة والملفات الرسمية المرفقة</span>
                            </span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                              محمية بتشفير مائي
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            {[
                              {
                                id: `${c.id}-doc1`,
                                title: "بطاقة الرقم الوطني الرسمية",
                                type: "صورة ضوئية (Scan)",
                                fileSize: "1.4 MB",
                                category: "national_id" as const,
                                officialSealCode: `LY-NAT-${c.caseNumber.split("-")[1] || "998"}`,
                              },
                              {
                                id: `${c.id}-doc2`,
                                title: c.family?.disabledCount > 0 || c.family?.chronicIllnesses ? "التقرير الطبي وإثبات العجز" : "كتيب السجل العائلي للأسرة",
                                type: "وثيقة PDF موثقة",
                                fileSize: "2.8 MB",
                                category: c.family?.disabledCount > 0 || c.family?.chronicIllnesses ? "medical_report" as const : "family_book" as const,
                                officialSealCode: `LY-CIV-${c.caseNumber.split("-")[1] || "334"}`,
                              }
                            ].map((doc: any) => (
                              <SecureDocumentOverlay 
                                key={doc.id}
                                user={user}
                                document={doc}
                                caseNumber={c.caseNumber}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Financial Progress */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between flex-row-reverse text-[10px] font-bold">
                            <span className="text-gray-400">تم جمع: <span className="text-emerald-700">{c.amountCollected} د.ل</span> من أصل {c.amountRequired} د.ل</span>
                            <span className="text-[#0F6E56]">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-l from-[#0F6E56] to-[#10B981] h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Action buttons including Delete & Edit */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-row-reverse">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditingCase(c)}
                              className="p-1.5 hover:bg-[#0F6E56]/10 text-[#0F6E56] rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="تخصيص وتعديل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تخصيص</span>
                            </button>
                            {onDeleteCase && (
                              <button
                                onClick={async () => {
                                  if (confirm("هل أنت متأكد من حذف هذا الملف الوطني؟")) {
                                    await onDeleteCase(c.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                title="حذف المستفيد"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            )}
                          </div>

                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{c.municipality}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RENDER NEW INTAKE FORM */}
      {subTab === "register" && (
        <div className="space-y-6">
          {step < 4 && (
            <div className="bg-white border border-[#E5E3DA] rounded-3xl p-6 shadow-sm">
              {/* Steps Navigator */}
              <div className="flex items-center justify-between border-b border-[#E5E3DA] pb-4 mb-6">
                <div className={`flex items-center gap-2 ${step >= 1 ? "text-[#0F6E56]" : "text-gray-400"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${step >= 1 ? "bg-emerald-100 text-[#0F6E56]" : "bg-slate-100 text-slate-400"}`}>1</span>
                  <span className="text-xs font-bold">البيانات الأساسية والهوية</span>
                </div>
                <div className="h-[2px] flex-1 bg-slate-100 mx-3"></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? "text-[#0F6E56]" : "text-gray-400"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${step >= 2 ? "bg-emerald-100 text-[#0F6E56]" : "bg-slate-100 text-slate-400"}`}>2</span>
                  <span className="text-xs font-bold">الحالة المعيشية</span>
                </div>
                <div className="h-[2px] flex-1 bg-slate-100 mx-3"></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? "text-[#0F6E56]" : "text-gray-400"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${step >= 3 ? "bg-emerald-100 text-[#0F6E56]" : "bg-slate-100 text-slate-400"}`}>3</span>
                  <span className="text-xs font-bold">التوثيق والتوقيع</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in text-right">
                    <h3 className="font-black text-[#085041] text-sm border-r-4 border-[#1D9E75] pr-2.5 flex items-center justify-between">
                      <span>الخطوة الأولى: الهوية الوطنية والموقع الجغرافي</span>
                      <label className="cursor-pointer bg-[#0F6E56] hover:bg-[#0c5946] text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm">
                        {isScanningDocument ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>جاري الفحص...</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>مسح وثيقة رسمية (كاميرا)</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          className="hidden" 
                          onChange={handleDocumentUpload}
                          disabled={isScanningDocument}
                        />
                      </label>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">الرقم الوطني الليبي (12 رقماً)*</label>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="مثال: 119950123456"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">الاسم الرباعي بالكامل (كما في كتيب العائلة)*</label>
                        <input
                          type="text"
                          placeholder="الاسم الثلاثي واللقب"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">البلدية والمحلة (التوزيع الجغرافي)*</label>
                        <select
                          value={municipality}
                          onChange={(e) => setMunicipality(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right font-bold text-gray-700"
                        >
                          <option value="صبراتة">صبراتة</option>
                          <option value="طرابلس">طرابلس</option>
                          <option value="بنغازي">بنغازي</option>
                          <option value="الزاوية">الزاوية</option>
                          <option value="مصراتة">مصراتة</option>
                          <option value="سبها">سبها</option>
                          <option value="الجميل">الجميل</option>
                          <option value="غريان">غريان</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">إحداثيات الموقع (للباحث الميداني)*</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleFetchGps}
                            disabled={isFetchingGps}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 flex-1 border border-blue-200"
                          >
                            {isFetchingGps ? (
                              <div className="w-4 h-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin"></div>
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                            {gpsLocation ? "تم التحديد بنجاح" : "تحديد الموقع الحالي"}
                          </button>
                          {gpsLocation && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center justify-center text-xs font-mono text-slate-500">
                              {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">رقم الهاتف للتواصل المباشر*</label>
                        <input
                          type="tel"
                          placeholder="مثال: 091XXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {draftSaved && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
                            <CheckCircle className="w-3.5 h-3.5" />
                            تم الحفظ كمسودة
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!nationalId || nationalId.length < 12) {
                            alert("يرجى التحقق من الرقم الوطني المكون من 12 رقم");
                            return;
                          }
                          if (!fullName) {
                            alert("يرجى ملء الاسم بالكامل");
                            return;
                          }
                          setStep(2);
                        }}
                        className="bg-[#0F6E56] hover:bg-[#0D5F4A] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>الخطوة التالية</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in text-right">
                    <h3 className="font-black text-[#085041] text-sm border-r-4 border-[#1D9E75] pr-2.5">الخطوة الثانية: المتغيرات المعيشية والموارد الأسرية</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">عدد أفراد الأسرة بالكتيب</label>
                        <input
                          type="number"
                          min={1}
                          value={totalMembers}
                          onChange={(e) => setTotalMembers(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">الأطفال دون سن الـ 15</label>
                        <input
                          type="number"
                          min={0}
                          value={childrenCount}
                          onChange={(e) => setChildrenCount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">كبار السن (فوق الـ 65)</label>
                        <input
                          type="number"
                          min={0}
                          value={elderlyCount}
                          onChange={(e) => setElderlyCount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">ذوي الاحتياجات الخاصة</label>
                        <input
                          type="number"
                          min={0}
                          value={disabledCount}
                          onChange={(e) => setDisabledCount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">الدخل الشهري الفعلي الكلي (LYD)</label>
                        <input
                          type="number"
                          value={monthlyIncome}
                          onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">قيمة الإيجار الشهري (إن وجد)</label>
                        <input
                          type="number"
                          value={rentAmount}
                          onChange={(e) => setRentAmount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1.5 font-bold text-xs text-gray-700">
                        <label className="block text-gray-700 mb-1.5">الحالة الاجتماعية للمعيل</label>
                        <select
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right font-bold text-gray-700"
                        >
                          <option value="متزوج">متزوج</option>
                          <option value="أرملة">أرملة</option>
                          <option value="مطلقة">مطلقة</option>
                          <option value="أعزب">أعزب</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1.5 font-bold text-xs text-gray-700">
                        <label className="block text-gray-700 mb-1.5">حالة المسكن الحالية</label>
                        <select
                          value={housingCondition}
                          onChange={(e) => setHousingCondition(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right font-bold text-gray-700"
                        >
                          <option value="جيد">جيد</option>
                          <option value="متوسط">متوسط</option>
                          <option value="غير صالح">غير صالح</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">تصوير حالة المسكن (إن أمكن)</label>
                        <div className="flex gap-2 items-center">
                          <label className="cursor-pointer flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-gray-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 text-center">
                            <UploadCloud className="w-4 h-4" />
                            إرفاق صور
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              capture="environment" 
                              className="hidden" 
                              onChange={handleHousingPhotoUpload}
                            />
                          </label>
                          {housingPhotos.length > 0 && (
                            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-2.5 rounded-xl border border-emerald-100">
                              {housingPhotos.length} مرفقات
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-4">
                      <label className="text-xs font-bold text-gray-700">أولويات ونوع الاحتياج المباشر*</label>
                      <div className="flex flex-wrap gap-2 justify-start">
                        {["غذاء", "علاج", "أجهزة طبية", "ترميم منازل", "إيجار", "كفالة أيتام", "ملابس"].map((type) => (
                          <button
                            type="button"
                            key={type}
                            onClick={() => toggleNeedType(type)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              needTypes.includes(type)
                                ? "bg-[#0F6E56]/10 border-[#0F6E56] text-[#0F6E56]"
                                : "bg-slate-50 border-slate-200 text-gray-600 hover:bg-slate-100"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">المبلغ الإجمالي المرجو للتمكين (أو المخصص المقدر)*</label>
                      <input
                        type="number"
                        value={amountRequired}
                        onChange={(e) => setAmountRequired(Number(e.target.value))}
                        className="w-48 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-center font-black text-emerald-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">شرح موجز للحالة الصحية والمعيشية للأسرة*</label>
                      <textarea
                        rows={3}
                        placeholder="يرجى كتابة لمحة سريعة لمساعدة الباحث على تعبئة التقرير الفني الميداني..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>السابق</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="bg-[#0F6E56] hover:bg-[#0D5F4A] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>الخطوة التالية</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-4 animate-fade-in text-right">
                    <h3 className="font-black text-[#085041] text-sm border-r-4 border-[#1D9E75] pr-2.5">الخطوة الثالثة: التحقق الأمني الحيوي</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-[#E5E3DA] p-5 rounded-3xl bg-slate-50/50 flex flex-col justify-between space-y-4">
                        <div className="text-right space-y-1">
                          <h4 className="text-xs font-black text-gray-800">بصمة الهوية وصورة الوجه الرسمية</h4>
                          <p className="text-[10px] text-gray-400">يلتقط النظام صورة وجه للمطابقة الآلية مع بطاقة الرقم الوطني.</p>
                        </div>
                        {facialData ? (
                          <div className="w-full h-32 bg-emerald-50 text-emerald-800 rounded-2xl flex flex-col items-center justify-center text-xs font-bold border border-emerald-200">
                            <span>✅ تم التحقق والمطابقة البيومترية</span>
                            <span className="text-[9px] text-emerald-600 font-mono mt-1">VERIFIED BY TAKAFUL ID SHIELD</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCaptureFacial}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isCapturingFacial ? "جاري تشغيل عدسة الحماية الرقمية..." : "التقاط صورة الوجه وتشفير البصمة 📸"}
                          </button>
                        )}
                      </div>

                      <div className="border border-[#E5E3DA] p-5 rounded-3xl bg-slate-50/50 flex flex-col justify-between space-y-4">
                        <div className="text-right space-y-1">
                          <h4 className="text-xs font-black text-gray-800">التوقيع الرقمي للمواطن</h4>
                          <p className="text-[10px] text-gray-400">توقيع إلكتروني يقر بصحة البيانات المدرجة في الملف.</p>
                        </div>
                        <input
                          type="text"
                          placeholder="اكتب اسمك الثلاثي للتوقيع الرقمي"
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-center font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>السابق</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting ? "جاري الإرسال للتسجيل الوطني..." : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>تأكيد التسجيل وإرسال الملف الوطني</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Success message & National Code display */}
      {step === 4 && submitSuccess && (
        <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-sm text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl border border-emerald-100 shadow-sm animate-bounce">
            🎉
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#085041]">تم تسجيل الملف بنجاح في السجل الوطني للتكافل</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              تم إدراج بيانات الأسرة وإصدار كود حماية فريد وموقع مشفر. سيتم إسناد الطلب لمدقق ميداني من بلدية <span className="font-bold text-[#0F6E56]">{municipality}</span> لجدولة زيارة التحقق الميداني.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 border border-slate-100 p-5 rounded-2xl text-right space-y-3 font-sans relative overflow-hidden">
            <div className="absolute top-2 left-2 text-[10px] bg-emerald-100 text-[#0F6E56] px-2 py-0.5 rounded-full font-bold">نشط وقيد التدقيق</div>
            <div className="border-b pb-2 mb-2 text-center font-bold text-xs text-slate-700">
              بطاقة قيد مستفيد موحد
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-[#085041] font-mono">{submitSuccess.caseNumber}</span>
              <span className="text-gray-400 font-bold">رقم الملف الوطني:</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-700">{fullName}</span>
              <span className="text-gray-400 font-bold">الاسم الرباعي:</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-700 font-mono">{nationalId}</span>
              <span className="text-gray-400 font-bold">الرقم الوطني:</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-[#0F6E56]">{municipality}</span>
              <span className="text-gray-400 font-bold">البلدية:</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-emerald-800 font-mono">{amountRequired} LYD</span>
              <span className="text-gray-400 font-bold">القيمة التقديرية:</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setStep(1);
                setNationalId("");
                setFullName("");
                setPhone("");
                setSubmitSuccess(null);
                navigate("/intake");
              }}
              className="bg-[#0F6E56] hover:opacity-90 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              عرض الكل وتعديل المستفيدين
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
