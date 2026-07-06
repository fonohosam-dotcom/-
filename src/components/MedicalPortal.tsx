import React, { useState } from "react";
import { HeartPulse, Pill, Stethoscope, Activity, FileText, Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MedicalPortal({ lang = "ar" }) {
  const [activeTab, setActiveTab] = useState("patients");

  const patients = [
    { id: 1, name: "أحمد محمود", age: 45, condition: "عملية قلب مفتوح", status: "عاجل", cost: 15000, raised: 5000 },
    { id: 2, name: "سعاد عبد السلام", age: 62, condition: "علاج كيماوي", status: "مستمر", cost: 8000, raised: 8000 },
    { id: 3, name: "طفل مجهول", age: 8, condition: "زراعة قوقعة", status: "عاجل", cost: 25000, raised: 12000 },
  ];

  const medicines = [
    { id: 1, name: "أنسولين", type: "مرض السكري", stock: 150, unit: "عبوة", needed: 300 },
    { id: 2, name: "أدوية كيماوي", type: "أورام", stock: 20, unit: "جرعة", needed: 100 },
  ];

  const equipment = [
    { id: 1, name: "جهاز تنفس صناعي", hospital: "مستشفى طرابلس المركزي", status: "يعمل", lastCheck: "2023-10-01" },
    { id: 2, name: "جهاز غسيل كلى", hospital: "مستشفى بنغازي الطبي", status: "معطل - يحتاج صيانة", lastCheck: "2023-09-15" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header Panel */}
      <div className="bg-gradient-to-l from-rose-950 via-rose-900 to-rose-950 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-rose-500/20">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent -z-10"></div>
        <div className="space-y-1.5 flex-1">
          <span className="bg-rose-500/20 text-rose-300 text-[10px] font-black px-3 py-1 rounded-full border border-rose-500/30 uppercase tracking-widest flex items-center w-fit gap-1">
            <HeartPulse className="w-3 h-3" /> القطاع الصحي والعلاجي
          </span>
          <h2 className="text-2xl font-black flex items-center gap-2 mt-2 text-rose-50">
            بوابة العلاج الشاملة (المرضى، الأدوية، والمعدات)
          </h2>
          <p className="text-xs text-rose-200/70 leading-relaxed max-w-2xl">
            منظومة متكاملة لمتابعة الحالات المرضية، توفير الأدوية الحيوية، وصيانة وتجهيز المعدات الطبية بالمستشفيات والمراكز الصحية.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        {[
          { id: "patients", label: "المرضى والحالات", icon: Activity },
          { id: "medicines", label: "صيدلية التكافل (الأدوية)", icon: Pill },
          { id: "equipment", label: "المعدات الطبية", icon: Stethoscope }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "patients" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {patients.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden group hover:border-rose-300 transition-all">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-black text-slate-800 text-sm">{p.name}</h3>
                      <span className="text-[10px] text-slate-500 font-bold">{p.condition} • {p.age} سنة</span>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${p.status === "عاجل" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {p.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>الاحتياج: {p.cost.toLocaleString()} د.ل</span>
                      <span>تم جمع: {p.raised.toLocaleString()} د.ل</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (p.raised / p.cost) * 100)}%` }}></div>
                    </div>
                  </div>
                  
                  <button className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors">
                    دعم حالة المريض
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "medicines" && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs">
                  <tr>
                    <th className="p-4">اسم الدواء</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">المخزون الحالي</th>
                    <th className="p-4">الاحتياج الشهري</th>
                    <th className="p-4">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-emerald-500" /> {m.name}
                      </td>
                      <td className="p-4 text-xs text-slate-600">{m.type}</td>
                      <td className="p-4 font-mono text-xs">
                        <span className={`px-2 py-1 rounded font-bold ${m.stock < m.needed / 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {m.stock} {m.unit}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500">{m.needed} {m.unit}</td>
                      <td className="p-4">
                        <button className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold transition-colors">
                          توفير نواقص
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipment.map(e => (
                <div key={e.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{e.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-bold">
                        <span>🏥 {e.hospital}</span>
                        <span>•</span>
                        <span>آخر فحص: {e.lastCheck}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold w-fit ${e.status.includes('معطل') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {e.status}
                    </span>
                    {e.status.includes('معطل') && (
                      <button className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">
                        رعاية الصيانة
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
