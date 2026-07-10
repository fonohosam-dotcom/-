import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSubmitEvaluation } from '../../hooks/useApi';
import { ClipboardCheck, Loader2 } from 'lucide-react';

const evaluationSchema = z.object({
  caseNumber: z.string().min(1, "رقم الحالة مطلوب"),
  needScore: z.coerce.number().min(1).max(100, "التقييم يجب أن يكون بين 1 و 100"),
  priorityLevel: z.enum(['عادي', 'متوسط', 'عاجل', 'حرج']),
  fieldNotes: z.string().min(10, "يجب إدخال ملاحظات ميدانية تفصيلية (10 أحرف كحد أدنى)"),
});

type EvaluationForm = z.infer<typeof evaluationSchema>;

export default function ResearcherPortal() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EvaluationForm>({
    resolver: zodResolver(evaluationSchema),
  });
  
  const mutation = useSubmitEvaluation();

  const onSubmit = (data: EvaluationForm) => {
    mutation.mutate(data, {
      onSuccess: () => reset()
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ClipboardCheck className="text-emerald-500" />
          بوابة الباحث الميداني
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          إدخال التقييمات الميدانية بدقة وشفافية
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-2xl">
        <h2 className="text-lg font-semibold mb-6">نموذج تقييم حالة</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">رقم الحالة</label>
            <input 
              {...register('caseNumber')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-emerald-500 transition-colors"
              placeholder="مثال: CAS-2026-001"
            />
            {errors.caseNumber && <p className="text-red-500 text-xs mt-1">{errors.caseNumber.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">درجة الاحتياج (1-100)</label>
              <input 
                type="number"
                {...register('needScore')}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.needScore && <p className="text-red-500 text-xs mt-1">{errors.needScore.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">مستوى الأولوية</label>
              <select 
                {...register('priorityLevel')}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="عادي">عادي</option>
                <option value="متوسط">متوسط</option>
                <option value="عاجل">عاجل</option>
                <option value="حرج">حرج</option>
              </select>
              {errors.priorityLevel && <p className="text-red-500 text-xs mt-1">{errors.priorityLevel.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الملاحظات الميدانية</label>
            <textarea 
              {...register('fieldNotes')}
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-emerald-500 transition-colors resize-none"
              placeholder="وصف تفصيلي لحالة المسكن والاحتياجات..."
            />
            {errors.fieldNotes && <p className="text-red-500 text-xs mt-1">{errors.fieldNotes.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'اعتماد التقييم'}
          </button>
          
          {mutation.isSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm text-center">
              تم إرسال التقييم بنجاح وتحديث السجل.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
