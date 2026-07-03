import React, { useState, useEffect } from "react";
import { User } from "../types";
import { customFetch } from "../utils/api";
import { Settings, ShieldAlert, Trash2, EyeOff, Power, Check, X, ShieldBan } from "lucide-react";

export default function AdvancedAdmin({ users, onRefresh }: { users: User[], onRefresh: () => void }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    customFetch("/api/feature-flags").then(res => setFlags(res.flags || {}));
  }, []);

  const handleToggleFlag = async (key: string, value: boolean) => {
    const updated = { ...flags, [key]: value };
    setFlags(updated);
    await customFetch("/api/feature-flags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
    window.location.reload(); // Reload to apply new nav state globally
  };

  const handleUserAction = async (userId: string, action: string, value?: boolean) => {
    if (action === "delete") {
      if (!confirm("هل أنت متأكد من الحذف النهائي لهذا المستخدم؟ لا يمكن التراجع عن هذه الخطوة.")) return;
      await customFetch(`/api/users/${userId}`, { method: "DELETE" });
      onRefresh();
      return;
    }
    
    // Status updates
    const payload = action === "ban" ? { isBanned: value } : { isHidden: value };
    await customFetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    onRefresh();
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-black text-slate-900 flex items-center justify-end gap-2 border-b pb-4">
          إدارة إطلاق الأقسام والميزات (Feature Flags)
          <Power className="w-5 h-5 text-indigo-600" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "module_home", label: "قسم الرئيسية (Home)" },
            { key: "module_donation", label: "قسم التبرعات (Donations)" },
            { key: "module_verify", label: "مكافحة الاحتيال (Verify)" },
            { key: "module_reports", label: "التقارير والمؤشرات (Reports)" },
            { key: "module_map", label: "الخرائط والبحث (Map)" },
            { key: "module_projects", label: "المشاريع الكبرى (Projects)" }
          ].map(f => (
            <div key={f.key} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
              <button 
                onClick={() => handleToggleFlag(f.key, flags[f.key] === false ? true : false)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${flags[f.key] !== false ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute transition-transform ${flags[f.key] !== false ? "left-1" : "left-6"}`} />
              </button>
              <span className="text-xs font-bold text-slate-800">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-black text-rose-900 flex items-center justify-end gap-2 border-b pb-4 border-rose-100">
          لوحة الإدارة المتقدمة للمستخدمين (خطر)
          <ShieldAlert className="w-5 h-5 text-rose-600" />
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-y border-slate-100">
              <tr>
                <th className="p-3 font-bold text-slate-700">الإجراءات</th>
                <th className="p-3 font-bold text-slate-700">الحالة</th>
                <th className="p-3 font-bold text-slate-700">الدور الوظيفي</th>
                <th className="p-3 font-bold text-slate-700">المستخدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-3 flex items-center justify-end gap-2 flex-row-reverse">
                    <button 
                      onClick={() => handleUserAction(u.id, "delete")}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                      title="حذف نهائي"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleUserAction(u.id, "ban", !u.isBanned)}
                      className={`p-1.5 rounded-lg transition-colors ${u.isBanned ? "bg-amber-100 text-amber-700" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                      title={u.isBanned ? "إلغاء الحظر" : "حظر المستخدم"}
                    >
                      <ShieldBan className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleUserAction(u.id, "hide", !u.isHidden)}
                      className={`p-1.5 rounded-lg transition-colors ${u.isHidden ? "bg-blue-100 text-blue-700" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                      title={u.isHidden ? "إظهار" : "إخفاء الحساب من النظام"}
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="p-3">
                    {u.isBanned && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold mx-1">محظور</span>}
                    {u.isHidden && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold mx-1">مخفي</span>}
                    {!u.isBanned && !u.isHidden && <span className="text-emerald-600 font-bold">نشط</span>}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-600">{u.role}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{u.fullName}</p>
                    <p className="text-[10px] text-gray-400">{u.email}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
