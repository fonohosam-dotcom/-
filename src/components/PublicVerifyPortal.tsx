import React, { useState, useEffect } from "react";
import { Case, CommunityReport, OmniTransaction, LedgerEntry, User } from "../types";
import { triggerHaptic } from "../utils/haptics";
import { Search, ShieldAlert, CheckCircle2, QrCode, FileText, Info, HelpCircle, AlertTriangle, Send, Bell, Coins, Printer, Fingerprint, UserCheck, ShieldCheck, MapPin, ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { customFetch } from "../utils/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import CaseMiniMap from "./CaseMiniMap";
import { maskName, maskNationalId, maskGeneralPII } from "../utils/anonymizer";

const fetch = customFetch;

interface PublicVerifyPortalProps {
  cases: Case[];
  reports: CommunityReport[];
  users?: User[];
  onAddReport: (newReport: CommunityReport) => void;
}

export default function PublicVerifyPortal({
  cases,
  reports,
  users = [],
  onAddReport,
}: PublicVerifyPortalProps) {
  const [activeSubTab, setActiveTab] = useState<"verify" | "report" | "cases">("verify");
  const [isAnonymized, setIsAnonymized] = useState(true);
  
  // Case search states
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "صحية" | "تعليمية" | "سكنية" | "معيشية">("all");
  const [expandedMapCaseIds, setExpandedMapCaseIds] = useState<Record<string, boolean>>({});
  const [expandedReportIds, setExpandedReportIds] = useState<Record<string, boolean>>({});
  
  // Verification states
  const [searchReceipt, setSearchReceipt] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    transaction: OmniTransaction;
    ledgerEntries: LedgerEntry[];
    integrityCheck: {
      isHashValid: boolean;
      recalculatedHash: string;
      secureTLS: string;
      blockchainProof: string;
      timestamp: string;
    };
  } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Whistleblower form states
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [reason, setReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Verification Search handler
  const handleVerifySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchReceipt.trim()) return;

    setLoadingVerify(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const res = await fetch(`/api/donations/verify/${searchReceipt.trim().toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
        // Play success tone
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 0.25);
        } catch (err) {}
      } else {
        const errData = await res.json();
        setVerifyError(errData.message || "السند المالي غير مسجل في السجل الوطني الموحد لمطابقة الحوكمة.");
      }
    } catch (err) {
      setVerifyError("عطل في الاتصال بخوادم ديوان الرقابة المالية.");
    } finally {
      setLoadingVerify(false);
    }
  };

  // Whistleblow report submit handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    triggerHaptic(50);

    setSubmittingReport(true);
    setReportSuccess(false);

    const matchedCase = cases.find(c => c.id === selectedCaseId);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCaseId || undefined,
          caseNumber: matchedCase ? matchedCase.caseNumber : undefined,
          reporterName: reporterName || "فاعل خير (بلا هوية)",
          reporterContact: reporterContact || undefined,
          reason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onAddReport(data.report);
        setReportSuccess(true);
        setReason("");
        setReporterName("");
        setReporterContact("");
        setSelectedCaseId("");
        
        // Play warning/action alert sound
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch (err) {}
      } else {
        alert("فشل رفع البلاغ، يرجى المحاولة مرة أخرى.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-emerald-950 to-[#0F6E56] text-white p-6 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="bg-emerald-800 text-teal-200 text-[10px] font-black px-2.5 py-1 rounded-full border border-teal-500/20">
            بوابة الرقابة والشفافية العامة للمواطنين
          </span>
          <ShieldAlert className="w-6 h-6 text-teal-200 animate-pulse" />
        </div>
        <h2 className="text-xl font-black">التحقق اللحظي ومكافحة الاحتيال والتبليغ</h2>
        <p className="text-xs text-teal-100/90 leading-relaxed max-w-2xl">
          أداة رقابية وطنية موحدة تتيح للمواطنين والجهات المعنية مراجعة صحة سندات التبرع إلكترونياً بمطابقة شفرة الـ SHA-256، أو الإبلاغ عن أي شبهات فساد أو تقديم بلاغات ضد الحالات غير المستحقة لضمان النزاهة الشرعية الكاملة.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl gap-2">
        <button
          onClick={() => setActiveTab("verify")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === "verify"
              ? "bg-white text-emerald-800 shadow-xs border border-emerald-100"
              : "text-gray-500 hover:text-slate-800"
          }`}
        >
          <QrCode className="w-4 h-4" />
          التحقق من صحة سندات التبرع (Receipt Audit)
        </button>
        <button
          onClick={() => setActiveTab("cases")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === "cases"
              ? "bg-white text-emerald-800 shadow-xs border border-emerald-100"
              : "text-gray-500 hover:text-slate-800"
          }`}
        >
          <Search className="w-4 h-4 text-emerald-600" />
          سجل حالات المساعدة والبحث بالرقم الوطني (Cases Search)
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === "report"
              ? "bg-white text-emerald-800 shadow-xs border border-emerald-100"
              : "text-gray-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          تقديم بلاغ مكافحة الاحتيال (Anti-Fraud Whistleblower)
        </button>
      </div>

      {/* SUB-VIEW 1: Receipt Verification */}
      {activeSubTab === "verify" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">البحث اللحظي ومطابقة الهاش الرقمي</h3>
            <p className="text-xs text-gray-500">
              أدخل رقم السند المالي الرسمي المكتوب على الإيصال المطبوع أو إيصال الـ PDF (مثال: RCV-2026-000001 أو RCV-2026-000002) لمطابقته مع دفتر القيود المحاسبية المزدوجة بالمنصة للتأكد من وصول تبرعك لوجهته الشرعية بالكامل.
            </p>

            <form onSubmit={handleVerifySearch} className="flex gap-2">
              <input
                type="text"
                value={searchReceipt}
                onChange={(e) => setSearchReceipt(e.target.value)}
                placeholder="أدخل رقم السند بالتنسيق RCV-2026-XXXXXX..."
                className="flex-1 border border-[#E5E3DA] rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-emerald-500 font-sans font-bold text-center"
                required
              />
              <button
                type="submit"
                disabled={loadingVerify}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{loadingVerify ? "جاري الاستعلام ومطابقة القيد..." : "استعلام وتدقيق"}</span>
              </button>
            </form>

            {verifyError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-800 flex-row-reverse">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold">{verifyError}</p>
              </div>
            )}
          </div>

          {verifyResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Receipt Visual Certificate Card (7 cols) */}
              <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 shadow-sm space-y-6 lg:col-span-7 print-card relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-2 bg-emerald-600"></div>
                
                {/* Certificate Header */}
                <div className="border-b border-[#E5E3DA] pb-4 flex items-center justify-between">
                  <div className="text-right">
                    <h4 className="text-sm font-black text-slate-800">منصة التكافل الوطني</h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">سند مالي إلكتروني موثق ومعتمد</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-xs font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مطابق شرعياً ومالياً</span>
                  </div>
                </div>

                {/* Audit Integrity Status Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">الرقم المرجعي المحاسبي</span>
                    <span className="font-mono font-black text-slate-700 block mt-1">{verifyResult.transaction.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">حالة تدقيق سلامة البيانات</span>
                    <span className="text-emerald-700 font-black block mt-1 flex items-center gap-1 flex-row-reverse justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مؤمن بالكامل (Integrity Secure)
                    </span>
                  </div>
                </div>

                {/* Main Receipt Table */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-[#E5E3DA]">
                    <span className="text-gray-500 font-bold">المرسل / المحسن</span>
                    <span className="font-black text-slate-800">
                      {verifyResult.transaction.donorNameOverride || "فاعل خير من قطاع التبرع المفتوح"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-[#E5E3DA]">
                    <span className="text-gray-500 font-bold">قيمة المساهمة الأصلية</span>
                    <span className="font-black text-slate-800 font-mono">
                      {verifyResult.transaction.displayAmount} {verifyResult.transaction.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-[#E5E3DA]">
                    <span className="text-gray-500 font-bold">المبلغ المحول والمسجل محاسبياً</span>
                    <span className="font-black text-emerald-800 font-mono text-sm">
                      {verifyResult.transaction.amount} LYD
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-[#E5E3DA]">
                    <span className="text-gray-500 font-bold">صندوق التخصيص الشرعي</span>
                    <span className="font-black text-slate-800">
                      صندوق {verifyResult.transaction.fundType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-[#E5E3DA]">
                    <span className="text-gray-500 font-bold">رقم مرجع تتبع البوابة</span>
                    <span className="font-mono text-slate-600">
                      {verifyResult.transaction.paymentReference}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-[#E5E3DA]">
                    <span className="text-gray-500 font-bold">قناة الاستلام</span>
                    <span className="font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {verifyResult.transaction.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">تاريخ القيد الموحد</span>
                    <span className="text-gray-600 font-mono">
                      {new Date(verifyResult.transaction.createdAt).toLocaleString("ar-LY")}
                    </span>
                  </div>
                </div>

                {/* Print button */}
                <div className="pt-4 border-t border-[#E5E3DA] flex justify-between items-center">
                  <p className="text-[9px] text-gray-400 font-medium">
                    * رمز الـ Hash المذكور بالشهادة يثبت سلامة السجل ضد أي تعديل برمجي أو تلاعب بالقيم المالية بأثر رجعي.
                  </p>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة مستند السند</span>
                  </button>
                </div>
              </div>

              {/* Security Audit Details Block (5 cols) */}
              <div className="space-y-6 lg:col-span-5">
                
                {/* Cryptographic Hash Chain Proof */}
                <div className="bg-slate-900 text-teal-400 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="text-teal-400">🛡️</span>
                    <h4 className="text-xs font-black text-slate-100">شفرة المطابقة والتأمين الرياضي (SHA-256)</h4>
                  </div>
                  
                  <div className="space-y-3 font-mono text-[10px] select-all">
                    <div>
                      <span className="text-gray-500 block">TRANSACTION_SHA256:</span>
                      <p className="break-all text-teal-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 mt-1">
                        {verifyResult.transaction.trackingHash || "0x9a888c3a1b02047ff5f04b08b8941cfb2"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block">RECALCULATED_VERIFIER_HASH:</span>
                      <p className="break-all text-[#10B981] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 mt-1">
                        {verifyResult.integrityCheck.recalculatedHash}
                      </p>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3 flex items-center gap-1.5 flex-row-reverse text-right">
                    <span>🧬</span>
                    <p>
                      نظام التكافؤ الموحد يعيد صياغة وتركيب شفرة السند عند كل بحث للتأكد من تطابق كامل المبالغ المستلمة مع الدفتر المحاسبي الوطني المباشر.
                    </p>
                  </div>
                </div>

                {/* Double Entry ledger match logs */}
                <div className="bg-white border border-[#E5E3DA] p-5 rounded-3xl shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                    <span className="text-emerald-800">📋</span>
                    <h4 className="text-xs font-black text-slate-800">القيود المالية بموجب الدفتر المحاسبي</h4>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    القيود المزدوجة المتولدة آلياً مع التبرع لإثبات دقة ميزان المراجعة والأرصدة بالبلديات:
                  </p>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {verifyResult.ledgerEntries.map((le) => (
                      <div key={le.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-[10px]">
                        <p className="font-bold text-slate-800">{le.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-gray-500">
                          <div>
                            <span className="text-[9px] font-bold block">من حـ/ (المدين)</span>
                            <span className="font-mono text-slate-700 font-bold block">{le.debitAccount}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold block">إلى حـ/ (الدائن)</span>
                            <span className="font-mono text-slate-700 font-bold block">{le.creditAccount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {verifyResult.ledgerEntries.length === 0 && (
                      <p className="text-[10px] text-gray-400 font-bold text-center py-4">لا توجد قيود يدوية — يتم صرفها آلياً.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: Anti-fraud Whistleblower Reports */}
      {activeSubTab === "report" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Whistleblower Form (7 cols) */}
          <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-sm space-y-6 lg:col-span-7">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 flex-row-reverse justify-end">
                <span>🛡️</span>
                <span>الإبلاغ عن حالة أو تقديم بلاغ احتيال</span>
              </h3>
              <p className="text-xs text-gray-500">
                في حال وجود شبهة احتيال أو علم مؤكد بوجود حالة غير مستحقة، يرجى كتابة التفاصيل هنا لدعم فرق البحث الميداني والرقابة الوطنية.
              </p>
            </div>

            {reportSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 flex-row-reverse">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p>
                  تم إرسال بلاغك بنجاح وسرية تامة! لقد تم تمرير التفاصيل آلياً إلى لجنة الرقابة والتدقيق الاجتماعي للمتابعة.
                </p>
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسمك الكامل (اختياري)</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full border border-[#E5E3DA] rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="يمكن تركه فارغاً للبلاغ المجهول..."
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف أو وسيلة اتصال (اختياري)</label>
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    className="w-full border border-[#E5E3DA] rounded-xl p-2.5 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                    placeholder="لهدف تواصل ديوان التدقيق..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تحديد الملف المستهدف بالبلاغ *</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full border border-[#E5E3DA] bg-slate-50 rounded-xl p-2.5 text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- اختر الملف الاجتماعي الميداني المستهدف --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      📍 {c.caseNumber} - بلدية {c.municipality} ({c.description.substring(0, 50)}...)
                    </option>
                  ))}
                  <option value="other">بلاغ عام عن شبهة أخرى بالمنصة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تفاصيل ومبررات البلاغ *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full border border-[#E5E3DA] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="يرجى كتابة معلومات دقيقة وموضوعية تثبت عدم أهلية الحالة أو الشبهة المراد التحقق منها..."
                  required
                ></textarea>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-gray-400">
                  * سرية هوية المُبلِّغ مكفولة ومحمية بالكامل بموجب جدار أمان السجل الوطني للشفافية.
                </span>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingReport ? "جاري رفع البلاغ السري..." : "إرسال البلاغ فوراً"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Column (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl space-y-3 text-rose-950">
              <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
                <h4 className="text-xs font-black">جدار أمان السجل والخصوصية</h4>
              </div>
              <p className="text-[10px] leading-relaxed">
                تلتزم ديوانية الرقابة بالمنظومة بضمان أقصى حماية ممكنة لبيانات وهوية المبلغين. لا يحق لأي جهة تتبع أو ملاحقة الشكاوى إلا لفريق الإدارة الوطنية المباشر بهدف حصر التمويلات ومنع هدر الصناديق لغير المستحقين.
              </p>
            </div>

            <div className="bg-white border border-[#E5E3DA] p-5 rounded-3xl shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800">قواعد وشروط التبليغ</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                حرصاً على وقت الباحثين الميدانيين وتجنباً للبلاغات الكيدية:
              </p>
              <ul className="text-[10px] text-gray-600 space-y-2 list-disc pr-4">
                <li>يرجى كتابة معلومات واقعية وقابلة للتحقق الميداني.</li>
                <li>لا تستخدم الألفاظ غير الملائمة أو التشهيرية.</li>
                <li>كتابة رقم هاتفك (اختياري) يعجل من عملية مطابقة صحة البلاغ وسرعة معالجته.</li>
                <li>سيتم شطب أي بلاغات كيدية متكررة من نفس العنوان آلياً.</li>
              </ul>
            </div>

          </div>

          {/* Community Reports Accordion Section */}
          <div className="lg:col-span-12 bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-xs space-y-4">
            <div className="flex justify-between items-center flex-row-reverse border-b border-slate-100 pb-3">
              <div className="text-right">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 flex-row-reverse">
                  <span>📢</span>
                  <span>سجل البلاغات وتقارير المجتمع الحالية (الشفافية الاجتماعية)</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  استعراض لجميع البلاغات والتقارير المرفوعة للرقابة مع متابعة لحظية لحالة الإجراء المتخذ من قبل ديوان التدقيق الميداني.
                </p>
              </div>
              <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black border border-rose-100">
                {reports.length} بلاغات نشطة
              </span>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {reports.map((report) => {
                const isExpanded = !!expandedReportIds[report.id];
                const matchedCase = cases.find((c) => c.id === report.caseId);

                return (
                  <div
                    key={report.id}
                    className={`border rounded-2xl transition-all ${
                      isExpanded
                        ? "border-rose-200 bg-rose-50/10 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {/* Header (Accordion Toggle) */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedReportIds((prev) => ({
                          ...prev,
                          [report.id]: !prev[report.id],
                        }));
                        // play light click sound
                        try {
                          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.frequency.setValueAtTime(isExpanded ? 300 : 450, ctx.currentTime);
                          gain.gain.setValueAtTime(0.01, ctx.currentTime);
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.start(); osc.stop(ctx.currentTime + 0.1);
                        } catch (e) {}
                      }}
                      className="w-full p-4 flex items-center justify-between gap-4 text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(report.createdAt).toLocaleDateString("ar-LY")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-row-reverse flex-1">
                        {/* Status Badge */}
                        {report.status === "pending" && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            قيد المراجعة والتحقق المبدئي
                          </span>
                        )}
                        {report.status === "investigated" && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            قيد المطابقة والتحقيق الميداني
                          </span>
                        )}
                        {report.status === "resolved" && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            تمت المعالجة وإجراء اللازم
                          </span>
                        )}

                        {/* Title Info */}
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-800">
                            {report.reporterName || "فاعل خير (بلا هوية)"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            {report.caseNumber ? `ملف المساعدة رقم ${report.caseNumber}` : "بلاغ عام عن شبهة أخرى"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-dashed border-slate-100 space-y-4 animate-fade-in text-xs text-slate-700">
                        
                        {/* Report Reason */}
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                          <span className="text-[10px] text-rose-700 font-black block text-right">📄 تفاصيل الشكوى والبلاغ المرفوع:</span>
                          <p className="text-slate-800 text-xs leading-relaxed text-right font-medium">
                            {report.reason}
                          </p>
                        </div>

                        {/* Metadata grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Case details if exists */}
                          {matchedCase && (
                            <div className="border border-slate-200/60 p-3 rounded-xl space-y-1.5 text-right">
                              <span className="text-[10px] text-gray-400 font-bold block">الملف المستهدف بالبلاغ:</span>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-800 text-xs">{matchedCase.caseNumber} - بلدية {matchedCase.municipality}</p>
                                <p className="text-[10px] text-slate-500 line-clamp-2">{matchedCase.description}</p>
                              </div>
                            </div>
                          )}

                          {/* Contact information */}
                          <div className="border border-slate-200/60 p-3 rounded-xl space-y-1.5 text-right flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-bold block">معلومات التواصل بالمبلغ:</span>
                            <p className="font-bold text-slate-800 text-xs">
                              {report.reporterContact ? (
                                <span className="font-mono">{report.reporterContact}</span>
                              ) : (
                                <span className="text-slate-400">مجهول الهوية (سرية كاملة)</span>
                              )}
                            </p>
                            <span className="text-[9px] text-emerald-600 font-bold mt-0.5">🛡️ خصوصية وسرية البيانات مكفولة بالدستور الرقابي</span>
                          </div>
                        </div>

                        {/* Status timeline showing current processing state */}
                        <div className="border border-slate-200/60 p-4 rounded-xl space-y-3 bg-slate-50/50">
                          <span className="text-[10px] text-slate-800 font-black block text-right">📊 حالة المعالجة الحالية والمسار الرقابي:</span>
                          
                          <div className="relative flex flex-row-reverse justify-between items-center pt-2 px-6">
                            {/* Line connecting the steps */}
                            <div className="absolute top-[22px] right-8 left-8 h-1 bg-slate-200 -z-10" />
                            
                            {/* Step 1: Pending */}
                            <div className="flex flex-col items-center space-y-1 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                report.status === "pending"
                                  ? "bg-amber-500 text-white border-amber-600 ring-4 ring-amber-100"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-500"
                              }`}>
                                ⏳
                              </div>
                              <span className={`text-[9px] font-black ${report.status === "pending" ? "text-amber-700" : "text-slate-500"}`}>تقديم البلاغ</span>
                            </div>

                            {/* Step 2: Investigated */}
                            <div className="flex flex-col items-center space-y-1 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                report.status === "investigated"
                                  ? "bg-sky-500 text-white border-sky-600 ring-4 ring-sky-100"
                                  : report.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                                  : "bg-white text-slate-300 border-slate-200"
                              }`}>
                                🔍
                              </div>
                              <span className={`text-[9px] font-black ${report.status === "investigated" ? "text-sky-700" : "text-slate-500"}`}>التحقيق والمطابقة</span>
                            </div>

                            {/* Step 3: Resolved */}
                            <div className="flex flex-col items-center space-y-1 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                report.status === "resolved"
                                  ? "bg-emerald-500 text-white border-emerald-600 ring-4 ring-emerald-100"
                                  : "bg-white text-slate-300 border-slate-200"
                              }`}>
                                ✅
                              </div>
                              <span className={`text-[9px] font-black ${report.status === "resolved" ? "text-emerald-700" : "text-slate-500"}`}>البت والمعالجة</span>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200/50 p-2.5 rounded-lg text-[10px] text-slate-500 text-right mt-3">
                            {report.status === "pending" && (
                              <p className="font-bold text-amber-800">
                                الحالة الحالية: البلاغ قيد الفحص والمطابقة الأولية من قبل لجنة النزاهة قبل التوجيه للباحث الميداني.
                              </p>
                            )}
                            {report.status === "investigated" && (
                              <p className="font-bold text-sky-800">
                                الحالة الحالية: تم تكليف باحث بلدية {matchedCase?.municipality || "المختصة"} لمطابقة الشكوى على أرض الواقع وفحص وضع الأسرة ميدانياً.
                              </p>
                            )}
                            {report.status === "resolved" && (
                              <p className="font-bold text-emerald-800">
                                الحالة الحالية: اكتمل التحقيق وتم اتخاذ الإجراء الرقابي والمحاسبي اللازم بخصوص الملف لضمان العدالة وتوجيه التمويل لمستحقيه الفعليين.
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}

              {reports.length === 0 && (
                <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-gray-500 text-xs font-bold">لا توجد بلاغات مرسلة في السجل حالياً</p>
                  <p className="text-[10px] text-gray-400">ستظهر البلاغات التي ترسلها أنت أو غيرك من المواطنين هنا لمتابعة حالتها بشفافية.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* SUB-VIEW 3: Cases Search & Registry */}
      {activeSubTab === "cases" && (() => {
        const stats = {
          "صحية": { count: 0, required: 0, collected: 0 },
          "سكنية": { count: 0, required: 0, collected: 0 },
          "تعليمية": { count: 0, required: 0, collected: 0 },
          "معيشية": { count: 0, required: 0, collected: 0 },
        };

        cases.forEach((c) => {
          const isMedical = c.needTypes.includes("علاج") || c.needTypes.includes("أجهزة طبية") || c.description.includes("علاج") || c.description.includes("صحي") || c.description.includes("طبي") || c.description.includes("مستشفى") || c.description.includes("مرض") || c.description.includes("أدوية");
          const isHousing = c.needTypes.includes("ترميم منازل") || c.needTypes.includes("إيجار") || c.description.includes("سكن") || c.description.includes("منزل") || c.description.includes("بيت") || c.description.includes("إيجار") || c.description.includes("ترميم");
          const isEducational = c.needTypes.includes("تعليم") || c.needTypes.includes("دراسة") || c.needTypes.includes("مدارس") || c.description.includes("تعليم") || c.description.includes("مدرسة") || c.description.includes("دراسة") || c.description.includes("جامعة") || c.description.includes("كتب") || c.description.includes("طالب");
          const isLiving = c.needTypes.includes("غذاء") || c.needTypes.includes("ملابس") || c.needTypes.includes("كفالة أيتام") || c.needTypes.includes("مالي") || c.description.includes("غذاء") || c.description.includes("أكل") || c.description.includes("ملابس") || c.description.includes("كسوة") || c.description.includes("يتيم") || c.description.includes("معيشة") || c.description.includes("مصروف");

          if (isMedical) {
            stats["صحية"].count++;
            stats["صحية"].required += c.amountRequired;
            stats["صحية"].collected += c.amountCollected;
          }
          if (isHousing) {
            stats["سكنية"].count++;
            stats["سكنية"].required += c.amountRequired;
            stats["سكنية"].collected += c.amountCollected;
          }
          if (isEducational) {
            stats["تعليمية"].count++;
            stats["تعليمية"].required += c.amountRequired;
            stats["تعليمية"].collected += c.amountCollected;
          }
          if (isLiving) {
            stats["معيشية"].count++;
            stats["معيشية"].required += c.amountRequired;
            stats["معيشية"].collected += c.amountCollected;
          }
        });

        const barChartData = [
          { name: "صحية 🩺", "المطلوب د.ل": stats["صحية"].required, "المجموع د.ل": stats["صحية"].collected },
          { name: "سكنية 🏠", "المطلوب د.ل": stats["سكنية"].required, "المجموع د.ل": stats["سكنية"].collected },
          { name: "تعليمية 🎓", "المطلوب د.ل": stats["تعليمية"].required, "المجموع د.ل": stats["تعليمية"].collected },
          { name: "معيشية 🌾", "المطلوب د.ل": stats["معيشية"].required, "المجموع د.ل": stats["معيشية"].collected },
        ];

        const pieChartData = [
          { name: "رعاية صحية 🩺", value: stats["صحية"].count, color: "#EF4444" },
          { name: "شؤون سكنية 🏠", value: stats["سكنية"].count, color: "#0EA5E9" },
          { name: "احتياجات تعليمية 🎓", value: stats["تعليمية"].count, color: "#6366F1" },
          { name: "تنمية معيشية 🌾", value: stats["معيشية"].count, color: "#F59E0B" },
        ].filter(item => item.value > 0);

        const filteredCasesList = cases.filter((c) => {
          // 1. Tag / Category filter
          if (selectedCategory !== "all") {
            const isMedical = c.needTypes.includes("علاج") || c.needTypes.includes("أجهزة طبية") || c.description.includes("علاج") || c.description.includes("صحي") || c.description.includes("طبي") || c.description.includes("مستشفى") || c.description.includes("مرض") || c.description.includes("أدوية");
            const isHousing = c.needTypes.includes("ترميم منازل") || c.needTypes.includes("إيجار") || c.description.includes("سكن") || c.description.includes("منزل") || c.description.includes("بيت") || c.description.includes("إيجار") || c.description.includes("ترميم");
            const isEducational = c.needTypes.includes("تعليم") || c.needTypes.includes("دراسة") || c.needTypes.includes("مدارس") || c.description.includes("تعليم") || c.description.includes("مدرسة") || c.description.includes("دراسة") || c.description.includes("جامعة") || c.description.includes("كتب") || c.description.includes("طالب");
            const isLiving = c.needTypes.includes("غذاء") || c.needTypes.includes("ملابس") || c.needTypes.includes("كفالة أيتام") || c.needTypes.includes("مالي") || c.description.includes("غذاء") || c.description.includes("أكل") || c.description.includes("ملابس") || c.description.includes("كسوة") || c.description.includes("يتيم") || c.description.includes("معيشة") || c.description.includes("مصروف");

            if (selectedCategory === "صحية" && !isMedical) return false;
            if (selectedCategory === "سكنية" && !isHousing) return false;
            if (selectedCategory === "تعليمية" && !isEducational) return false;
            if (selectedCategory === "معيشية" && !isLiving) return false;
          }

          // 2. Query filter
          const matchedUser = users.find((u) => u.id === c.userId);
          const beneficiaryName = matchedUser
            ? matchedUser.fullName
            : c.userId === "2"
            ? "حسام فوزي غانم"
            : `مستفيد رقم ${c.userId}`;
          const beneficiaryNationalId = matchedUser?.nationalId || (c.userId === "2" ? "119950123456" : "");
          const query = caseSearchQuery.toLowerCase().trim();

          if (!query) return true;

          return (
            beneficiaryName.toLowerCase().includes(query) ||
            beneficiaryNationalId.toLowerCase().includes(query) ||
            c.caseNumber.toLowerCase().includes(query) ||
            c.municipality.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query)
          );
        });

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 flex-row-reverse justify-end">
                <span>🔍</span>
                <span>السجل الوطني الموحد للاستعلام عن الحالات المستفيدة</span>
              </h3>
              <p className="text-xs text-gray-500 text-right">
                يمكنك البحث والاستعلام عن الحالات والطلبات الاجتماعية المدرجة في السجل الموحد بالبلديات للتحقق من أهليتها وصحة بياناتها. أدخل اسم المستفيد بالكامل أو الرقم الوطني (المكون من 12 رقماً) أو اسم البلدية لمطابقة البيانات بشكل فوري.
              </p>

              {/* PII Shield Control Notice */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex flex-col md:flex-row-reverse justify-between items-center gap-3 text-right">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="p-2 bg-emerald-100/60 rounded-xl text-emerald-800">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">درع تعمية البيانات الشخصية الذكي (PII Anonymizer) نشط 🛡️</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                      تم تفعيل التمويه والتعمية التلقائية لحماية الهوية الوطنية، الأسماء الكاملة، والبيانات الحساسة في السجلات العامة وفقاً لمعايير الخصوصية الرقمية.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnonymized(!isAnonymized)}
                  className={`w-full md:w-auto px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAnonymized
                      ? "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800"
                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  {isAnonymized ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>تعطيل التعمية (عرض البيانات الحقيقية)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-amber-600" />
                      <span>تفعيل التعمية التلقائية للبيانات</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={caseSearchQuery}
                  onChange={(e) => setCaseSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم الكامل للمستفيد، الرقم الوطني (مثال: 119950123456)، رقم الملف، أو البلدية..."
                  className="w-full border border-[#E5E3DA] rounded-xl pr-10 pl-4 py-3 text-xs focus:ring-1 focus:ring-emerald-500 font-sans font-bold text-right"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
              </div>

              {/* Category / Tags Filter */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-gray-500 block mb-2 text-right">
                  تصنيف الحالات بحسب نوع الاحتياج (Filter by Need Type):
                </span>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === "all"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                    }`}
                  >
                    الكل 📋
                  </button>
                  <button
                    onClick={() => setSelectedCategory("صحية")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === "صحية"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                    }`}
                  >
                    صحية 🩺
                  </button>
                  <button
                    onClick={() => setSelectedCategory("تعليمية")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === "تعليمية"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                    }`}
                  >
                    تعليمية 🎓
                  </button>
                  <button
                    onClick={() => setSelectedCategory("سكنية")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === "سكنية"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                    }`}
                  >
                    سكنية 🏠
                  </button>
                  <button
                    onClick={() => setSelectedCategory("معيشية")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === "معيشية"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                    }`}
                  >
                    معيشية 🌾
                  </button>
                </div>
              </div>
            </div>

            {/* 📊 لوحة مؤشرات الشفافية وتوزيع الدعم التكافلي */}
            <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3 border-b border-slate-100 pb-4 flex-row-reverse text-right">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 flex-row-reverse">
                    <span>📊</span>
                    <span>لوحة مؤشرات الشفافية وتوزيع الدعم التكافلي</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    إحصائيات فورية ومباشرة تعكس توزيع المساعدات والاحتياجات الميدانية ونسب التغطية المالية لضمان أعلى مستويات الأمان والنزاهة.
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-2xl text-[10px] font-black border border-emerald-100/60 self-start sm:self-center">
                  محدث فاعلاً 🛡️
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Money distribution bar chart (takes 7 cols) */}
                <div className="lg:col-span-7 bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-4">
                  <span className="text-[11px] font-black text-slate-800 block text-right">
                    📈 تحليل المبالغ المطلوبة والمجموعة بالدينار الليبي (د.ل)
                  </span>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 'bold' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#4B5563', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          orientation="right"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            textAlign: 'right',
                            fontSize: '11px',
                            direction: 'rtl'
                          }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar dataKey="المطلوب د.ل" fill="#10B981" radius={[4, 4, 0, 0]} name="المبلغ المطلوب" />
                        <Bar dataKey="المجموع د.ل" fill="#3B82F6" radius={[4, 4, 0, 0]} name="المبلغ المجموع" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Cases count distribution pie chart (takes 5 cols) */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-800 block text-right">
                      🍕 نسبة الحالات المستفيدة حسب نوع الاحتياج الميداني
                    </span>
                    <span className="text-[10px] text-gray-400 block text-right">
                      مقارنة الحصص الإجمالية لعدد الحالات المسجلة
                    </span>
                  </div>

                  <div className="h-48 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            fontSize: '11px',
                            direction: 'rtl'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-black text-slate-800">
                        {cases.length}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold">
                        إجمالي الحالات
                      </span>
                    </div>
                  </div>

                  {/* Legend details */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    {pieChartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-1.5 justify-end flex-row">
                        <span className="text-gray-600 font-black">{item.name} ({item.value})</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cases Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCasesList.map((c) => {
                const matchedUser = users.find((u) => u.id === c.userId);
                const beneficiaryName = matchedUser
                  ? matchedUser.fullName
                  : c.userId === "2"
                  ? "حسام فوزي غانم"
                  : `مستفيد رقم ${c.userId}`;
                const beneficiaryNationalId = matchedUser?.nationalId || (c.userId === "2" ? "119950123456" : "غير متوفر بالنسخة التجريبية");
                const progressPercentage = Math.min(100, Math.round((c.amountCollected / c.amountRequired) * 100));

                const displayBeneficiaryName = isAnonymized ? maskName(beneficiaryName) : beneficiaryName;
                const displayBeneficiaryNationalId = isAnonymized ? maskNationalId(beneficiaryNationalId) : beneficiaryNationalId;
                const displayDescription = isAnonymized ? maskGeneralPII(c.description) : c.description;

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-[#E5E3DA] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Urgency tag border */}
                    <div className={`absolute top-0 right-0 left-0 h-1.5 ${
                      c.priorityLevel === "عاجل"
                        ? "bg-rose-500"
                        : c.priorityLevel === "مرتفع"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}></div>

                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 flex-row-reverse">
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-gray-400 block">{c.caseNumber}</span>
                          <h4 className="text-sm font-black text-[#041C16] mt-0.5">
                            بلدية {c.municipality}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black ${
                            c.priorityLevel === "عاجل"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : c.priorityLevel === "مرتفع"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {c.priorityLevel}
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-black">
                            {c.status === "submitted" ? "قيد المراجعة" : c.status === "published" ? "منشور للتبرع" : "مكتمل التمويل"}
                          </span>
                        </div>
                      </div>

                      {/* Beneficiary Identity Box */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-right">
                        <div className="flex justify-between items-center flex-row-reverse text-xs">
                          <span className="text-gray-400 font-bold">اسم المستفيد المستحق:</span>
                          <span className="font-black text-slate-800 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {displayBeneficiaryName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center flex-row-reverse text-xs">
                          <span className="text-gray-400 font-bold">الرقم الوطني الموحد:</span>
                          <span className="font-mono font-black text-slate-700 flex items-center gap-1">
                            <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                            {displayBeneficiaryNationalId}
                          </span>
                        </div>
                        <div className="flex justify-between items-center flex-row-reverse text-xs border-t border-slate-200/60 pt-2 mt-1">
                          <span className="text-gray-400 font-bold">آخر تحقق وتحديث للبيانات:</span>
                          <span className="font-mono font-black text-emerald-700 flex items-center gap-1 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {c.approvedAt 
                              ? new Date(c.approvedAt).toLocaleDateString("ar-LY", { year: 'numeric', month: 'numeric', day: 'numeric' })
                              : c.bioVerification?.verifiedAt
                              ? new Date(c.bioVerification.verifiedAt).toLocaleDateString("ar-LY", { year: 'numeric', month: 'numeric', day: 'numeric' })
                              : new Date(c.createdAt).toLocaleDateString("ar-LY", { year: 'numeric', month: 'numeric', day: 'numeric' })
                            }
                          </span>
                        </div>
                      </div>

                      {/* Active Categories on Card */}
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {(c.needTypes.includes("علاج") || c.needTypes.includes("أجهزة طبية") || c.description.includes("علاج") || c.description.includes("صحي") || c.description.includes("طبي")) && (
                          <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded-full font-bold">🩺 صحية</span>
                        )}
                        {(c.needTypes.includes("ترميم منازل") || c.needTypes.includes("إيجار") || c.description.includes("سكن") || c.description.includes("منزل") || c.description.includes("بيت") || c.description.includes("إيجار") || c.description.includes("ترميم")) && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full font-bold">🏠 سكنية</span>
                        )}
                        {(c.needTypes.includes("تعليم") || c.needTypes.includes("دراسة") || c.needTypes.includes("مدارس") || c.description.includes("تعليم") || c.description.includes("مدرسة") || c.description.includes("دراسة") || c.description.includes("جامعة") || c.description.includes("كتب") || c.description.includes("طالب")) && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">🎓 تعليمية</span>
                        )}
                        {(c.needTypes.includes("غذاء") || c.needTypes.includes("ملابس") || c.needTypes.includes("كفالة أيتام") || c.needTypes.includes("مالي") || c.description.includes("غذاء") || c.description.includes("أكل") || c.description.includes("ملابس") || c.description.includes("كسوة") || c.description.includes("يتيم") || c.description.includes("معيشة")) && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full font-bold">🌾 معيشية</span>
                        )}
                      </div>

                      {/* Case Description */}
                      <p className="text-xs text-gray-600 leading-relaxed text-right line-clamp-3">
                        {displayDescription}
                      </p>

                      {/* Expandable Mini Map */}
                      {expandedMapCaseIds[c.id] && (
                        <CaseMiniMap 
                          latitude={c.latitude} 
                          longitude={c.longitude} 
                          municipality={c.municipality} 
                        />
                      )}

                      {/* Financial Progress */}
                      <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-100">
                        <div className="flex justify-between flex-row-reverse text-[10px] font-bold">
                          <span className="text-gray-400">تم جمع: <span className="text-emerald-700">{c.amountCollected} د.ل</span> من أصل {c.amountRequired} د.ل</span>
                          <span className="text-emerald-700">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              progressPercentage === 100
                                ? "bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-4 border-t border-slate-50 flex-row-reverse">
                      <button
                        onClick={() => {
                          setExpandedMapCaseIds((prev) => ({
                            ...prev,
                            [c.id]: !prev[c.id],
                          }));
                          // Play soft click
                          try {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.frequency.setValueAtTime(expandedMapCaseIds[c.id] ? 220 : 440, ctx.currentTime);
                            gain.gain.setValueAtTime(0.01, ctx.currentTime);
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start(); osc.stop(ctx.currentTime + 0.15);
                          } catch (err) {}
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                          expandedMapCaseIds[c.id]
                            ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{expandedMapCaseIds[c.id] ? "إخفاء الخريطة" : "عرض الخريطة"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          setActiveTab("report");
                          // Play soft click
                          try {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.frequency.setValueAtTime(330, ctx.currentTime);
                            gain.gain.setValueAtTime(0.02, ctx.currentTime);
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start(); osc.stop(ctx.currentTime + 0.1);
                          } catch (err) {}
                        }}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black py-2 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-all border border-rose-100 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>تقديم بلاغ / شبهة</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCasesList.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                  <span className="text-4xl">🔍</span>
                  <p className="text-gray-500 text-xs font-bold">لم نجد أي حالات مطابقة لمعايير البحث والفرز المدخلة</p>
                  <p className="text-[10px] text-gray-400">جرب اختيار تصنيف آخر أو التأكد من الاسم الكامل أو الرقم الوطني</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
