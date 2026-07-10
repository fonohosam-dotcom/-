import React from 'react';
import { Heart, Globe, PieChart } from 'lucide-react';
import GamificationDashboard from '../features/GamificationDashboard';
import { useCases } from '../../hooks/useApi';

export default function DonorPortal() {
  const { data: cases, isLoading } = useCases();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">بوابة المتبرع</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">المساهمة في دعم المشاريع التنموية والحالات الإنسانية العاجلة</p>
        </div>
      </div>
      
      {/* Gamification / Impact Dashboard */}
      <GamificationDashboard />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <PortalCard 
          title="تبرع سريع" 
          description="المساهمة الفورية لدعم الحالات العاجلة أو صناديق الزكاة والصدقات العامة."
          icon={<Heart className="text-red-500 mb-4" size={32} />}
          buttonText="تبرع الآن"
          primary
        />
        <PortalCard 
          title="مشاريع الإعمار" 
          description="دعم مشاريع البنية التحتية والمبادرات التنموية الكبرى في البلديات المتضررة."
          icon={<Globe className="text-teal-500 mb-4" size={32} />}
          buttonText="استكشف المشاريع"
        />
        <PortalCard 
          title="أثري وتبرعاتي" 
          description="تتبع بشفافية كاملة أين ذهبت تبرعاتك وشاهد الأثر الحقيقي لمساهماتك."
          icon={<PieChart className="text-amber-500 mb-4" size={32} />}
          buttonText="عرض التقارير"
        />
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">حالات عاجلة في انتظار دعمك</h2>
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map(i => <div key={i} className="min-w-[300px] h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cases?.slice(0, 3).map((c: any) => (
              <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{c.caseNumber}</h3>
                  <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-1 rounded font-medium">{c.priorityLevel}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{c.description}</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(c.amountCollected / c.amountRequired) * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>تم جمع {c.amountCollected} د.ل</span>
                  <span>الهدف {c.amountRequired} د.ل</span>
                </div>
                <button className="w-full mt-5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white font-medium py-2 rounded-xl transition-colors">
                  دعم الحالة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PortalCard({ title, description, icon, buttonText, primary = false }: any) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm flex flex-col h-full
      ${primary ? 'border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
      {icon}
      <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-grow leading-relaxed">{description}</p>
      <button className={`w-full font-medium py-2.5 px-4 rounded-xl transition-all ${
        primary 
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30' 
          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
      }`}>
        {buttonText}
      </button>
    </div>
  );
}
