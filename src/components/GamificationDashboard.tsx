import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Star, Medal, Target, TrendingUp, Award, Zap } from "lucide-react";
import { customFetch } from "../utils/api";

export default function GamificationDashboard({ lang, theme }: { lang: any; theme: string }) {
  const [stats, setStats] = useState({ points: 0, level: 1, nextLevel: 1000, badges: [] });

  useEffect(() => {
    // Fetch user gamification stats
    const fetchStats = async () => {
      try {
        const res: any = await customFetch("/api/users/gamification");
        if (res.success) {
          setStats(res.data);
        } else {
          // Fallback dummy data
          setStats({
            points: 450,
            level: 3,
            nextLevel: 1000,
            badges: [
              { id: 1, name: "مبادر الخير", icon: "Star", desc: "أول تبرع لك على المنصة" },
              { id: 2, name: "داعم متواصل", icon: "Zap", desc: "تبرع لثلاثة أشهر متتالية" }
            ]
          });
        }
      } catch(e) {
        setStats({
            points: 450,
            level: 3,
            nextLevel: 1000,
            badges: [
              { id: 1, name: "مبادر الخير", icon: "Star", desc: "أول تبرع لك على المنصة" },
              { id: 2, name: "داعم متواصل", icon: "Zap", desc: "تبرع لثلاثة أشهر متتالية" }
            ]
          });
      }
    };
    fetchStats();
  }, []);

  const progress = Math.min((stats.points / stats.nextLevel) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-bold">لوحة الشرف والتأثير (Gamification)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl flex flex-col items-center justify-center text-center border ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <Star className="w-10 h-10 text-yellow-500 mb-2" />
            <p className="text-sm opacity-80 mb-1">نقاط التكافل</p>
            <h3 className="text-3xl font-bold">{stats.points}</h3>
          </div>
          <div className={`p-6 rounded-xl flex flex-col items-center justify-center text-center border ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <TrendingUp className="w-10 h-10 text-blue-500 mb-2" />
            <p className="text-sm opacity-80 mb-1">المستوى الحالي</p>
            <h3 className="text-3xl font-bold">المستوى {stats.level}</h3>
          </div>
          <div className={`p-6 rounded-xl flex flex-col items-center justify-center text-center border ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <Medal className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm opacity-80 mb-1">الشارات المكتسبة</p>
            <h3 className="text-3xl font-bold">{stats.badges.length}</h3>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="font-medium">التقدم للمستوى {stats.level + 1}</span>
            <span className="text-sm opacity-70">{stats.points} / {stats.nextLevel} نقطة</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progress}%` }} 
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full"
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-500" />
            شارات الإنجاز
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.badges.map((badge: any) => (
              <div key={badge.id} className={`p-4 rounded-xl flex flex-col items-center text-center border ${theme === 'dark' ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-200'}`}>
                {badge.icon === 'Star' ? <Star className="w-8 h-8 text-yellow-500 mb-2" /> : <Zap className="w-8 h-8 text-indigo-500 mb-2" />}
                <p className="font-bold text-sm">{badge.name}</p>
                <p className="text-xs opacity-70 mt-1">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
