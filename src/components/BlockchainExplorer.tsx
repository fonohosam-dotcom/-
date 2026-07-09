import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link, Search, Database, ShieldCheck, Activity, Box, Key, Hash, FileCheck, ArrowRight } from "lucide-react";
import { customFetch } from "../utils/api";

export default function BlockchainExplorer({ lang, theme }: { lang: any; theme: string }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ledger transactions to simulate blockchain explorer
    customFetch("/api/transactions").then((res: any) => {
      if (res.success && res.data) {
        setTransactions(res.data.slice(0, 20)); // show latest 20
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-500" />
            <div>
              <h2 className="text-2xl font-bold">مستكشف كتل التكافل (Blockchain Explorer)</h2>
              <p className="text-sm opacity-70">الشفافية المطلقة عبر شبكة موزعة لامركزية</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            الشبكة نشطة (TakafulNet L2)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <Activity className="w-6 h-6 text-indigo-500 mb-2" />
            <span className="text-xs opacity-70">معدل المعاملات (TPS)</span>
            <span className="text-lg font-bold">45.2</span>
          </div>
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <Box className="w-6 h-6 text-amber-500 mb-2" />
            <span className="text-xs opacity-70">أحدث كتلة (Block)</span>
            <span className="text-lg font-bold">#1,048,291</span>
          </div>
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
            <span className="text-xs opacity-70">العقود الذكية النشطة</span>
            <span className="text-lg font-bold">24</span>
          </div>
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <Key className="w-6 h-6 text-blue-500 mb-2" />
            <span className="text-xs opacity-70">عقد التحقق المدققة</span>
            <span className="text-lg font-bold">12</span>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <input 
            type="text" 
            placeholder="ابحث عن معاملة، محفظة، أو كتلة..."
            className={`flex-1 p-3 rounded-lg border text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
          />
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors">
            <Search className="w-4 h-4" /> بحث
          </button>
        </div>

        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-indigo-500" />
          أحدث المعاملات (Live Ledger)
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className={`text-xs uppercase ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              <tr>
                <th className="px-6 py-3">رقم المعاملة (Tx Hash)</th>
                <th className="px-6 py-3">النوع</th>
                <th className="px-6 py-3">القيمة</th>
                <th className="px-6 py-3">الحالة</th>
                <th className="px-6 py-3">التأكيدات</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((t, i) => (
                <tr key={i} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <td className="px-6 py-4 font-mono text-xs text-indigo-500 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" /> 
                    {t.id?.substring(0, 12)}...{t.id?.substring(t.id.length - 4)}
                  </td>
                  <td className="px-6 py-4">{t.type === 'donation' ? 'إيداع تبرع' : (t.type === 'disbursement' ? 'صرف مستفيد' : 'معاملة أخرى')}</td>
                  <td className="px-6 py-4 font-bold font-mono">{t.amount} د.ل</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200">
                      مؤكدة
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">12+ Block</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center opacity-70">
                    {loading ? "جاري مزامنة الشبكة..." : "لا توجد معاملات بعد."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
