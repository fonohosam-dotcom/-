import React, { useState, useEffect } from "react";
import { User } from "../types";
import { 
  Lock, Unlock, ShieldAlert, Fingerprint, RefreshCw, CheckCircle, 
  Eye, FileText, AlertTriangle, Key, Sparkles, ScanFace
} from "lucide-react";

interface DocumentMeta {
  id: string;
  title: string;
  type: string;
  fileSize: string;
  category: "national_id" | "family_book" | "medical_report" | "biometric";
  officialSealCode: string;
}

interface SecureDocumentOverlayProps {
  user: User | null;
  document: DocumentMeta;
  caseNumber: string;
  key?: any;
}

export default function SecureDocumentOverlay({ user, document, caseNumber }: SecureDocumentOverlayProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<"idle" | "scanning" | "authenticating" | "completed">("idle");
  const [securePin, setSecurePin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [mockLoadingText, setMockLoadingText] = useState("");

  const hasAccessRole = user?.role === "admin" || user?.role === "researcher";

  // Simulate decryption loading texts
  useEffect(() => {
    if (verificationStep === "scanning") {
      const texts = [
        "جاري تفعيل مصفوفة فك التشفير...",
        "جاري قراءة المفتاح الرقمي للباحث...",
        "جاري فحص شهادة الأمان ...",
        "مطابقة الهوية مع السجل الوطني..."
      ];
      let i = 0;
      setMockLoadingText(texts[0]);
      const interval = setInterval(() => {
        i++;
        if (i < texts.length) {
          setMockLoadingText(texts[i]);
        }
      }, 700);
      return () => clearInterval(interval);
    }
  }, [verificationStep]);

  const handleStartDecryption = () => {
    if (!hasAccessRole) {
      setErrorMsg("⚠️ خطأ أمني: لا تملك الصلاحيات الكافية للوصول للملف.");
      return;
    }
    setErrorMsg("");
    setShowPinDialog(true);
  };

  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securePin === "1234" || securePin === "2026") {
      setShowPinDialog(false);
      setIsVerifying(true);
      setVerificationStep("scanning");
      setErrorMsg("");

      // Staged animations
      setTimeout(() => {
        setVerificationStep("authenticating");
      }, 1500);

      setTimeout(() => {
        setVerificationStep("completed");
        setIsUnlocked(true);
        setIsVerifying(false);
      }, 3000);
    } else {
      setErrorMsg("❌ كود التحقق الأمني الموحد غير صحيح. يرجى تجربة '1234' أو '2026' للمحاكاة.");
    }
  };

  // Document Mock Content based on category
  const getMockDocContent = () => {
    switch (document.category) {
      case "national_id":
        return (
          <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl text-right space-y-2.5 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">وثيقة رسمية</span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-400">جمهورية ليبيا</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">مستند رقم الهوية الموحد:</span>
              <p className="text-xs font-black text-slate-800 dark:text-gray-100">بطاقة شخصية مشفرة رقمياً</p>
              <p className="text-[10px] text-gray-500">مربوط بالرقم الوطني {caseNumber}</p>
            </div>
            <div className="border-t border-emerald-500/20 pt-2 flex justify-between flex-row-reverse text-[9px] font-mono">
              <span className="text-emerald-800 dark:text-emerald-400 font-bold">كود الموثوقية: {document.officialSealCode}</span>
              <span className="text-gray-400">مصلحة الأحوال المدنية</span>
            </div>
          </div>
        );
      case "family_book":
        return (
          <div className="p-4 bg-blue-50/90 dark:bg-blue-950/20 border-2 border-blue-500/30 rounded-2xl text-right space-y-2.5 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="text-[9px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">السجل المدني</span>
              <span className="text-[10px] font-mono font-bold text-blue-800 dark:text-blue-400">كتيب العائلة</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">صورة قيد العائلة والتابعين:</span>
              <p className="text-xs font-black text-slate-800 dark:text-gray-100">بيانات أفراد الأسرة المسجلين</p>
              <p className="text-[10px] text-blue-600 font-bold">تطابق تام مع قاعدة الأحوال المدنية</p>
            </div>
            <div className="border-t border-blue-500/20 pt-2 flex justify-between flex-row-reverse text-[9px] font-mono">
              <span className="text-blue-800 dark:text-blue-400 font-bold">أرشفة رقمية: {document.officialSealCode}</span>
              <span className="text-gray-400">مكتمل التحقق الميداني</span>
            </div>
          </div>
        );
      case "medical_report":
        return (
          <div className="p-4 bg-rose-50/90 dark:bg-rose-950/20 border-2 border-rose-500/30 rounded-2xl text-right space-y-2.5 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="text-[9px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded">التقرير الطبي</span>
              <span className="text-[10px] font-mono font-bold text-rose-800 dark:text-rose-400">مركز طبي</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">شهادة اللياقة وتوصيف العجز:</span>
              <p className="text-xs font-black text-slate-800 dark:text-gray-100">إثبات الحالة الصحية المزمنة</p>
              <p className="text-[10px] text-rose-600 font-bold">صادر عن عيادة طبية</p>
            </div>
            <div className="border-t border-rose-500/20 pt-2 flex justify-between flex-row-reverse text-[9px] font-mono">
              <span className="text-rose-800 dark:text-rose-400 font-bold">رقم الأرشيف: {document.officialSealCode}</span>
              <span className="text-gray-400">مختوم ومصدق بالكامل</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 bg-amber-50/90 dark:bg-amber-950/20 border-2 border-amber-500/30 rounded-2xl text-right space-y-2.5 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="text-[9px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded">شهادة الدخل</span>
              <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400">الموارد المالية</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">كشف حساب بنكي معتمد:</span>
              <p className="text-xs font-black text-slate-800 dark:text-gray-100">شهادة عدم وجود دخل ثابت</p>
              <p className="text-[10px] text-gray-500">صادر عن مصرف الجمهورية</p>
            </div>
            <div className="border-t border-amber-500/20 pt-2 flex justify-between flex-row-reverse text-[9px] font-mono">
              <span className="text-amber-800 dark:text-amber-400 font-bold">رقم الصادر: {document.officialSealCode}</span>
              <span className="text-gray-400">مضمون النزاهة 🔒</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden relative group interactive-card h-[180px] bg-slate-50 dark:bg-slate-900 flex flex-col">
      
      {/* Decrypted Unlocked Content */}
      {isUnlocked ? (
        <div className="w-full h-full p-1 animate-fade-in relative">
          {getMockDocContent()}
          
          {/* Decryption status banner */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-emerald-500/90 backdrop-blur text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>مفكوك التشفير</span>
          </div>

          {/* Quick lock-back utility */}
          <button
            onClick={() => setIsUnlocked(false)}
            className="absolute top-2 left-2 p-1.5 bg-slate-800/80 hover:bg-slate-900 text-white rounded-full transition-all cursor-pointer opacity-0 group-hover:opacity-100 shadow"
            title="إعادة التشفير لحماية البيانات"
          >
            <Lock className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Encrypted Locked Layer (Holographic blurring & lock icon) */
        <div className="w-full h-full flex flex-col justify-between p-3.5 relative overflow-hidden">
          
          {/* Animated matrix scanline */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40 z-10"></div>
          
          {/* Dynamic binary-code fallback text overlay in the background to simulate encryption */}
          <div className="absolute inset-0 font-mono text-[8px] text-slate-400/20 select-none overflow-hidden leading-tight p-2 text-left" dir="ltr">
            01100101 01101110 01100011 01110010 01111001 01110000 01110100 
            01100101 01100100 01011111 01110011 01100101 01100011 01110101 
            01110010 01100101 01011111 01100100 01101111 01100011 01110101 
            01101101 01100101 01101110 01110100 01011111 01101101 01100001 
            01110100 01110010 01101001 01111000 01110101 01110010 01111001
          </div>

          {/* Header */}
          <div className="flex justify-between items-center z-20 flex-row-reverse">
            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 flex items-center gap-1 flex-row-reverse">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>{document.title}</span>
            </span>
            <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-gray-500 font-mono px-1.5 py-0.5 rounded">
              {document.fileSize}
            </span>
          </div>

          {/* Verification Status Overlay Indicator */}
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center space-y-2 z-20 my-auto text-center">
              {verificationStep === "scanning" ? (
                <ScanFace className="w-8 h-8 text-blue-500 animate-pulse glow-pill" />
              ) : (
                <Fingerprint className="w-8 h-8 text-emerald-500 animate-spin" />
              )}
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 animate-pulse">
                {mockLoadingText}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5 z-20 my-auto text-center p-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/40 flex items-center justify-center text-rose-600 shadow-sm animate-pulse">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                وثيقة مشفرة رقمياً 🔒
              </span>
              <p className="text-[8px] text-gray-400 max-w-[170px] leading-tight">
                يتطلب صلاحية مدقق معتمدة لتشغيل خوارزمية الفك.
              </p>
            </div>
          )}

          {/* Decrypt Actions Footer */}
          <div className="z-20 border-t border-slate-200/40 dark:border-slate-800/80 pt-2 flex justify-between items-center flex-row-reverse">
            {hasAccessRole ? (
              <button
                type="button"
                onClick={handleStartDecryption}
                className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white font-extrabold py-1 rounded-lg text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                <Fingerprint className="w-3 h-3" />
                <span>فك التشفير والمطابقة</span>
              </button>
            ) : (
              <span className="w-full text-center text-[8px] text-rose-500 font-extrabold bg-rose-50 dark:bg-rose-950/20 py-1 rounded-lg border border-rose-100/30">
                ⚠️ غير مصرح لرتبتك بالمطابقة
              </span>
            )}
          </div>
        </div>
      )}

      {/* Auth verification PIN modal popup */}
      {showPinDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in" id="secure-pin-verification">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-right space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 flex-row-reverse text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Key className="w-5 h-5 animate-bounce" />
              <h4 className="text-sm font-black">تفويض فك التشفير البيومتري الوطني</h4>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              لقد طلبت فك التشفير عن الوثيقة الحساسة للمستفيد. للتفويض الأمني، يرجى إدخال رمز التحقق الأمني الخاص بالمحقق/الباحث (استخدم <span className="font-mono font-bold text-[#0F6E56]">1234</span> أو <span className="font-mono font-bold text-[#0F6E56]">2026</span>):
            </p>

            <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={securePin}
                  onChange={(e) => setSecurePin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 text-center text-lg font-mono tracking-widest focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              {errorMsg && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold leading-relaxed text-center">
                  {errorMsg}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinDialog(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-xl text-xs transition-colors shadow-sm"
                >
                  تأكيد البصمة الرقمية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
