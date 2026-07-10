import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function MedicalPortal() {
  const { data: medicalCases, isLoading, isError } = useQuery({
    queryKey: ['medical-cases'],
    queryFn: () => apiFetch('/cases').then(res => (res.cases || []).filter((c: any) => c.needTypes.includes('علاج') || c.needTypes.includes('أجهزة طبية')))
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Stethoscope className="text-blue-500" />
            البوابة الطبية
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            منطقة عالية الأمان - للكوادر الطبية المعتمدة فقط
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">الحالات الطبية المفتوحة</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-pulse">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
             <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl text-center">
               حدث خطأ أثناء جلب البيانات الطبية.
             </div>
          ) : medicalCases?.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
              لا توجد حالات طبية نشطة حالياً.
            </div>
          ) : (
            <div className="space-y-4">
              {medicalCases?.map((c: any) => (
                <div key={c.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{c.caseNumber}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{c.description}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      تقييم الاحتياج: {c.needScore}%
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors">
                    <FileText size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">رفع تقرير طبي</h2>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer group">
              <Upload className="mx-auto text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" size={32} />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">اختر ملفاً أو اسحبه هنا</p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPG (حد أقصى 10MB)</p>
            </div>
            <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md">
              اعتماد الرفع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
