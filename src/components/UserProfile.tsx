import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Case, MajorProject, Fund } from "../types";
import { customFetch } from "../utils/api";
import { ArrowLeft, User as UserIcon, ShieldAlert, Award, FileText, MapPin, Briefcase } from "lucide-react";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/users");
        const d = await res.json();
        const data = d.data || d;
        const found = data.find((u: User) => u.id === id);
        if (found) {
          setUserProfile(found);
        } else {
          setError("المستخدم غير موجود");
        }
      } catch (e) {
        setError("فشل في جلب بيانات المستخدم");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="p-8 text-center animate-pulse">جاري تحميل بيانات المستخدم...</div>;
  if (error || !userProfile) return <div className="p-8 text-center text-rose-500 font-bold">{error || "المستخدم غير موجود"}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-right">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold text-xs">
          <ArrowLeft className="w-4 h-4" /> عودة
        </button>
        <h2 className="text-2xl font-black text-slate-900">الملف الشخصي الشامل</h2>
      </div>

      <div className="bg-white border border-[#E5E3DA] rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-100 pb-8">
          <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
            <UserIcon className="w-12 h-12 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            {userProfile.isBanned && (
              <div className="absolute bottom-0 w-full bg-rose-500 text-white text-[10px] font-bold text-center py-1">محظور</div>
            )}
            {userProfile.isHidden && (
              <div className="absolute bottom-0 w-full bg-slate-800 text-white text-[10px] font-bold text-center py-1">مخفي</div>
            )}
          </div>
          
          <div className="flex-1 space-y-3 text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center justify-end gap-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-100">
                {userProfile.role}
              </span>
              <h1 className="text-3xl font-black text-slate-900">{userProfile.fullName}</h1>
            </div>
            
            <p className="text-slate-500 font-mono">{userProfile.email} {userProfile.phone && `| ${userProfile.phone}`}</p>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-2 pt-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-500" />
                {userProfile.municipality || "غير محدد"}
              </span>
              {userProfile.nationalId && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  رقم وطني: {userProfile.nationalId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">النقاط والموثوقية</h4>
            <p className="text-2xl font-black text-emerald-700 font-mono">{userProfile.gamificationPoints || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl border border-blue-100 text-center space-y-2">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">التفاعلات والنشاط</h4>
            <p className="text-2xl font-black text-blue-700 font-mono">{userProfile.role === 'donor' ? 'التبرعات' : 'سجلات النشاط'}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 rounded-2xl border border-purple-100 text-center space-y-2">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">حالة الحساب</h4>
            <p className="text-sm font-black text-purple-700 mt-2">
              {userProfile.isBanned ? "الحساب محظور حالياً" : userProfile.isHidden ? "الحساب مخفي استثنائياً" : "حساب نشط ومعتمد"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
