import React, { useState } from "react";
import { User, OmniTransaction } from "../types";
import { Trophy, Sparkles, Heart, Share2, Award, Shield, CheckCircle } from "lucide-react";

const SEEDED_SUPPORTERS = [
  { name: "الحاج عادل الغرياني", amount: 25000, points: 2500, city: "الزاوية", avatar: "🧔", status: "محسن ذهبي" },
  { name: "عائلة القرقني الخيرية", amount: 18500, points: 1850, city: "صبراتة", avatar: "🏢", status: "عطاء بلاتيني" },
  { name: "د. آية الورفلي", amount: 12000, points: 1200, city: "الجميل", avatar: "👩‍⚕️", status: "شريكة الخير" },
  { name: "م. طارق البوعيشي", amount: 8700, points: 870, city: "صرمان", avatar: "👨‍💻", status: "داعم متواصل" },
  { name: "مؤسسة المدار للخدمات", amount: 5000, points: 500, city: "طرابلس", avatar: "📡", status: "مساهمة مؤسسية" }
];

const SEEDED_SUPPORTERS_WEEKLY = [
  { name: "د. آية الورفلي", amount: 3500, points: 350, city: "الجميل", avatar: "👩‍⚕️", status: "نجم الأسبوع" },
  { name: "م. طارق البوعيشي", amount: 2800, points: 280, city: "صرمان", avatar: "👨‍💻", status: "داعم نشط" },
  { name: "أبو بكر محمد السنوسي", amount: 1200, points: 120, city: "صبراتة", avatar: "🧔", status: "مساعِد مميز" },
];

interface ImpactLeaderboardProps {
  user: User | null;
  dbTransactions: OmniTransaction[];
}

