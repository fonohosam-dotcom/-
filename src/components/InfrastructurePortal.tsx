import React, { useState } from "react";
import { MajorProject, User } from "../types";
import { Building2, Coins, School, Landmark, Activity, Compass, ArrowLeft, Send, CheckCircle, TrendingUp, Sparkles, Edit3, Trash2, X, Save } from "lucide-react";
import { customFetch } from "../utils/api";
import { motion } from "motion/react";

const fetch = customFetch;

import { useNavigate, useParams } from "react-router-dom";
interface InfrastructurePortalProps {
  view?: "list" | "new" | "details";
  user: User | null;
  projects: MajorProject[];
  onDonateToProject?: (projId: string, amount: number) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onUpdateProject?: (projectId: string, updatedFields: any) => Promise<void>;
}

export default function InfrastructurePortal({
  user,
  projects,
  onDonateToProject,
  onRefreshData,
  onDeleteProject,
  onUpdateProject,
  view = "list",
}: InfrastructurePortalProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "school" | "hospital" | "mosque" | "well" | "orphan_care" | "housing">("all");
  const navigate = useNavigate();
  const showAddForm = view === "new";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState(150000);
  const [category, setCategory] = useState<"school" | "hospital" | "mosque" | "well" | "orphan_care" | "housing">("school");
  const [municipality, setMunicipality] = useState("صبراتة");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Edit Mode States
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState(150000);
  const [editCategory, setEditCategory] = useState<"school" | "hospital" | "mosque" | "well" | "orphan_care" | "housing">("school");
  const [editMunicipality, setEditMunicipality] = useState("صبراتة");

  const filteredProjects = selectedCategory === "all" 
    ? projects 
    : projects.filter(p => p.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert("الرجاء تعبئة الاسم ووصف المشروع البنيوي");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          description,
          targetAmount: Number(targetAmount),
          municipality,
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setSuccessMsg("تم تسجيل المقترح التنموي الوطني بنجاح وبث التنبيه الموحد للمانحين!");
        setTitle("");
        setDescription("");
        setTargetAmount(150000);
        if (onRefreshData) {
          await onRefreshData();
        }
        setTimeout(() => {
          setSuccessMsg("");
          navigate("/infrastructure");
        }, 3000);
      } else {
        alert("حدث خطأ أثناء حفظ المشروع بالملفات الرقابية.");
      }
    } catch (err) {
      console.error(err);
      alert("فشل الاتصال بخادم حوكمة المشاريع.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (cat: string) => {
    switch (cat) {
      case "school": return <School className="w-5 h-5 text-indigo-600" />;
      case "hospital": return <Activity className="w-5 h-5 text-rose-600" />;
      case "mosque": return <Landmark className="w-5 h-5 text-emerald-600" />;
      case "well": return <Compass className="w-5 h-5 text-sky-600" />;
      default: return <Building2 className="w-5 h-5 text-amber-600" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "school": return "مدرسة تعليمية";
      case "hospital": return "مستشفى طبي";
      case "mosque": return "مسجد عتيق";
      case "well": return "بئر مياه";
      case "orphan_care": return "رعاية أيتام";
      case "housing": return "مسكن عائلي";
      default: return "مرفق عام";
    }
  };

  const startEditingProject = (p: MajorProject) => {
    setEditingProjectId(p.id);
    setEditTitle(p.title);
    setEditDesc(p.description);
    setEditTargetAmount(p.targetAmount);
    setEditCategory(p.category);
    setEditMunicipality(p.municipality);
  };

  const handleSaveEditProject = async (projectId: string) => {
    if (onUpdateProject) {
      await onUpdateProject(projectId, {
        title: editTitle,
        description: editDesc,
        targetAmount: Number(editTargetAmount),
        category: editCategory,
        municipality: editMunicipality
      });
      setEditingProjectId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Header Panel with high fidelity look */}
      <div className="bg-[#0D1B2A] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-indigo-500/10">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/30 via-[#0D1B2A] to-[#0D1B2A] -z-10"></div>
        <div className="space-y-1.5 flex-1">
          <span className="bg-indigo-950 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">
            البنية التحتية والمنشآت العمومية الموحدة
          </span>
          <h2 className="text-2xl font-black flex items-center gap-2 flex-row-reverse justify-end mt-1 text-gray-50">
            <span>🏫</span>
            بوابة المدارس والمساجد والآبار والمشاريع التنموية
          </h2>
          <p className="text-xs text-indigo-100/70 leading-relaxed max-w-2xl">
            إعمار وتجهيز المرافق الصحية والتعليمية والمساجد وحفر آبار الإمداد المائي ببلديات ليبيا. نقوم بدراسة الاحتياج وإدراج المشاريع ومراقبة تبرعات التجهيز بمطابقة 100%.
          </p>
        </div>
        <button
          onClick={() => navigate(showAddForm ? "/infrastructure" : "/infrastructure/new")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border border-indigo-500/20"
        >
          <span>➕</span>
          <span>إضافة مسجد / بئر / مشروع تنموي</span>
        </button>
      </div>

      {/* Dynamic Creation Form */}
      {showAddForm && (
        <div className="bg-white border border-[#E5E3DA] rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-3 border-indigo-50">
            <h3 className="font-black text-indigo-950 text-sm">تسجيل مقترح منشأة تنموية جديدة بليبيا</h3>
            <button 
              onClick={() => navigate("/infrastructure")} 
              className="text-xs text-gray-400 hover:text-rose-600 font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>

          {successMsg ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold text-center">
              ✓ {successMsg}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-gray-700">عنوان المشروع / المنشأة المقترحة*</label>
                  <input
                    type="text"
                    placeholder="مثال: مسجد الفرقان الكبير أو حفر بئر التضامن العميق"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-gray-700">نوع وتخصيص المنشأة*</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right font-bold text-indigo-950"
                  >
                    <option value="school">مدرسة تعليمية أساسية / ثانوية</option>
                    <option value="hospital">مستشفى عام / قسم طوارئ تخصصي</option>
                    <option value="mosque">مسجد / مركز تحفيظ وعلوم شرعية</option>
                    <option value="well">بئر مياه عميق لبلدية عطشى</option>
                    <option value="orphan_care">دار رعاية أيتام ونقاهة أسرية</option>
                    <option value="housing">ترميم مجمع سكني عائلي متهالك</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-gray-700">الميزانية والتمويل الكلي المطلوب (دينار)*</label>
                  <input
                    type="number"
                    step={1000}
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right font-bold font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-gray-700">البلدية والمنطقة الجغرافية*</label>
                  <select
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-right font-bold text-gray-700"
                  >
                    <option value="صبراتة">صبراتة</option>
                    <option value="طرابلس">طرابلس</option>
                    <option value="بنغازي">بنغازي</option>
                    <option value="الزاوية">الزاوية</option>
                    <option value="الجميل">الجميل</option>
                    <option value="سبها">سبها</option>
                    <option value="مصراتة">مصراتة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">وصف دقيق للمشروع وأهمية التدخل الإعماري*</label>
                <textarea
                  placeholder="اكتب هنا شرحاً للمشروع، المواصفات والخدمة التي سيقدمها لأهالي المحلة بصفة تفصيلية..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-right leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/infrastructure")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <span>بث وإدراج المشروع الوطني</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Categories Navigator */}
      <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 flex flex-wrap gap-2 justify-start flex-row-reverse">
        {[
          { code: "all", label: "الكل 📁" },
          { code: "school", label: "مدارس 🏫" },
          { code: "hospital", label: "مستشفيات 🏥" },
          { code: "mosque", label: "مساجد 🕌" },
          { code: "well", label: "آبار مياه 💧" },
          { code: "orphan_care", label: "أيتام 🧒" },
          { code: "housing", label: "ترميم مساكن 🏠" }
        ].map((c) => {
          const isSelected = selectedCategory === c.code;
          return (
            <button
              key={c.code}
              onClick={() => setSelectedCategory(c.code as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-800/15" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Infrastructure Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E5E3DA] rounded-3xl p-16 text-center text-gray-400 text-xs font-bold">
            لا توجد مشاريع مسجلة حالياً ضمن هذه الفئة المعينة.
          </div>
        ) : (
          filteredProjects.map((p) => {
            const percent = Math.min(100, Math.floor((p.collectedAmount / p.targetAmount) * 100));
            const isEditing = editingProjectId === p.id;

            return (
              <div 
                key={p.id} 
                className="bg-white border border-[#E5E3DA] hover:border-indigo-600/30 transition-all rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md relative overflow-hidden"
              >
                {/* Badge Category */}
                <div className="flex items-center justify-between border-b pb-2 mb-1">
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-extrabold">
                    بلدية {p.municipality}
                  </span>
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    <span className="text-[10px] font-bold text-gray-500">{getCategoryLabel(p.category)}</span>
                    {getIcon(p.category)}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right animate-fade-in">
                    <h5 className="text-xs font-bold text-indigo-900">تخصيص وتعديل بيانات المشروع</h5>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">اسم المشروع / المنشأة</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs text-right font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">شرح وتفاصيل المشروع</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs text-right"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-right">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block">الميزانية المطلوبة (LYD)</label>
                        <input
                          type="number"
                          value={editTargetAmount}
                          onChange={(e) => setEditTargetAmount(Number(e.target.value))}
                          className="w-full border border-slate-200 bg-white rounded-lg p-1.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block">البلدية</label>
                        <select
                          value={editMunicipality}
                          onChange={(e) => setEditMunicipality(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded-lg p-1.5 text-xs text-right font-bold"
                        >
                          <option value="صبراتة">صبراتة</option>
                          <option value="طرابلس">طرابلس</option>
                          <option value="بنغازي">بنغازي</option>
                          <option value="الزاوية">الزاوية</option>
                          <option value="الجميل">الجميل</option>
                          <option value="سبها">سبها</option>
                          <option value="مصراتة">مصراتة</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-2">
                      <button
                        onClick={() => setEditingProjectId(null)}
                        className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleSaveEditProject(p.id)}
                        className="px-2.5 py-1 rounded bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>حفظ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Info */}
                    <div className="space-y-1.5 text-right">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{p.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
                        {p.description}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                          percent >= 100
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : percent >= 75
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        }`}>
                          {percent >= 100 ? "مكتمل التمويل 🎉" : percent >= 75 ? "قريب من الهدف ✨" : "نشط لتلقي الدعم ⏳"}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-[11px]">معدل التجهيز التضامني:</span>
                          <span className="text-indigo-600 font-extrabold font-mono text-sm">{percent}%</span>
                        </div>
                      </div>

                      {/* Bar Track */}
                      <div className="w-full bg-slate-200/70 h-3 rounded-full overflow-hidden shadow-inner relative">
                        <motion.div 
                          className="bg-gradient-to-l from-emerald-500 via-teal-500 to-indigo-600 h-full rounded-full shadow-lg" 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </div>

                      {/* Amounts Display */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-100/80 pt-2">
                        <div className="text-right">
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">ما تم جمعه</span>
                          <span className="font-extrabold text-emerald-700 text-[12px]">{p.collectedAmount.toLocaleString('ar-LY')} د.ل</span>
                        </div>
                        <div className="text-left" dir="ltr">
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider text-right">القيمة المستهدفة</span>
                          <span className="font-extrabold text-slate-700 text-[12px]">{p.targetAmount.toLocaleString('ar-LY')} د.ل</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons including Edit, Delete, Donate */}
                    <div className="pt-3 border-t border-slate-50 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          const donationAmount = prompt("أدخل قيمة المساهمة بالدينار الليبي لدعم تجهيز هذا المشروع:", "500");
                          if (donationAmount && Number(donationAmount) > 0) {
                            if (onDonateToProject) {
                              onDonateToProject(p.id, Number(donationAmount));
                            } else {
                              alert("يرجى استخدام بوابات الدفع للتبرع الفعلي.");
                            }
                          }
                        }}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-extrabold rounded-xl transition-colors cursor-pointer text-center"
                      >
                        <Coins className="w-3 h-3 inline ml-1" /> ساهم بدعم التجهيز الآن
                      </button>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingProject(p)}
                            className="p-1 text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                            title="تعديل وتخصيص المشروع"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تخصيص</span>
                          </button>
                          {onDeleteProject && (
                            <button
                              onClick={async () => {
                                if (confirm("هل أنت متأكد من حذف هذا المشروع التنموي نهائياً؟")) {
                                  await onDeleteProject(p.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="حذف المشروع"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">المطابقة الرقابية ✓</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
