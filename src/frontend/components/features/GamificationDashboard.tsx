import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { ShieldCheck, Star, Zap, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../stores/useStore';

export default function GamificationDashboard() {
  const user = useAppStore(state => state.user);
  
  // Fetch user impact stats
  const { data: impactStats, isLoading } = useQuery({
    queryKey: ['impact-stats', user?.id],
    queryFn: async () => {
      // In a real app, this would hit /api/users/:id/impact
      // Simulating response for demonstration
      return {
        points: 450,
        level: 'سفير العطاء',
        rank: 12,
        badges: [
          { id: 1, name: 'مبادر سريع', icon: <Zap size={24} className="text-amber-500" />, desc: 'ساهم في حالات الطوارئ خلال 24 ساعة' },
          { id: 2, name: 'داعم مستدام', icon: <ShieldCheck size={24} className="text-emerald-500" />, desc: 'ساهم بشكل شهري منتظم' },
          { id: 3, name: 'أثر واسع', icon: <Star size={24} className="text-blue-500" />, desc: 'دعم أكثر من 10 حالات مختلفة' }
        ]
      };
    },
    enabled: !!user // Only fetch if logged in, but we might just show mock if null for preview
  });

  const stats = impactStats || { points: 0, level: 'فاعل خير مبتدئ', rank: '-', badges: [] };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" />
            الأثر الإنساني
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تتبع حجم تأثيرك المجتمعي والخيري</p>
        </div>
        <div className="text-left">
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.points}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">نقطة أثر</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">المستوى الإنساني</div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{stats.level}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">الترتيب المجتمعي</div>
          <div className="font-bold text-slate-900 dark:text-slate-100">#{stats.rank}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">شارات التأثير (Badges)</h3>
        {isLoading ? (
          <div className="flex gap-4">
            {[1, 2, 3].map(i => <div key={i} className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.badges.map((badge: any) => (
              <div key={badge.id} className="flex flex-col items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center">
                <div className="mb-3 p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                  {badge.icon}
                </div>
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{badge.name}</div>
                <div className="text-xs text-slate-500 mt-1">{badge.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
