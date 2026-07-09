import React, { useState } from "react";
import { motion } from "motion/react";
import { Target, Sparkles, MapPin, Heart, Coins } from "lucide-react";
import { Case } from "../types";

export default function SmartMatch({ lang, cases, theme }: { lang: any; cases: Case[]; theme: string }) {
  const [matching, setMatching] = useState(false);
  const [matchedCases, setMatchedCases] = useState<Case[]>([]);

  const handleMatch = () => {
    setMatching(true);
    setTimeout(() => {
      // Simulate AI matching algorithm
      const sorted = [...cases]
        .filter(c => c.status === "published" || c.status === "funded")
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setMatchedCases(sorted);
      setMatching(false);
    }, 1500);
  };

  return (
    <div className={`p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-indigo-500" />
          <h2 className="text-xl font-bold">محرك المطابقة الذكي (AI)</h2>
        </div>
        <button 
          onClick={handleMatch}
          disabled={matching}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          {matching ? (
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> جاري المطابقة...</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> جد لي حالات</span>
          )}
        </button>
      </div>
      
      <p className="text-sm opacity-80 mb-6">
        يقوم محرك الذكاء الاصطناعي بتحليل سجل تبرعاتك وتفضيلاتك لاقتراح أكثر الحالات تطابقاً معك لتأثير أقصى.
      </p>

      {matchedCases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {matchedCases.map(c => (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={c.id} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-1 bg-rose-100 text-rose-700 rounded">{c.category === 'medical' ? 'طبي' : c.category}</span>
                <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3 h-3"/> {c.location}</span>
              </div>
              <h3 className="font-bold mb-2">{c.title}</h3>
              <p className="text-xs opacity-70 mb-4 line-clamp-2">{c.description}</p>
              
              <div className="mt-auto">
                <div className="flex justify-between text-xs mb-1">
                  <span>تم جمع {c.raised}</span>
                  <span>الهدف {c.goal}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mb-3">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((c.raised/c.goal)*100, 100)}%` }}></div>
                </div>
                <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" /> تبرع الآن
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
