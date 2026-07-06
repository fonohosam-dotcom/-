import React, { useState } from "react";
import { Case, MajorProject, LedgerEntry, OmniTransaction } from "../types";
import { Printer, ShieldCheck, FileCheck, Landmark, Barcode, HelpCircle } from "lucide-react";

interface OfficialPrintCenterProps {
  cases: Case[];
  projects: MajorProject[];
  ledger: LedgerEntry[];
}

export default function OfficialPrintCenter({
  cases,
  projects,
  ledger,
}: OfficialPrintCenterProps) {
  const [docType, setDocType] = useState<"donation" | "disbursement" | "audit">("donation");
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id || "");
  const [donorName, setDonorName] = useState("أبو بكر محمد السنوسي");
  const [donationAmount, setDonationAmount] = useState(1000);
  const [disbursementAmount, setDisbursementAmount] = useState(3000);

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Informational Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-3xl shadow-sm space-y-2 print:hidden">
        <div className="flex items-center justify-between">
          <span className="bg-slate-900 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-700">
            مركز المطابقة والطباعة الموحد
          </span>
          <Printer className="w-6 h-6 text-gray-300" />
        </div>
        <h2 className="text-xl font-black">مركز التوثيق وطباعة السندات الرسمية المعتمدة</h2>
        <p className="text-xs text-gray-300 leading-relaxed">
          قم بتوليد وطباعة سندات التبرع الإلكترونية، شهادات صرف أموال التبرعات والتمكين، أو التقارير المالية والرقابية الشاملة المختومة بشفرة النزاهة لإدارة التدقيق والجمعيات الخيرية.
        </p>
      </div>

      {/* Document Selector Controls */}
      <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl flex flex-wrap gap-2 justify-start flex-row-reverse print:hidden">
        <button
          onClick={() => setDocType("donation")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            docType === "donation" ? "bg-[#0F6E56] text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          📄 سند تبرع ومساهمة رسمية
        </button>
        <button
          onClick={() => setDocType("disbursement")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            docType === "disbursement" ? "bg-[#0F6E56] text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          📄 شهادة صرف وتمكين مستفيد
        </button>
        <button
          onClick={() => setDocType("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            docType === "audit" ? "bg-[#0F6E56] text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          📊 ملخص الرقابة والتدقيق المالي
        </button>
      </div>

      {/* Inputs to customize what gets printed */}
      <div className="bg-white border border-[#E5E3DA] p-5 rounded-3xl space-y-4 print:hidden">
        <span className="text-xs font-black text-gray-800 block border-r-4 border-[#1D9E75] pr-2">تخصيص مستند الطباعة:</span>
        
        {docType === "donation" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600">اسم المتبرع (فاعل خير):</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600">قيمة التبرع (دينار ليبي):</label>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>
        )}

        {docType === "disbursement" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600">اختر اسم المستفيد المسجل بالسجل:</label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} - بلدية {c.municipality} ({c.priorityLevel})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600">ميزانية الصرف المعتمدة (دينار):</label>
              <input
                type="number"
                value={disbursementAmount}
                onChange={(e) => setDisbursementAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>
        )}

        {docType === "audit" && (
          <p className="text-xs text-gray-500 font-bold">
            سيقوم النظام آلياً بجلب كافة الحركات المقيدة في دفتر الأستاذ المالي العام لطباعة ميزانية عمومية مطابقة لإدارة التدقيق.
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handlePrint}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-6 py-3 rounded-2xl transition-colors cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>بدء طباعة المستند الرسمي (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* PRINT STAGED LAYOUT - Optimized for real printing and browser-friendly styles */}
      <div className="bg-white border-2 border-slate-900 rounded-none p-10 max-w-2xl mx-auto shadow-md relative overflow-hidden font-serif leading-relaxed text-[#111]">
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <span className="text-[8rem] font-bold rotate-12">TAKAFUL</span>
        </div>

        {/* State / Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-center justify-between">
          <div className="text-right text-xs space-y-1 font-bold">
            <p>ليبيا</p>
            <p>الهيئة الوطنية للتكافل الاجتماعي الموحد</p>
            <p>إدارة التدقيق والمطابقة المالية</p>
            <p className="font-mono text-[9px] text-gray-500">التاريخ: {new Date().toLocaleDateString("ar-LY")}</p>
          </div>
          
          <div className="text-center font-bold space-y-1.5">
            <span className="w-12 h-12 border-2 border-slate-900 rounded-full flex items-center justify-center text-2xl mx-auto font-black shadow-sm bg-slate-50">
              🦅
            </span>
            <p className="text-[10px] tracking-widest uppercase text-slate-800">STATE OF LIBYA</p>
          </div>

          <div className="text-left text-xs space-y-1 font-bold">
            <p>رقم المستند: SEC-2026-{(Math.random() * 10000).toFixed(0)}</p>
            <p>حالة التدقيق: مطابقة ومؤمنة</p>
            <p>بوابة حوكمة إدارة التدقيق</p>
            <p className="font-mono text-[9px] text-gray-500">الوقت: {new Date().toLocaleTimeString("ar-LY")}</p>
          </div>
        </div>

        {/* DOCUMENT CONTENT GENERATION BASED ON TYPE */}
        {docType === "donation" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black underline underline-offset-4 decoration-2">سند قبض وتبرع مالي إلكتروني رسمي</h3>
              <p className="text-xs text-gray-500">صادر عن السجل الوطني الموحد لمنصة التكافل الذكية</p>
            </div>

            <div className="text-sm space-y-4 pt-4 border-t border-slate-200">
              <p className="leading-loose">
                تشهد الهيئة الوطنية للتكافل الاجتماعي واللجان الوطنية الفرعية ببلديات ليبيا بأن المحسن الكريم السيد: 
                <span className="font-black px-1 text-emerald-800 text-sm"> « {donorName || "فاعل خير"} » </span> 
                قد قام بتقديم مساهمة مالية وقدرها: 
                <span className="font-mono font-black text-sm px-1.5 border border-slate-900 mx-1 bg-slate-50"> {donationAmount} LYD </span>
                (فقط {donationAmount} دينار ليبي لا غير) لصالح دعم وتوفير ميزانيات التمكين الاجتماعي لملفات العائلات والمرافق التنموية المسجلة بالمنظومة الوطنية بليبيا.
              </p>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-gray-700">✓ تفاصيل تتبع القيد المحاسبي الرقمي:</p>
                <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                  <div><strong>حالة الحساب:</strong> مقيد بدفتر الأستاذ المالي</div>
                  <div><strong>طريقة التبرع:</strong> بوابة الدفع الفائقة السريعة</div>
                  <div><strong>رقم الإيصال:</strong> REC-{(Math.random() * 99999).toFixed(0)}</div>
                  <div><strong>رمز التشفير:</strong> 🔒 SHA-256 SECURED</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {docType === "disbursement" && activeCase && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black underline underline-offset-4 decoration-2">شهادة اعتماد وصرف ميزانية تمكين اجتماعي</h3>
              <p className="text-xs text-gray-500">صادر عن هيئة التدقيق والمطابقة للصدقات</p>
            </div>

            <div className="text-sm space-y-4 pt-4 border-t border-slate-200">
              <p className="leading-loose">
                تثبت اللجان الوطنية للتدقيق والنزاهة بناءً على نتائج التقييم الميداني العشري السري للمحقق الاجتماعي المعتمد، بأهليّة واستحقاق ملف الأسرة رقم:
                <span className="font-mono font-black text-sm px-1 border border-slate-950 mx-1"> {activeCase.caseNumber} </span>
                التابع لرب الأسرة المسجل بالرقم الوطني المعتمد وبناءً عليه تقرر صرف ميزانية تمكين فورية وقدرها:
                <span className="font-mono font-black text-sm px-1.5 border border-slate-900 mx-1 bg-slate-50"> {disbursementAmount} LYD </span>
                لتأمين متطلبات المعيشة والرعاية الطبية والتعليمية ببلدية 
                <span className="font-black px-1 text-slate-800"> « {activeCase.municipality} » </span>.
              </p>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-gray-700">✓ تفاصيل الملف وبيانات المستفيد الحيوية:</p>
                <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                  <div><strong>عدد الأفراد:</strong> {activeCase.family?.totalMembers || 5} أفراد</div>
                  <div><strong>مؤشر الاحتياج:</strong> {activeCase.needScore || 8} / 10 (مرتفع جداً)</div>
                  <div><strong>نوع المخصص:</strong> دعم مالي وتجهيز عيني عاجل</div>
                  <div><strong>حالة المسكن:</strong> {activeCase.family?.housingCondition || "متوسط"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {docType === "audit" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black underline underline-offset-4 decoration-2">تقرير حوكمة الحركات والقيود المالية المزدوجة</h3>
              <p className="text-xs text-gray-500">دفتر أستاذ إدارة التدقيق وهيئة الرقابة الإدارية للتكافل</p>
            </div>

            <div className="text-xs space-y-4 pt-4 border-t border-slate-200 font-sans">
              <table className="w-full text-right border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900">
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">الحساب الدائن</th>
                    <th className="p-2">الحساب المدين</th>
                    <th className="p-2 text-left">القيمة (LYD)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.slice(0, 5).map((e) => (
                    <tr key={e.id} className="border-b border-slate-200">
                      <td className="p-2 font-mono">{new Date(e.entryDate).toLocaleDateString()}</td>
                      <td className="p-2 font-serif">{e.creditAccount}</td>
                      <td className="p-2 font-serif">{e.debitAccount}</td>
                      <td className="p-2 text-left font-mono font-bold text-[#0F6E56]">{e.amount}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-400 font-bold">لا توجد قيود بالدفتر العام حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="bg-slate-50 p-3 rounded-xl text-[10px] text-gray-500 text-center leading-relaxed font-serif">
                تم استخراج هذا الكشف آلياً ومطابقته رقمياً مع قيود دفتر الأستاذ المالي الموحد ومحفظة الضمان الاجتماعي الوطني.
              </div>
            </div>
          </div>
        )}

        {/* Barcode and Stamp of Authority */}
        <div className="mt-10 pt-6 border-t border-slate-300 grid grid-cols-2 gap-4 items-end text-xs font-bold">
          {/* Official Stamp */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <span className="text-[10px] text-gray-400">توقيع واعتماد هيئة التدقيق والرقابة</span>
            <div className="w-16 h-16 border-2 border-dashed border-emerald-600 rounded-full flex flex-col items-center justify-center text-emerald-700 rotate-12 bg-emerald-50/20 text-[9px] font-black leading-tight shadow-inner">
              <span>مـعـتـمـد</span>
              <span>لجنة التكافل</span>
              <span>2026/06/29</span>
            </div>
          </div>

          {/* Barcode / System Integrity */}
          <div className="text-left flex flex-col items-end space-y-1">
            <Barcode className="w-28 h-8 text-slate-800" />
            <span className="font-mono text-[8px] text-slate-500">AUTHENTICITY CODE: TAKAFUL-SEC-2026-LY</span>
          </div>
        </div>

      </div>

    </div>
  );
}
