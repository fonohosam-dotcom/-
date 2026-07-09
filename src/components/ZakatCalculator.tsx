import React, { useState } from "react";
import { motion } from "motion/react";
import { Calculator, HelpCircle, Coins, BrainCircuit } from "lucide-react";

export default function ZakatCalculator({ lang, t, theme }: { lang: any; t: any; theme: string }) {
  const [cash, setCash] = useState(0);
  const [gold, setGold] = useState(0); // in grams
  const [silver, setSilver] = useState(0); // in grams
  const [business, setBusiness] = useState(0);
  const [zakatDue, setZakatDue] = useState(0);
  const [fatwaQuery, setFatwaQuery] = useState("");
  const [fatwaResponse, setFatwaResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // Approximate Nisab values
  const NISAB_GOLD_GRAMS = 85;
  const GOLD_PRICE_PER_GRAM = 80; // Example USD
  const nisabValue = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM;

  const calculateZakat = () => {
    const totalWealth = cash + (gold * GOLD_PRICE_PER_GRAM) + business;
    if (totalWealth >= nisabValue) {
      setZakatDue(totalWealth * 0.025);
    } else {
      setZakatDue(0);
    }
  };

  const askFatwa = async () => {
    if (!fatwaQuery) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/fatwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: fatwaQuery })
      });
      const data = await res.json();
      if (data.success) {
        setFatwaResponse(data.text);
      } else {
        setFatwaResponse("عذراً، حدث خطأ في النظام.");
      }
    } catch (e) {
      setFatwaResponse("عذراً، حدث خطأ في الاتصال.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold">حاسبة الزكاة الذكية</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">النقد والمدخرات (بالعملة المحلية)</label>
              <input type="number" value={cash || ""} onChange={e => setCash(Number(e.target.value))} className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الذهب (بالجرام عيار 24)</label>
              <input type="number" value={gold || ""} onChange={e => setGold(Number(e.target.value))} className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">عروض التجارة (القيمة السوقية)</label>
              <input type="number" value={business || ""} onChange={e => setBusiness(Number(e.target.value))} className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} placeholder="0" />
            </div>
            <button onClick={calculateZakat} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors">
              احسب الزكاة
            </button>
          </div>

          <div className={`p-6 rounded-xl flex flex-col justify-center items-center text-center ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-emerald-50'}`}>
            <Coins className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-medium mb-2">مقدار الزكاة الواجبة</h3>
            <p className="text-4xl font-bold text-emerald-600">{zakatDue.toLocaleString(lang === 'ar' ? 'ar-LY' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm mt-4 opacity-70">يتم احتساب النصاب بناءً على سعر الذهب العالمي التقريبي.</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
        <div className="flex items-center gap-3 mb-6">
          <BrainCircuit className="w-8 h-8 text-indigo-500" />
          <h2 className="text-2xl font-bold">المستشار الشرعي الذكي (AI)</h2>
        </div>
        <div className="space-y-4">
          <p className="text-sm opacity-80">هل لديك أسئلة معقدة حول نصاب الزكاة، زكاة الأنعام، أو الحول؟ اسأل المستشار الذكي المدعوم بتقنية Gemini.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={fatwaQuery} 
              onChange={e => setFatwaQuery(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && askFatwa()}
              className={`flex-1 p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} 
              placeholder="مثال: كيف أحسب زكاة الأسهم التي أضارب بها؟" 
            />
            <button onClick={askFatwa} disabled={loading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
              {loading ? "جاري البحث..." : "اسأل"}
            </button>
          </div>
          {fatwaResponse && (
            <div className={`p-4 rounded-lg mt-4 ${theme === 'dark' ? 'bg-indigo-900/30 border border-indigo-700/50' : 'bg-indigo-50 border border-indigo-100'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{fatwaResponse}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
