import React from 'react';
import { useLedger } from '../../hooks/useApi';
import { ShieldCheck, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function LedgerPortal() {
  const { data: ledger, isLoading, isError, refetch } = useLedger();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" />
            مركز الشفافية والسجل المالي المفتوح
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            سجل مالي غير قابل للتعديل (Immutable Ledger) لضمان أعلى معايير النزاهة.
          </p>
        </div>
        <button 
          onClick={() => refetch()}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          <span className="hidden sm:inline text-sm font-medium">تحديث السجل</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">رقم العملية / التاريخ</th>
                <th className="px-6 py-4 font-semibold">البيان</th>
                <th className="px-6 py-4 font-semibold">الحساب المدين</th>
                <th className="px-6 py-4 font-semibold">الحساب الدائن</th>
                <th className="px-6 py-4 font-semibold">القيمة (د.ل)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">حدث خطأ أثناء تحميل السجل.</td>
                </tr>
              ) : ledger?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد عمليات مسجلة حتى الآن.</td>
                </tr>
              ) : (
                ledger?.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-500 mb-1">{entry.id}</div>
                      <div className="text-slate-900 dark:text-slate-300">{new Date(entry.entryDate).toLocaleDateString('ar-LY')}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{entry.description}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <ArrowDownRight size={14} />
                        {entry.debitAccount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight size={14} />
                        {entry.creditAccount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {entry.amount.toLocaleString()} د.ل
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
