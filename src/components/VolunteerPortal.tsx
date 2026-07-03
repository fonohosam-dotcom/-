import React, { useState } from "react";
import { Case, User } from "../types";
import { customFetch } from "../utils/api";
import { Camera, CheckCircle, Package } from "lucide-react";

interface VolunteerPortalProps {
  user: User;
  cases: Case[];
}

export default function VolunteerPortal({ user, cases }: VolunteerPortalProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "history">("tasks");
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [confirmingCaseId, setConfirmingCaseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Funded cases need delivery
  const pendingTasks = cases.filter(c => c.status === "funded" && !c.deliveryConfirmedAt);
  const completedTasks = cases.filter(c => c.status === "closed" && c.assignedVolunteerId === user.id);

  const handleSimulateCamera = () => {
    // Simulate taking a bio verification photo for delivery
    setDeliveryPhoto("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/...");
  };

  const handleConfirmDelivery = async (caseId: string) => {
    if (!deliveryPhoto) return;
    setIsSubmitting(true);
    try {
      const res = await customFetch(`/api/cases/${caseId}/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteerId: user.id,
          bioVerification: {
            type: "camera",
            data: deliveryPhoto,
            verifiedAt: new Date().toISOString()
          }
        })
      });
      if (res.ok) {
        setConfirmingCaseId(null);
        setDeliveryPhoto(null);
        // Page reload or state update would handle the rest, but we assume parent polling
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="bg-white border border-[#E5E3DA] p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-2">لوحة المتطوع الميداني</h2>
        <p className="text-slate-600 text-sm">مرحباً {user.fullName}، يمكنك استلام مهام التوصيل وإثبات التسليم للجهات المستفيدة.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "tasks" ? "bg-slate-950 text-white" : "text-slate-600 bg-white border border-slate-200"
          }`}
        >
          المهام الحالية ({pendingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "history" ? "bg-slate-950 text-white" : "text-slate-600 bg-white border border-slate-200"
          }`}
        >
          سجل التسليم
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "tasks" && pendingTasks.map(c => (
          <div key={c.id} className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-md">بانتظار التسليم</span>
              <div>
                <h3 className="font-bold text-lg">{c.caseNumber}</h3>
                <p className="text-xs text-slate-500">{c.municipality}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">{c.description}</p>
            
            {confirmingCaseId === c.id ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-sm text-slate-800">إثبات التسليم (Bio-Verification)</h4>
                {!deliveryPhoto ? (
                  <button onClick={handleSimulateCamera} className="w-full py-3 rounded-xl border border-dashed border-slate-400 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100">
                    <Camera className="w-5 h-5" />
                    التقاط صورة الاستلام
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      تم التقاط الصورة بنجاح
                    </div>
                    <button 
                      onClick={() => handleConfirmDelivery(c.id)}
                      disabled={isSubmitting}
                      className="w-full bg-slate-950 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                      {isSubmitting ? "جاري التأكيد..." : "تأكيد وإغلاق الحالة"}
                    </button>
                  </div>
                )}
                <button onClick={() => setConfirmingCaseId(null)} className="w-full py-2 text-slate-500 text-sm hover:underline">إلغاء</button>
              </div>
            ) : (
              <button 
                onClick={() => setConfirmingCaseId(c.id)}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all"
              >
                <Package className="w-5 h-5" />
                تأكيد تسليم المساعدة
              </button>
            )}
          </div>
        ))}
        {activeTab === "tasks" && pendingTasks.length === 0 && (
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500">لا توجد مهام تسليم حالية.</div>
        )}

        {activeTab === "history" && completedTasks.map(c => (
          <div key={c.id} className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm space-y-2 opacity-70">
            <div className="flex justify-between items-start">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">تم التسليم في {c.deliveryConfirmedAt ? new Date(c.deliveryConfirmedAt).toLocaleDateString("ar-LY") : ""}</span>
              <h3 className="font-bold text-lg">{c.caseNumber}</h3>
            </div>
            <p className="text-sm text-slate-700">{c.description}</p>
          </div>
        ))}
        {activeTab === "history" && completedTasks.length === 0 && (
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500">سجل التسليم فارغ.</div>
        )}
      </div>
    </div>
  );
}
