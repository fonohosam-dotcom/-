import React, { useState } from "react";
import { User } from "../types";
import { customFetch } from "../utils/api";

export default function ProfileModal({ 
  user, 
  sessionToken,
  onClose,
  onUserUpdate
}: { 
  user: User, 
  sessionToken: string | null,
  onClose: () => void,
  onUserUpdate: (user: User) => void
}) {
  const [isAnonymous, setIsAnonymous] = useState(user.isAnonymous || false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await customFetch("/api/auth/update-profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ isAnonymous })
      });
      const data = await res.json();
      if (data.status === "success") {
        onUserUpdate(data.user);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
        <h3 className="text-lg font-black text-slate-800 mb-2">إعدادات الهوية الرقمية</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          تحكم في كيفية ظهور اسمك في السجلات العامة وسجل المتبرعين.
        </p>

        <label className="flex items-start gap-3 p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors mb-6">
          <div className="mt-0.5">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
            />
          </div>
          <div>
            <span className="block font-black text-emerald-800 text-sm">
              الوضع المخفي (فاعل خير)
            </span>
            <span className="block text-[10px] text-emerald-600/80 mt-1 leading-snug">
              سيتم إخفاء اسمك الحقيقي في كافة قوائم التبرع والنشاطات.
            </span>
          </div>
        </label>

        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all"
          >
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
          <button
            onClick={onClose}
            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