export default function ImpactLeaderboard({ user, dbTransactions }: ImpactLeaderboardProps) {
  const [timeframe, setTimeframe] = useState<"weekly" | "all-time">("all-time");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<{ title: string, icon: any, desc: string } | null>(null);

  const getAggregatedSupporters = () => {
    const groups: Record<string, { name: string; amount: number; points: number; city: string; avatar: string; isLive: boolean; lastDonated: string; status: string }> = {};

    dbTransactions.forEach(tx => {
      let name = tx.donorNameOverride || "متبرع فاعل خير";
      if (tx.donorId && user && tx.donorId === user.id) {
        name = user.fullName;
      }

      const isAnonymous = name === "متبرع فاعل خير";
      const key = isAnonymous ? `anon-${tx.id}` : name;

      const pointsForDonation = Math.floor(tx.amount / 10);

      if (groups[key]) {
        groups[key].amount += tx.amount;
        groups[key].points += pointsForDonation;
        if (tx.createdAt > groups[key].lastDonated) {
          groups[key].lastDonated = tx.createdAt;
        }
      } else {
        groups[key] = {
          name,
          amount: tx.amount,
          points: pointsForDonation,
          city: user && tx.donorId === user.id ? user.municipality || "ميداني" : "ميداني",
          avatar: user && tx.donorId === user.id ? "🌟" : "👤",
          isLive: true,
          lastDonated: tx.createdAt,
          status: pointsForDonation > 500 ? "داعم كبير" : "فاعل خير نشط"
        };
      }
    });

    const liveSupporters = Object.values(groups);
    const merged = [...liveSupporters];
    const baseSeeded = timeframe === "all-time" ? SEEDED_SUPPORTERS : SEEDED_SUPPORTERS_WEEKLY;

    baseSeeded.forEach(seed => {
      const existing = merged.find(m => m.name === seed.name);
      if (existing) {
        existing.amount += seed.amount;
        existing.points += seed.points;
      } else {
        merged.push({
          name: seed.name,
          amount: seed.amount,
          points: seed.points,
          city: seed.city,
          avatar: seed.avatar,
          isLive: false,
          lastDonated: "",
          status: seed.status
        });
      }
    });

    if (user && timeframe === "all-time") {
      const hasUser = merged.some(m => m.name === user.fullName);
      if (!hasUser && user.gamificationPoints > 0) {
        merged.push({
          name: user.fullName,
          amount: user.gamificationPoints * 10,
          points: user.gamificationPoints,
          city: user.municipality || "صبراتة",
          avatar: "🌟",
          isLive: true,
          lastDonated: "",
          status: "داعم وطني"
        });
      }
    }

    return merged.sort((a, b) => b.amount - a.amount);
  };

  const handleShareBadge = (badgeTitle: string, badgeDesc: string, Icon: any) => {
    setSelectedBadge({ title: badgeTitle, desc: badgeDesc, icon: Icon });
    setShowShareModal(true);
  };

  return (
    <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm space-y-4 text-right">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Trophy className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-black text-gray-900">لوحة الشرف التأثيرية: كبار الداعمين</h3>
            <p className="text-[10px] text-gray-400">الرواد والشركات الأكثر تأثيراً بنقاط الجدارة</p>
          </div>
        </div>
        <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
          مباشر
        </span>
      </div>

      {user && (
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => handleShareBadge("سند المنزل", "وفرت مسكناً وسنداً لعائلة محتاجة.", Shield)}
              className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <Shield className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-[9px] font-bold text-slate-700">سند المنزل</span>
              <Share2 className="w-3 h-3 text-slate-400 mt-1" />
            </button>
            <button 
              onClick={() => handleShareBadge("مُعمر الأرض", "ساهمت في مشاريع البنية التحتية والمياه.", Award)}
              className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <Award className="w-5 h-5 text-purple-600 mb-1" />
              <span className="text-[9px] font-bold text-slate-700">مُعمر الأرض</span>
              <Share2 className="w-3 h-3 text-slate-400 mt-1" />
            </button>
          </div>
          <div className="text-left space-y-1">
             <div className="text-[10px] font-bold text-slate-500">نقاطك الحالية</div>
             <div className="text-lg font-black text-emerald-700 font-mono">{user.gamificationPoints}</div>
          </div>
        </div>
      )}

      {/* Timeframe Toggles */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setTimeframe("all-time")}
          className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
            timeframe === "all-time"
              ? "bg-white shadow-xs text-slate-900 font-extrabold font-sans border border-slate-200"
              : "text-gray-400 hover:text-slate-600 font-sans"
          }`}
        >
          كل الأوقات
        </button>
        <button
          type="button"
          onClick={() => setTimeframe("weekly")}
          className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
            timeframe === "weekly"
              ? "bg-white shadow-xs text-slate-900 font-extrabold font-sans border border-slate-200"
              : "text-gray-400 hover:text-slate-600 font-sans"
          }`}
        >
          الترتيب الأسبوعي
        </button>
      </div>

      {/* Leaderboard list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5 custom-scrollbar">
        {getAggregatedSupporters().slice(0, 5).map((supporter, idx) => {
          const isCurrentUser = user && supporter.name === user.fullName;
          const rank = idx + 1;
          let rankBadge = "";
          let rankColor = "text-gray-500 bg-slate-50";

          if (rank === 1) {
            rankBadge = "🏆";
            rankColor = "bg-amber-50 text-amber-700 border border-amber-200";
          } else if (rank === 2) {
            rankBadge = "🥈";
            rankColor = "bg-slate-100 text-slate-700 border border-slate-200";
          } else if (rank === 3) {
            rankBadge = "🥉";
            rankColor = "bg-orange-50 text-orange-700 border border-orange-100";
          }

          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
                isCurrentUser
                  ? "bg-emerald-50/70 border-emerald-300"
                  : "bg-white border-slate-100 hover:border-[#E5E3DA]"
              }`}
            >
              <div className="text-left font-mono space-y-0.5">
                <span className="text-[11px] font-black text-emerald-700 block">
                  {supporter.amount.toLocaleString()} د.ل
                </span>
                <span className="text-[9px] text-gray-500 block font-sans bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {supporter.points.toLocaleString()} نقطة
                </span>
              </div>

              <div className="flex items-center gap-2 flex-row-reverse text-right">
                <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black ${rankColor}`}>
                  {rankBadge || rank}
                </span>

                <span className="text-base p-1 bg-slate-50 rounded-md select-none">{supporter.avatar}</span>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 flex-row-reverse">
                    <span className={`text-[10px] font-bold ${isCurrentUser ? "text-emerald-900" : "text-gray-800"}`}>
                      {supporter.name}
                    </span>
                    {isCurrentUser && (
                      <span className="bg-emerald-500 text-white text-[8px] px-1 rounded font-bold animate-pulse">
                        أنت
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-row-reverse text-[9px] text-gray-400 font-medium">
                    <span>📍 {supporter.city}</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">{supporter.status || "فاعل خير"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center space-y-1">
        <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
          {user 
            ? "كل تبرع يمنحك نقاط جدارة، يمكنك تحويلها لأوسمة فخرية لمشاركتها."
            : "سجل دخولك لتوثيق مساهماتك التراكمية في لوحة الشرف الوطنية."}
        </p>
        <div className="flex items-center justify-center gap-1 text-[9px] text-[#0F6E56] font-bold font-mono">
          <Heart className="w-3 h-3 fill-rose-500 stroke-none animate-pulse" />
          <span>التكافل قوة للمجتمع</span>
        </div>
      </div>

      {showShareModal && selectedBadge && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden text-right border border-slate-200" dir="rtl">
            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative">
                 <selectedBadge.icon className="w-10 h-10 text-emerald-600" />
                 <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full p-1 shadow-sm">
                   <Sparkles className="w-3 h-3" />
                 </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{selectedBadge.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedBadge.desc}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                 <p className="text-[10px] font-bold text-slate-600">شارك وسامك لتعزيز التكافل:</p>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`لقد حصلت على وسام "${selectedBadge.title}" لمساهمتي في دعم التكافل المجتمعي! #تكافل #ليبيا`)}`, '_blank');
                        setShowShareModal(false);
                      }}
                      className="flex-1 bg-black text-white font-bold py-2 rounded-xl text-xs hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
                    >
                      X (Twitter)
                    </button>
                    <button 
                      onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                        setShowShareModal(false);
                      }}
                      className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl text-xs hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                    >
                      Facebook
                    </button>
                 </div>
              </div>
              
              <button 
                 onClick={() => setShowShareModal(false)}
                 className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                 إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
