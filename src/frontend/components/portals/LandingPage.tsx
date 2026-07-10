import React from 'react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-400">
          المنصة الوطنية للتكافل الاجتماعي
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          نظام ذكي وشامل يعزز الشفافية ويربط بين المحتاجين والمتبرعين والجهات المختصة لبناء مجتمع متكافل عبر تقنيات الذكاء الاصطناعي وبنية تحتية قوية.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-12">
        <StatsCard value="12,450+" label="حالة معالجة" />
        <StatsCard value="4.2M" label="إجمالي التبرعات (د.ل)" />
        <StatsCard value="18" label="بلدية مدعومة" />
        <StatsCard value="100%" label="شفافية مالية" />
      </div>
    </div>
  );
}

function StatsCard({ value, label }: { value: string, label: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</div>
    </div>
  );
}
