import React, { useState, useEffect } from "react";
import { User } from "../types";
import { customFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Users, Search, Filter, Shield, UserPlus, Eye, Trash2, Ban } from "lucide-react";

export default function UsersManagement({ currentUser }: { currentUser: User | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await customFetch("/api/users");
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.includes(searchTerm) || 
    u.email.includes(searchTerm) || 
    (u.role && u.role.includes(searchTerm))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2 w-full md:w-1/3">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="البحث بالاسم، البريد أو الدور..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="space-y-1 text-right md:text-left">
          <h2 className="text-2xl font-black text-slate-900 flex items-center justify-end gap-2">
            إدارة المستخدمين والصلاحيات
            <Users className="w-6 h-6 text-emerald-600" />
          </h2>
          <p className="text-sm text-slate-500 font-mono">السجل الوطني الموحد للمحتاجين والكوادر</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E3DA] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold animate-pulse">جاري تحميل السجل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-bold text-slate-600">الإجراءات</th>
                  <th className="p-4 font-bold text-slate-600">تاريخ الانضمام</th>
                  <th className="p-4 font-bold text-slate-600">الحالة</th>
                  <th className="p-4 font-bold text-slate-600">الدور والبلدية</th>
                  <th className="p-4 font-bold text-slate-600">الاسم والبيانات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <button 
                        onClick={() => navigate(`/users/${u.id}`)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 rounded-lg transition-colors font-bold text-xs flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> عرض الملف
                      </button>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      مستخدم مسجل
                    </td>
                    <td className="p-4">
                      {u.isBanned ? (
                         <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold flex items-center w-fit gap-1"><Ban className="w-3 h-3"/>محظور</span>
                      ) : u.isHidden ? (
                         <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">مخفي</span>
                      ) : (
                         <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">نشط</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold block w-fit">{u.role}</span>
                        <span className="text-xs text-slate-500 block">{u.municipality || "عام"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-slate-500">لا يوجد مستخدمين مطابقين للبحث</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
