import React from 'react';
import { PlusCircle, FileText, Clock } from 'lucide-react';

export default function CitizenPortal() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">بوابة المواطن</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">إدارة الطلبات والبيانات الشخصية وتقديم الالتماسات</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PortalCard 
          title="تقديم طلب جديد" 
          description="يمكنك تقديم طلب مساعدة مالية، صحية، أو سكنية مع إرفاق المستندات المطلوبة."
          icon={<PlusCircle className="text-emerald-500 mb-4" size={32} />}
          buttonText="بدء طلب جديد"
          primary
        />
        <PortalCard 
          title="طلباتي الحالية" 
          description="متابعة حالة الطلبات قيد الإجراء ومراجعة ملاحظات الباحثين الاجتماعيين."
          icon={<Clock className="text-blue-500 mb-4" size={32} />}
          buttonText="عرض الطلبات"
        />
        <PortalCard 
          title="سجل التدخلات" 
          description="الاطلاع على الأرشيف الخاص بالدعم والمساعدات السابقة التي تم تقديمها لك."
          icon={<FileText className="text-purple-500 mb-4" size={32} />}
          buttonText="تصفح السجل"
        />
      </div>
    </div>
  );
}

function PortalCard({ title, description, icon, buttonText, primary = false }: any) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm flex flex-col h-full
      ${primary ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800'}`}>
      {icon}
      <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-grow leading-relaxed">{description}</p>
      <button className={`w-full font-medium py-2.5 px-4 rounded-xl transition-all ${
        primary 
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg' 
          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
      }`}>
        {buttonText}
      </button>
    </div>
  );
}
