import React, { useState, useEffect } from "react";
import { Case, MajorProject, OmniTransaction, LedgerEntry, Fund, User, CommunityReport, UserRole } from "../types";
import GISHeatmap from "./GISHeatmap";
import AdminCharts from "./AdminCharts";
import GoogleChatWidget from "./GoogleChatWidget";
import ProjectTimeline from "./ProjectTimeline";
import { Lock, Radio, Send, MapPin, AlertTriangle, History, ShieldAlert, Check, Navigation, Truck, UserCheck, Compass, Bell, Volume2, Clock, CheckCircle2 } from "lucide-react";
import AdvancedAdmin from "./AdvancedAdmin";
import { customFetch } from "../utils/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";

const fetch = customFetch;

interface AdminPortalProps {
  user: User;
  cases: Case[];
  projects: MajorProject[];
  ledger: LedgerEntry[];
  funds: Fund[];
  reports: CommunityReport[];
  users: User[];
  onApproveCase: (caseId: string) => Promise<void>;
  onRejectCase: (caseId: string, reason: string) => Promise<void>;
  onUpdateCaseBudget?: (caseId: string, amount: number) => Promise<void>;
  onApproveProject?: (projectId: string) => Promise<void>;
  onRejectProject?: (projectId: string) => Promise<void>;
  onUpdateProjectBudget?: (projectId: string, amount: number) => Promise<void>;
  onUpdateReportStatus: (reportId: string, status: "pending" | "investigated" | "resolved") => Promise<void>;
  onTriggerGeoSOS?: (msg: string | null) => void;
  onRefresh?: () => void;
  lang?: "ar" | "en" | "zh" | "fr" | "ru";
  isRefreshPaused?: boolean;
  onToggleRefresh?: () => void;
  lastUpdated?: Date;
}

export default function AdminPortal({
  user,
  cases,
  projects,
  ledger,
  funds,
  reports,
  users,
  onApproveCase,
  onRejectCase,
  onUpdateCaseBudget,
  onApproveProject,
  onRejectProject,
  onUpdateProjectBudget,
  onUpdateReportStatus,
  onTriggerGeoSOS,
  onRefresh,
  lang = "ar",
  isRefreshPaused = false,
  onToggleRefresh,
  lastUpdated,
}: AdminPortalProps) {
  const [selectedMuni, setSelectedMuni] = useState("صبراتة");
  const [editingBudgets, setEditingBudgets] = useState<Record<string, number>>({});
  const [editingProjectBudgets, setEditingProjectBudgets] = useState<Record<string, number>>({});
  const isSuperAdmin = user?.email?.toLowerCase() === "hosam.fono" || user?.isSuperAdmin === true;
  const [rejectingCase, setRejectingCase] = useState<Case | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Admin Portal sub-tabs
  const [adminTab, setAdminTab] = useState<"dashboard" | "approvals" | "auditors" | "integrity" | "ledger">("dashboard");
  const [biInsights, setBiInsights] = useState<{type: string; message: string}[]>([]);
  useEffect(() => {
    if (adminTab === "dashboard") {
      fetch("/api/analytics/dashboard")
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.data.insights) {
            setBiInsights(data.data.insights);
          }
        }).catch(err => {});
    }
  }, [adminTab]);
  const [isSmartSortActive, setIsSmartSortActive] = useState(true);

  // Default permissions for different roles
  const getDefaultPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case "admin":
        return ["approve_cases", "send_sos", "manage_funds", "view_ledger", "audit_users"];
      case "researcher":
        return ["approve_cases", "view_ledger"];
      case "charity":
        return ["view_ledger"];
      case "evaluation_committee":
        return ["approve_cases", "view_ledger"];
      case "finance_manager":
        return ["manage_funds", "view_ledger"];
      default:
        return [];
    }
  };

  // Check if current logged-in user has granular permission
  const hasPermission = (perm: string): boolean => {
    if (isSuperAdmin) return true;
    const userPermissions = user.permissions || getDefaultPermissionsForRole(user.role);
    return userPermissions.includes(perm);
  };

  // Local users state to support adding administrators & auditors dynamically in real time
  const [localUsers, setLocalUsers] = useState<User[]>([]);

  useEffect(() => {
    if (localUsers.length === 0) {
      setLocalUsers(users.map(u => ({
        ...u,
        status: (u as any).status || "active",
        region: (u as any).region || "المنطقة الغربية",
        allowedMunicipalities: (u as any).allowedMunicipalities || [u.municipality || "صبراتة"],
        permissions: (u as any).permissions || getDefaultPermissionsForRole(u.role)
      })));
    } else {
      const localAdded = localUsers.filter(u => !users.some(org => org.id === u.id));
      const updatedList = users.map(u => {
        const existingLocal = localUsers.find(lu => lu.id === u.id);
        if (existingLocal) return existingLocal;
        return {
          ...u,
          status: "active",
          region: "المنطقة الغربية",
          allowedMunicipalities: [u.municipality || "صبراتة"],
          permissions: getDefaultPermissionsForRole(u.role)
        };
      });
    }
  }, [users]);

  // Form states for adding admins/auditors
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "researcher" | "charity" | "evaluation_committee" | "finance_manager">("admin");
  const [newAdminMuni, setNewAdminMuni] = useState("صبراتة");
  const [newAdminRegion, setNewAdminRegion] = useState("المنطقة الغربية");
  const [addAdminSuccess, setAddAdminSuccess] = useState<string | null>(null);

  // RBAC Fine-grained Editing States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("citizen");
  const [editMuni, setEditMuni] = useState<string>("صبراتة");
  const [editRegion, setEditRegion] = useState<string>("المنطقة الغربية");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<string>("active");
  const [editAllowedMunis, setEditAllowedMunis] = useState<string[]>([]);
  const [rbacFilter, setRbacFilter] = useState<"all" | "staff" | "citizens" | "donors">("all");
  const [rbacRegionFilter, setRbacRegionFilter] = useState<string>("all");
  const [rbacMuniFilter, setRbacMuniFilter] = useState<string>("all");
  const [rbacDonationFilter, setRbacDonationFilter] = useState<"all" | "received" | "not_received">("all");

  // Geo-SOS Alert state
  const [sosType, setSosType] = useState("medical");
  const [sosMessage, setSosMessage] = useState("");
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [sosStatus, setSosStatus] = useState<string | null>(null);
  const [isSendingSos, setIsSendingSos] = useState(false);

  // Push Notification state management
  const [pushTitle, setPushTitle] = useState("تنبيه تحديث البيانات الميدانية الدورية");
  const [pushMessage, setPushMessage] = useState("يرجى من جميع العائلات والأسر المستفيدة تحديث بياناتها الاجتماعية والمالية عبر المنظومة لضمان استمرارية صرف المساعدات وتفادي تعليق الملف.");
  const [pushMuni, setPushMuni] = useState("all");
  const [pushType, setPushType] = useState<"deadline" | "update" | "assignment" | "sos">("deadline");
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [pushHistory, setPushHistory] = useState([
    {
      id: "push-1",
      title: "تحديث المسح الميداني الربع سنوي",
      message: "يرجى تحديث بيانات أفراد الأسرة وحسابات الدخل لبلدية صبراتة لتمكين باحثي الهيئة من إتمام المطابقة العامة.",
      targetMuni: "صبراتة",
      type: "update",
      sentAt: "منذ 3 أيام"
    }
  ]);

  const handleSendPushReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMessage.trim()) return;

    setIsSendingPush(true);
    try {
      const res = await fetch("/api/notifications/broadcast-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle,
          message: pushMessage,
          targetMunicipality: pushMuni,
          type: pushType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPushStatus(`تم بث الإشعار بنجاح! تم استهداف (${data.targetCount || 0}) أسرة مستفيدة بنجاح.`);
        
        // Add to history list
        setPushHistory(prev => [
          {
            id: `push-${Date.now()}`,
            title: pushTitle,
            message: pushMessage,
            targetMuni: pushMuni,
            type: pushType,
            sentAt: "الآن"
          },
          ...prev
        ]);

        // Sound indicator
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.45);
        } catch (soundErr) {}
      } else {
        setPushStatus("⚠️ فشل بث إشعار التذكير. يرجى التحقق من الخادم.");
      }
    } catch (err) {
      console.error("Error sending push notification:", err);
      setPushStatus("⚠️ عطل في الربط بالخادم لإصدار التنبيه الموحد.");
    } finally {
      setIsSendingPush(false);
      setTimeout(() => setPushStatus(null), 8000);
    }
  };

  // Dispatch Map States
  const [selectedMapCase, setSelectedMapCase] = useState<Case | null>(null);
  const [dispatchedCaseId, setDispatchedCaseId] = useState<string | null>(null);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [dispatchStage, setDispatchStage] = useState(0);
  const [dispatchStatus, setDispatchStatus] = useState("");
  const [mapScope, setMapScope] = useState<"muni" | "all">("all");

  const handleDispatchTeam = (caseId: string) => {
    setDispatchedCaseId(caseId);
    setDispatchProgress(5);
    setDispatchStage(1);
    setDispatchStatus("تأكيد طلب الإغاثة وتوليد أمر التكليف من السجل الوطني...");

    const targetCase = cases.find(c => c.id === caseId);
    const caseMuni = targetCase ? targetCase.municipality : selectedMuni;

    const stages = [
      { progress: 25, stage: 1, text: "تعبئة سلة الإمدادات الطبية والغذائية الطارئة بمقر الدعم..." },
      { progress: 55, stage: 2, text: `انطلاق فرقة الاستجابة الميدانية لبلدية ${caseMuni} باتجاه الموقع...` },
      { progress: 80, stage: 3, text: "الفريق على مقربة من الإحداثيات المسجلة ويقوم بالتواصل مع الحالة الميدانية..." },
      { progress: 100, stage: 4, text: "وصل فريق الإغاثة بنجاح! تم تسليم المعونات العاجلة والتحقق من الاستقرار الميداني 🚑💚" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < stages.length) {
        setDispatchProgress(stages[currentStep].progress);
        setDispatchStage(stages[currentStep].stage);
        setDispatchStatus(stages[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
  };

  // Pre-populated history of SOS alerts
  const [sosHistory, setSosHistory] = useState([
    {
      id: "sos-1",
      muni: "العجيلات",
      type: "medical",
      text: "حالة طفل يحتاج لعملية جراحية عاجلة لاستبدال جهاز قوقعة الأذن التالف لمتابعة النطق ببلدية العجيلات، الأولوية عاجلة!",
      time: "منذ ساعتين"
    },
    {
      id: "sos-2",
      muni: "صبراتة",
      type: "water",
      text: "عطل مفاجئ في مضخة بئر المياه السطحي الرئيسي ببلدية صبراتة، تم بث تنبيه طوارئ للمانحين لتوفير صهاريج مياه مؤقتة.",
      time: "منذ يومين"
    }
  ]);

  const getSosTemplate = (type: string, muni: string) => {
    switch (type) {
      case "medical":
        return `نداء إنساني عاجل ببلدية ${muni}: طفل يعاني من حالة حرجة يحتاج لجراحة عاجلة وتوفير أجهزة طبية لتفادي مضاعفات صحية خطيرة.`;
      case "water":
        return `طوارئ المياه ببلدية ${muni}: تلوث بئر مياه شرب محلي بالمنطقة، نناشد المانحين لتمويل صهاريج مياه صالحة للشرب وصيانة المضخات فوراً.`;
      case "disaster":
        return `إغاثة عاجلة ببلدية ${muni}: عائلات متضررة جراء السيول والأمطار الأخيرة بحاجة ماسة لفرشات وأغطية وسلات غذائية طارئة.`;
      default:
        return "";
    }
  };

  // Sync template message when muni or type changes, unless user customizes it
  useEffect(() => {
    if (!isCustomMessage) {
      setSosMessage(getSosTemplate(sosType, selectedMuni));
    }
  }, [selectedMuni, sosType, isCustomMessage]);

  // Filter cases awaiting committee approval
  const awaitingApprovalCases = cases.filter((c) => c.status === "field_visit_done");
  const newlySubmittedCases = cases.filter((c) => c.status === "submitted");

  const sortedNewlySubmittedCases = React.useMemo(() => {
    if (!isSmartSortActive) return newlySubmittedCases;
    
    return [...newlySubmittedCases].sort((a, b) => {
      const priorityWeight: Record<string, number> = { "عاجل": 4, "مرتفع": 3, "متوسط": 2, "منخفض": 1 };
      const aPriority = priorityWeight[a.priorityLevel || "متوسط"] || 0;
      const bPriority = priorityWeight[b.priorityLevel || "متوسط"] || 0;
      
      if (bPriority !== aPriority) return bPriority - aPriority;
      
      const aFamilySize = a.family?.totalMembers || 0;
      const bFamilySize = b.family?.totalMembers || 0;
      return bFamilySize - aFamilySize;
    });
  }, [newlySubmittedCases, isSmartSortActive]);
  const pendingProjects = projects.filter((p) => p.status === "pending" || !p.status);

  const handleSendGeoSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosMessage.trim()) return;

    setIsSendingSos(true);
    try {
      // 1. Submit to API route
      await fetch("/api/geosos/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipality: selectedMuni,
          title: `🚨 تنبيه طوارئ جغرافي عاجل (Geo-SOS) - بلدية ${selectedMuni}`,
          message: sosMessage,
          type: "emergency"
        })
      });

      // 2. Trigger the global state in App.tsx if the callback is passed
      if (onTriggerGeoSOS) {
        onTriggerGeoSOS(sosMessage);
      }

      // 3. Update local history of sent SOS alerts
      const newAlert = {
        id: `sos-${Date.now()}`,
        muni: selectedMuni,
        type: sosType,
        text: sosMessage,
        time: "الآن"
      };
      setSosHistory(prev => [newAlert, ...prev]);

      setSosStatus("تم بث تنبيه الطوارئ الجغرافي (Geo-SOS) بنجاح لجميع مستخدمي السجل والمانحين بالمنطقة! 📡🚨");
      setTimeout(() => setSosStatus(null), 8000);
    } catch (err) {
      console.error("Failed to send Geo-SOS:", err);
      setSosStatus("فشل إرسال التنبيه الجغرافي، يرجى التحقق من الاتصال بالخادم.");
    } finally {
      setIsSendingSos(false);
    }
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCase || !rejectionReason.trim()) return;

    setIsSubmittingReject(true);
    await onRejectCase(rejectingCase.id, rejectionReason);
    setIsSubmittingReject(false);
    setRejectingCase(null);
    setRejectionReason("");
  };

  const handleRegisterNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      setAddAdminSuccess("⚠️ يرجى تعبئة الاسم والبريد الإلكتروني بشكل صحيح.");
      return;
    }

    const isEmailTaken = localUsers.some(u => u.email.toLowerCase() === newAdminEmail.trim().toLowerCase());
    if (isEmailTaken) {
      setAddAdminSuccess("⚠️ البريد الإلكتروني مسجل مسبقاً لكادر آخر.");
      return;
    }

    const payload = {
      fullName: newAdminName.trim(),
      email: newAdminEmail.trim().toLowerCase(),
      role: newAdminRole,
      municipality: newAdminMuni,
      region: newAdminRegion,
      status: "active",
      permissions: getDefaultPermissionsForRole(newAdminRole),
      allowedMunicipalities: [newAdminMuni],
      gamificationPoints: 100
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setLocalUsers(prev => [...prev, data.user]);
        setAddAdminSuccess(`تم اعتماد وتفويض (${newAdminName}) بنظام الحوكمة والتدقيق البلدي وحفظه في قاعدة البيانات! 🛡️✨`);
        setNewAdminName("");
        setNewAdminEmail("");
      } else {
        const errData = await res.json();
        setAddAdminSuccess(`⚠️ فشل تسجيل الكادر: ${errData.message || "خطأ مجهول"}`);
      }
    } catch (err) {
      console.error(err);
      setAddAdminSuccess("⚠️ خطأ في الاتصال بالخادم لإضافة الكادر الجديد.");
    }
    
    setTimeout(() => {
      setAddAdminSuccess(null);
    }, 6000);
  };

  const handleSelectUserForEdit = (u: User) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditMuni(u.municipality || "صبراتة");
    setEditRegion((u as any).region || "المنطقة الغربية");
    setEditPermissions((u as any).permissions || getDefaultPermissionsForRole(u.role));
    setEditStatus((u as any).status || "active");
    setEditAllowedMunis((u as any).allowedMunicipalities || [u.municipality || "صبراتة"]);
  };

  const handleSaveUserRBAC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload = {
      role: editRole,
      municipality: editMuni,
      status: editStatus,
      region: editRegion,
      permissions: editPermissions,
      allowedMunicipalities: editAllowedMunis
    };

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setLocalUsers(prev => prev.map(u => u.id === editingUser.id ? data.user : u));
        setAddAdminSuccess(`تم تحديث حوكمة وصلاحيات (${editingUser.fullName}) بنجاح في قاعدة البيانات! 🔑🛡️`);
      } else {
        setAddAdminSuccess("⚠️ فشل تحديث الصلاحيات في قاعدة البيانات.");
      }
    } catch (err) {
      console.error(err);
      setAddAdminSuccess("⚠️ خطأ في الاتصال بالخادم لتحديث الصلاحيات.");
    }

    setEditingUser(null);
    setTimeout(() => {
      setAddAdminSuccess(null);
    }, 5000);
  };

  const handleToggleAdminStatus = async (userId: string) => {
    const u = localUsers.find(user => user.id === userId);
    if (!u) return;

    const newStatus = (u as any).status === "active" ? "revoked" : "active";

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setLocalUsers(prev => prev.map(user => user.id === userId ? data.user : user));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanCitizen = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حظر هذا المستخدم نهائياً بتهمة الاحتيال؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "banned" })
      });
      if (res.ok) {
        const data = await res.json();
        setLocalUsers(prev => prev.map(user => user.id === userId ? data.user : user));
        alert("تم حظر المستخدم نهائياً وإضافته لقائمة الحظر الموحدة.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPI stats calculation
  const totalFamilies = users.filter((u) => u.role === "citizen").length;
  const activeCases = cases.filter((c) => c.status !== "closed" && c.status !== "rejected").length;
  const completedCases = cases.filter((c) => c.status === "closed").length;
  const totalDisbursed = ledger
    .filter((e) => e.debitAccount === "حساب تسوية المساعدات المدفوعة" || e.creditAccount.includes("الصرف"))
    .reduce((sum, e) => sum + e.amount, 0);

  // Auto-Lock state
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    // Only apply auto-lock for admin and researcher roles
    if (user.role !== "admin" && user.role !== "researcher" && user.role !== "finance_manager" && user.role !== "evaluation_committee") return;

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      if (!isLocked) {
        timeout = setTimeout(() => {
          setIsLocked(true);
        }, LOCK_TIMEOUT_MS);
      }
    };

    // Attach event listeners
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [isLocked, user.role]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPassword === "1234" || unlockPassword === "admin123") {
      setIsLocked(false);
      setUnlockPassword("");
      setUnlockError("");
    } else {
      setUnlockError("رمز الدخول غير صالح. يرجى المحاولة مرة أخرى.");
    }
  };

  const totalDonations = ledger
    .filter((e) => e.creditAccount.includes("تبرعات"))
    .reduce((sum, e) => sum + e.amount, 0);

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B1519]/95 backdrop-blur-xl flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6 border border-slate-100">
          <div className="mx-auto w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">تأمين الجلسة</h2>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-medium">
              حفاظاً على سرية البيانات الميدانية والمالية، تم تجميد الجلسة تلقائياً. يرجى إدخال رمز التحقق الخاص بك.
            </p>
          </div>
          
          <form onSubmit={handleUnlock} className="space-y-5 pt-2">
            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  className="w-full text-center font-mono tracking-[1em] bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:tracking-normal placeholder:text-sm"
                  autoFocus
                  maxLength={6}
                />
              </div>
              {unlockError && <p className="text-[10px] text-rose-500 mt-3 font-bold bg-rose-50 py-1.5 rounded-lg">{unlockError}</p>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>مصادقة وفك التجميد</span>
            </button>
          </form>
          
          <div className="pt-2 text-[9px] text-slate-400 font-mono">
            نظام سجل التكافل الوطني للرقابة
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right">
      
      {/* Header with Title & Tab Navigation */}
      <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 flex-row-reverse">
            <span>🛡️</span>
            <span>بوابة الإدارة والحوكمة والتدقيق الوطني</span>
          </h2>
          <p className="text-xs text-gray-400">
            صلاحيات: {user.fullName} | رئيس الهيئة العليا المستقلة للرقابة والتكافل
          </p>
        </div>

        {/* Dynamic Sub-Tabs bar */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setAdminTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === "dashboard"
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 لوحة المؤشرات والـ GIS
          </button>
          {hasPermission("approve_cases") ? (
            <button
              onClick={() => setAdminTab("approvals")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminTab === "approvals"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🛡️ اعتمادات الحالات والخطط
            </button>
          ) : (
            <button
              disabled
              title="تتطلب هذه الصفحة صلاحية اعتماد الملفات الميدانية (approve_cases)"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-50/50 cursor-not-allowed flex items-center gap-1 opacity-60"
            >
              🔒 🛡️ اعتمادات الحالات والخطط
            </button>
          )}

          {hasPermission("audit_users") ? (
            <button
              onClick={() => setAdminTab("auditors")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminTab === "auditors"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👥 حوكمة النظام والمستخدمين
            </button>
          ) : (
            <button
              disabled
              title="تتطلب هذه الصفحة صلاحية حوكمة الكوادر والصلاحيات (audit_users)"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-50/50 cursor-not-allowed flex items-center gap-1 opacity-60"
            >
              🔒 👥 حوكمة الصلاحيات والمدققين
            </button>
          )}

          {hasPermission("send_sos") ? (
            <button
              onClick={() => setAdminTab("integrity")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminTab === "integrity"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ⚖️ الرقابة والـ SOS الجغرافي
            </button>
          ) : (
            <button
              disabled
              title="تتطلب هذه الصفحة صلاحية بث بلاغات الاستغاثة الجغرافية (send_sos)"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-50/50 cursor-not-allowed flex items-center gap-1 opacity-60"
            >
              🔒 ⚖️ الرقابة والـ SOS الجغرافي
            </button>
          )}

          {hasPermission("view_ledger") ? (
            <button
              onClick={() => setAdminTab("ledger")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminTab === "ledger"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🗃️ الدفتر المالي والسجلات
            </button>
          ) : (
            <button
              disabled
              title="تتطلب هذه الصفحة صلاحية استعراض السجل الوطني المالي (view_ledger)"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-50/50 cursor-not-allowed flex items-center gap-1 opacity-60"
            >
              🔒 🗃️ الدفتر المالي والسجلات
            </button>
          )}
        </div>
      </div>

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {adminTab === "dashboard" && (
        <div className="space-y-8 animate-fade-in">
          {/* Upper KPIs Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <span className="text-4xl p-2.5 bg-rose-50 rounded-xl">👥</span>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">أسر مستفيدة بالمنظومة</span>
                <span className="text-2xl font-black text-gray-900 font-mono">{totalFamilies}</span>
              </div>
            </div>

            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <span className="text-4xl p-2.5 bg-amber-50 rounded-xl">📂</span>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">حالات نشطة منشورة</span>
                <span className="text-2xl font-black text-gray-900 font-mono">{activeCases}</span>
              </div>
            </div>

            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <span className="text-4xl p-2.5 bg-emerald-50 rounded-xl">✓</span>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">ملفات تمت مساندتها وإغلاقها</span>
                <span className="text-2xl font-black text-gray-900 font-mono">{completedCases}</span>
              </div>
            </div>

            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <span className="text-4xl p-2.5 bg-blue-50 rounded-xl">🪙</span>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">إجمالي التبرعات الموثقة</span>
                <span className="text-2xl font-black text-[#0F6E56] font-mono">{totalDonations} د.ل</span>
              </div>
            </div>
          </div>

          {/* Admin BI Analytics & Charts */}
          <AdminCharts
            cases={cases}
            projects={projects}
            ledger={ledger}
            lang={lang}
            isRefreshPaused={isRefreshPaused}
            onToggleRefresh={onToggleRefresh}
            lastUpdated={lastUpdated}
          />
          
          {/* BI Analytics Insights from Backend */}
          {biInsights.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🤖</span>
                مؤشرات ودعم القرار (BI Insights)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {biInsights.map((insight, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${insight.type === 'warning' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : insight.type === 'alert' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
                    <p className="text-sm leading-relaxed">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Approved vs Pending Aid Applications Ratio by Municipality */}
          <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="p-1 bg-emerald-50 text-emerald-800 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </span>
                  <h3 className="text-sm font-black text-gray-900">المؤشر التفاعلي لنسب ومعدلات اعتماد طلبات الدعم مقابل الطلبات المعلقة</h3>
                </div>
                <p className="text-xs text-gray-400">
                  تحليل فوري وتوزيع إقليمي للطلبات التي تم تعميدها للتمويل والصرف مقارنة بالطلبات التي لا تزال قيد الدراسة والتحقق الميداني حسب كل بلدية.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 flex-row-reverse">
                  <span className="w-3 h-3 rounded-full bg-[#0F6E56]"></span>
                  <span className="text-gray-600">طلب معتمد ومكتمل</span>
                </span>
                <span className="flex items-center gap-1.5 flex-row-reverse">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                  <span className="text-gray-600">قيد المراجعة والبحث</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Column */}
              <div className="lg:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 h-[320px] flex flex-col justify-between">
                <div className="text-xs text-slate-500 font-bold mb-2 text-right">رسم بياني مكدس للتوزيع النسبي (شارت تفاعلي)</div>
                <div className="h-64 text-xs font-bold w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const muniMap: Record<string, { approved: number; pending: number }> = {};
                        cases.forEach((c) => {
                          const muni = c.municipality || "صبراتة";
                          if (!muniMap[muni]) {
                            muniMap[muni] = { approved: 0, pending: 0 };
                          }
                          const isApproved = ["committee_approved", "published", "funded", "closed"].includes(c.status);
                          const isPending = ["submitted", "under_review", "field_visit_done"].includes(c.status);
                          if (isApproved) {
                            muniMap[muni].approved += 1;
                          } else if (isPending) {
                            muniMap[muni].pending += 1;
                          }
                        });
                        return Object.entries(muniMap)
                          .map(([name, counts]) => ({
                            name,
                            approved: counts.approved,
                            pending: counts.pending,
                            total: counts.approved + counts.pending,
                            ratio: counts.approved + counts.pending > 0 
                              ? Math.round((counts.approved / (counts.approved + counts.pending)) * 100) 
                              : 0
                          }))
                          .sort((a, b) => b.total - a.total);
                      })()}
                      layout="vertical"
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                      <Tooltip formatter={(value, name) => [`${value} طلب`, name === "approved" ? "معتمد" : "معلق"]} />
                      <Bar dataKey="approved" name="طلبات معتمدة" stackId="a" fill="#0F6E56" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="pending" name="طلبات معلقة" stackId="a" fill="#F59E0B" radius={[4, 0, 0, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Statistics & Spark indicators list */}
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                <span className="text-xs font-black text-gray-700 block text-right">نسب الاستجابة والحوكمة التفصيلية بالبلديات</span>
                <div className="space-y-3">
                  {(() => {
                    const muniMap: Record<string, { approved: number; pending: number }> = {};
                    cases.forEach((c) => {
                      const muni = c.municipality || "صبراتة";
                      if (!muniMap[muni]) {
                        muniMap[muni] = { approved: 0, pending: 0 };
                      }
                      const isApproved = ["committee_approved", "published", "funded", "closed"].includes(c.status);
                      const isPending = ["submitted", "under_review", "field_visit_done"].includes(c.status);
                      if (isApproved) {
                        muniMap[muni].approved += 1;
                      } else if (isPending) {
                        muniMap[muni].pending += 1;
                      }
                    });
                    return Object.entries(muniMap)
                      .map(([name, counts]) => ({
                        name,
                        approved: counts.approved,
                        pending: counts.pending,
                        total: counts.approved + counts.pending,
                        ratio: counts.approved + counts.pending > 0 
                          ? Math.round((counts.approved / (counts.approved + counts.pending)) * 100) 
                          : 0
                      }))
                      .sort((a, b) => b.total - a.total)
                      .map((m) => (
                        <div key={m.name} className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 space-y-2 text-right">
                          <div className="flex justify-between items-center flex-row-reverse text-xs">
                            <span className="font-black text-slate-800">{m.name}</span>
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {m.ratio}% معتمد
                            </span>
                          </div>
                          
                          {/* Sparkline Progress Bar */}
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex flex-row-reverse">
                            <div className="bg-[#0F6E56] h-full" style={{ width: `${m.ratio}%` }} />
                            <div className="bg-[#F59E0B] h-full" style={{ width: `${100 - m.ratio}%` }} />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {m.approved} معتمد
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {m.pending} معلق
                            </span>
                            <span className="font-bold text-slate-700">المجموع: {m.total}</span>
                          </div>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive GIS Section with Heatmap */}
          <GISHeatmap
            cases={cases}
            projects={projects}
            users={localUsers.length > 0 ? localUsers : users}
            selectedMunicipality={selectedMuni}
            onSelectMunicipality={(muni) => setSelectedMuni(muni)}
          />
        </div>
      )}

      {/* ==================== TAB 2: APPROVALS & TIMELINES ==================== */}
      {adminTab === "approvals" && (
        <div className="space-y-8 animate-fade-in">
          {/* Projects Timeline view */}
          <ProjectTimeline
            projects={projects}
            lang={lang}
          />

          {/* National Committee Approval Section */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">اعتماد ومراجعة طلبات اللجنة الوطنية (صلاحية الإدارة)</h3>
              <p className="text-xs text-gray-500">مراجعة الملفات الميدانية الموثقة من قبل الباحثين الاجتماعيين لاعتمادها أو رفضها مسبباً</p>
            </div>

            {awaitingApprovalCases.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-4xl block mb-2">🔍</span>
                لا توجد حالات بانتظار اعتماد اللجنة حالياً. جميع الملفات الميدانية جرت معالجتها وتعميدها بالكامل.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {awaitingApprovalCases.map((c) => (
                  <div key={c.id} className="border border-[#E5E3DA] p-4 rounded-xl space-y-4 text-right bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-rose-600">{c.caseNumber}</span>
                      <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        البلدية: {c.municipality} | مؤشر الاحتياج: {c.needScore}/100
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-gray-800">الحاجة المطلوبة: {c.needTypes.join("، ")}</p>
                      <p className="text-gray-500 line-clamp-3">{c.description}</p>
                    </div>

                    {/* Bio-Verification Proof */}
                    {c.bioVerification ? (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between items-center text-[#0F6E56]">
                          <span className="font-bold">✓ إثبات الهوية (Bio-ID Verified)</span>
                          <span className="font-mono bg-[#E1F5EE] px-2 py-0.5 rounded text-[10px] font-bold">
                            {c.bioVerification.type === "camera" ? "صورة الوجه" : "توقيع معتمد"}
                          </span>
                        </div>
                        <div className="flex justify-center bg-white p-2 rounded border border-slate-100">
                          <img
                            src={c.bioVerification.data}
                            alt="بصمة التحقق البيومتري"
                            className="max-h-[80px] object-contain rounded"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-[11px] text-amber-700">
                        ⚠️ لم يتم تسجيل إثبات بيومتري لهذا الملف (طلب سابق).
                      </div>
                    )}

                    {/* Show researcher score logs */}
                    {c.researcherScores && (
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs space-y-1">
                        <p className="font-bold text-gray-700">تقرير زيارة الباحث: {c.assignedResearcherId}</p>
                        <p className="text-gray-500 font-mono text-[11px]">&quot;{c.researcherScores.notes}&quot;</p>
                        <div className="grid grid-cols-4 gap-1 text-center text-[10px] text-gray-400 font-mono pt-1.5 border-t border-slate-200">
                          <span>سكن: {c.researcherScores.housing}</span>
                          <span>صحة: {c.researcherScores.health}</span>
                          <span>تعليم: {c.researcherScores.education}</span>
                          <span>دخل: {c.researcherScores.income}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => onApproveCase(c.id)}
                        className="flex-1 bg-[#0F6E56] hover:bg-[#085041] text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        موافقة واعتماد الحالة
                      </button>
                      <button
                        onClick={() => setRejectingCase(c)}
                        className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
                      >
                        رفض مسبّب
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Newly Submitted Cases Pending Initial Review & Budget Adjustment */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 text-right">
                  <span className="text-amber-500">📥</span>
                  <span>طلبات الحالات الجديدة المستلمة (بانتظار المراجعة والاعتماد المالي المبدئي)</span>
                </h3>
                <p className="text-xs text-gray-500 text-right">مراجعة احتياجات المواطنين فور تقديمها لتعديل أو إقرار الميزانية المطلوبة قبل تفعيلها للميدان</p>
              </div>
              <button 
                onClick={() => setIsSmartSortActive(!isSmartSortActive)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-colors border ${
                  isSmartSortActive 
                    ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Compass className="w-4 h-4" />
                {isSmartSortActive ? "الفرز والتعيين الذكي مفعل" : "تفعيل الفرز والتعيين الذكي"}
              </button>
            </div>

            {sortedNewlySubmittedCases.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-3xl block mb-2">✨</span>
                لا توجد طلبات حالات جديدة بانتظار المراجعة حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedNewlySubmittedCases.map((c) => {
                  const currentBudget = editingBudgets[c.id] !== undefined ? editingBudgets[c.id] : c.amountRequired;
                  return (
                    <div key={c.id} className="border border-[#E5E3DA] p-5 rounded-2xl space-y-4 text-right bg-white shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-slate-600">{c.caseNumber}</span>
                        <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          البلدية: {c.municipality} | جديدة بانتظار التدقيق
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-gray-800">الحاجة المطلوبة: {c.needTypes?.join("، ") || "عام"}</p>
                        <p className="text-gray-500 line-clamp-3">{c.description}</p>
                      </div>

                      {/* Smart Researcher Suggestion */}
                      {isSmartSortActive && (
                        <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-xl text-xs space-y-2 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="font-bold text-purple-900 flex items-center gap-1 text-[11px]">
                              <span>🤖</span>
                              <span>خوارزمية الإسناد الذكي:</span>
                            </label>
                            <div className="text-[10px] text-purple-700 font-mono">
                              حجم الأسرة: <span className="font-bold">{c.family?.totalMembers || 0}</span> | أولوية: <span className="font-bold">{c.priorityLevel || "متوسط"}</span>
                            </div>
                          </div>
                          
                          {(() => {
                            const suitableResearchers = localUsers.filter(u => u.role === "researcher" && u.status === "active" && (u.allowedMunicipalities?.includes(c.municipality) || u.municipality === c.municipality));
                            if (suitableResearchers.length > 0) {
                              const suggested = suitableResearchers[0]; // Simple suggestion based on matching municipality
                              return (
                                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-purple-100 p-1.5 rounded-full">
                                      <UserCheck className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-slate-800 text-[11px]">الباحث: {suggested.fullName}</p>
                                      <p className="text-[9px] text-slate-500">أقرب باحث (بلدية {c.municipality})</p>
                                    </div>
                                  </div>
                                  <button 
                                    className="text-[10px] font-bold bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      alert(`تم إسناد المهمة للباحث ${suggested.fullName} بنجاح وإرسال إشعار فوري.`);
                                    }}
                                  >
                                    إسناد الميدان
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <p className="text-[10px] text-purple-600 bg-white p-2 rounded-lg border border-purple-100 text-center">
                                  لا يتوفر باحثون في نطاق هذه البلدية حالياً. سيتم توجيهها للفريق المركزي.
                                </p>
                              );
                            }
                          })()}
                        </div>
                      )}

                      {/* Budget Modification Box */}
                      <div className="bg-amber-50/40 border border-amber-100 p-3 rounded-xl text-xs space-y-2">
                        <label className="block font-bold text-amber-900 flex items-center gap-1">
                          {!hasPermission("manage_funds") && <span>🔒</span>}
                          <span>مراجعة وتعديل ميزانية الصرف المقترحة:</span>
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={currentBudget}
                            disabled={!hasPermission("manage_funds")}
                            onChange={(e) => setEditingBudgets(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                            className={`w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              !hasPermission("manage_funds") ? "bg-slate-50 cursor-not-allowed opacity-70" : ""
                            }`}
                          />
                          <span className="font-bold text-slate-600 whitespace-nowrap">دينار ليبي</span>
                        </div>
                        {!hasPermission("manage_funds") ? (
                          <p className="text-[10px] text-amber-600">
                            * يتطلب تعديل الميزانية صلاحية "تعديل ميزانيات الصناديق" (manage_funds)
                          </p>
                        ) : editingBudgets[c.id] !== undefined && editingBudgets[c.id] !== c.amountRequired ? (
                          <p className="text-[10px] text-emerald-700 font-bold">
                            * تم تعديل الميزانية من {c.amountRequired} د.ل إلى {editingBudgets[c.id]} د.ل
                          </p>
                        ) : null}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={async () => {
                            const customAmount = editingBudgets[c.id];
                            if (customAmount !== undefined && customAmount !== c.amountRequired) {
                              if (onUpdateCaseBudget) {
                                await onUpdateCaseBudget(c.id, customAmount);
                              }
                            }
                            await onApproveCase(c.id);
                          }}
                          className="flex-1 bg-[#0F6E56] hover:bg-[#085041] text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          اعتماد ونشر الحالة
                        </button>
                        <button
                          onClick={() => setRejectingCase(c)}
                          className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          رفض مسبّب
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Proposed Major Infrastructure Projects Pending Admin Review & Approval */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 text-right">
                <span className="text-purple-600">🏗️</span>
                <span>طلبات المشاريع البنيوية المقترحة (بانتظار التدقيق والاعتماد المالي)</span>
              </h3>
              <p className="text-xs text-gray-500 text-right">مراجعة وتعديل الميزانية المطلوبة للمشاريع التضامنية (مساجد، آبار، مدارس، مرافق عامة) قبل إطلاقها للتبرع</p>
            </div>

            {pendingProjects.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-3xl block mb-2">🏛️</span>
                لا توجد مقترحات مشاريع بنيوية بانتظار التدقيق والاعتماد حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingProjects.map((p) => {
                  const currentBudget = editingProjectBudgets[p.id] !== undefined ? editingProjectBudgets[p.id] : p.targetAmount;
                  return (
                    <div key={p.id} className="border border-[#E5E3DA] p-5 rounded-2xl space-y-4 text-right bg-white shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-purple-700">{p.projectNumber || "مشروع جديد"}</span>
                        <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          البلدية: {p.municipality} | نوع: {p.category === "well" ? "بئر مياه" : p.category === "mosque" ? "مسجد عتيق" : p.category === "school" ? "مدرسة" : "مرفق تضامني"}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-gray-800">{p.title}</p>
                        <p className="text-gray-500 line-clamp-3">{p.description}</p>
                      </div>

                      {/* Budget Modification Box */}
                      <div className="bg-purple-50/40 border border-purple-100 p-3 rounded-xl text-xs space-y-2">
                        <label className="block font-bold text-purple-900 flex items-center gap-1">
                          {!hasPermission("manage_funds") && <span>🔒</span>}
                          <span>مراجعة وتعديل ميزانية المشروع المقترحة:</span>
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={currentBudget}
                            disabled={!hasPermission("manage_funds")}
                            onChange={(e) => setEditingProjectBudgets(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                            className={`w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                              !hasPermission("manage_funds") ? "bg-slate-50 cursor-not-allowed opacity-70" : ""
                            }`}
                          />
                          <span className="font-bold text-slate-600 whitespace-nowrap">دينار ليبي</span>
                        </div>
                        {!hasPermission("manage_funds") ? (
                          <p className="text-[10px] text-purple-600">
                            * يتطلب تعديل الميزانية صلاحية "تعديل ميزانيات الصناديق" (manage_funds)
                          </p>
                        ) : editingProjectBudgets[p.id] !== undefined && editingProjectBudgets[p.id] !== p.targetAmount ? (
                          <p className="text-[10px] text-emerald-700 font-bold">
                            * تم تعديل الميزانية المستهدفة من {p.targetAmount} د.ل إلى {editingProjectBudgets[p.id]} د.ل
                          </p>
                        ) : null}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={async () => {
                            const customAmount = editingProjectBudgets[p.id];
                            if (customAmount !== undefined && customAmount !== p.targetAmount) {
                              if (onUpdateProjectBudget) {
                                await onUpdateProjectBudget(p.id, customAmount);
                              }
                            }
                            if (onApproveProject) {
                              await onApproveProject(p.id);
                            }
                          }}
                          className="flex-1 bg-[#0F6E56] hover:bg-[#085041] text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          اعتماد وتفعيل المشروع
                        </button>
                        <button
                          onClick={async () => {
                            if (onRejectProject) {
                              await onRejectProject(p.id);
                            }
                          }}
                          className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          رفض المقترح
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: AUDITORS & ROLE GOVERNANCE ==================== */}
      {adminTab === "auditors" && (
        <div className="space-y-8 animate-fade-in text-right">
          
          {/* Top Info Banner - RBAC Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm text-right space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">المشرفين العامين</span>
              <span className="text-xl font-black text-purple-700">
                {localUsers.filter(u => u.role === "admin").length} مدراء نظام
              </span>
            </div>
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm text-right space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">المدققين الميدانيين</span>
              <span className="text-xl font-black text-amber-700">
                {localUsers.filter(u => u.role === "researcher").length} باحثين بلديين
              </span>
            </div>
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm text-right space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">الجمعيات المعتمدة</span>
              <span className="text-xl font-black text-blue-700">
                {localUsers.filter(u => u.role === "charity").length} جهات شريكة
              </span>
            </div>
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm text-right space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">المانحين والداعمين</span>
              <span className="text-xl font-black text-emerald-700">
                {localUsers.filter(u => u.role === "donor").length} حساب مانح
              </span>
            </div>
            <div className="col-span-2 md:col-span-1 bg-white border border-[#E5E3DA] p-4 rounded-2xl shadow-sm text-right space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold">إجمالي المستفيدين</span>
              <span className="text-xl font-black text-slate-700">
                {localUsers.filter(u => u.role === "citizen").length} مسجل بالسجل
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Context-Aware Control Box (Add / Edit) */}
            <div className="lg:col-span-5 space-y-6">
              {!isSuperAdmin ? (
                <div className="bg-slate-900 text-white border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl text-right">
                  <div className="flex justify-center text-4xl">🔒</div>
                  <div className="space-y-2 text-center">
                    <h3 className="font-black text-amber-400 text-sm">قسم مُغلَق - الصلاحيات والمخول الرسمي</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      نعتذر، هذه الواجهة مخصصة بالكامل للمخول الرسمي والمسؤول العام عن إصدار وتعديل الصلاحيات:
                    </p>
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 mt-2 text-[11px] text-slate-200">
                      <p className="font-bold">حسام الدين الفيتوري احميد فونو</p>
                      <p className="text-[10px] text-gray-400 font-mono">Hosam.fono</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl leading-relaxed">
                    يتطلب تعديل أدوار الموظفين أو إضافة مشرفين جدد أو تغيير تراخيصهم الجغرافية تسجيل الدخول المباشر بحساب المسؤول الأول الحصري.
                  </div>
                </div>
              ) : (
                <>
                  {addAdminSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold shadow-sm">
                      {addAdminSuccess}
                    </div>
                  )}

                  {/* A. If Editing a User's RBAC Permissions */}
                  {editingUser ? (
                    <div className="bg-white border-2 border-emerald-500 p-6 rounded-3xl space-y-5 shadow-lg relative">
                      <div className="absolute top-4 left-4">
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          إلغاء التعديل ×
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-700 font-black px-2 py-0.5 rounded-full">تعديل الصلاحيات النشط</span>
                        <h3 className="font-black text-gray-900 text-sm mt-1">لوحة التحكم الجغرافي والـ RBAC المتقدم</h3>
                        <p className="text-[10px] text-gray-400">تعديل ملف الصلاحيات المخصص للمستفيد: <strong className="text-slate-800">{editingUser.fullName}</strong></p>
                      </div>

                      <form onSubmit={handleSaveUserRBAC} className="space-y-4 text-xs text-right">
                        
                        {/* User Info Static */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-0.5">
                          <p className="text-slate-500">اسم المستخدم: <strong className="text-slate-900">{editingUser.fullName}</strong></p>
                          <p className="text-slate-500">البريد الإلكتروني: <strong className="text-slate-900 font-mono">{editingUser.email}</strong></p>
                        </div>

                        {/* Role Selection */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">تعيين الدور الوظيفي الأساسي (RBAC Role) *</label>
                          <select
                            value={editRole}
                            onChange={(e) => {
                              const newR = e.target.value as UserRole;
                              setEditRole(newR);
                              setEditPermissions(getDefaultPermissionsForRole(newR));
                            }}
                            className="w-full border border-[#E5E3DA] rounded-xl p-2.5 bg-slate-50 text-slate-800 font-bold"
                          >
                            <option value="admin">🛡️ مدير نظام عام (الإدارة العليا)</option>
                            <option value="researcher">🔍 باحث اجتماعي ومدقق بلدي</option>
                            <option value="charity">🏢 جمعية شريكة ومؤسسة تنموية</option>
                            <option value="evaluation_committee">⚖️ لجنة التقييم والمراجعة المحايدة</option>
                            <option value="finance_manager">💼 مدير مالي ومدقق سجلات</option>
                            <option value="donor">💚 مانح / متبرع مرخص</option>
                            <option value="citizen">👤 مواطن مستفيد بالسجل الوطني</option>
                          </select>
                        </div>

                        {/* Security Status */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">الحالة الأمنية للوصول</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditStatus("active")}
                              className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                                editStatus === "active"
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              🟢 مرخص ونشط بالخدمة
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditStatus("revoked")}
                              className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                                editStatus === "revoked"
                                  ? "bg-rose-50 border-rose-500 text-rose-800 font-black"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              🔴 معلق ومسحوب الصلاحية
                            </button>
                          </div>
                        </div>

                        {/* Geographic Assignment Block */}
                        <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                          <p className="font-bold text-slate-800 text-[11px]">🗺️ التخصيص الجغرافي ونطاقات الترخيص</p>
                          
                          <div>
                            <label className="block text-slate-500 text-[10px] mb-1">النطاق الإداري الإقليمي</label>
                            <select
                              value={editRegion}
                              onChange={(e) => setEditRegion(e.target.value)}
                              className="w-full border border-[#E5E3DA] bg-white rounded-lg p-1.5 text-slate-800"
                            >
                              <option value="المنطقة الغربية">المنطقة الغربية / طرابلس الكبرى</option>
                              <option value="المنطقة الشرقية">المنطقة الشرقية / ساحلية الجبل الأخضر</option>
                              <option value="المنطقة الجنوبية">المنطقة الجنوبية / فزان الكبرى</option>
                            </select>
                          </div>

                          {/* Multiple Municipalities selection */}
                          <div>
                            <label className="block text-slate-500 text-[10px] mb-1">البلديات المرخصة للتدقيق (متعدد) *</label>
                            <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto bg-white p-2 border border-[#E5E3DA] rounded-lg">
                              {["صبراتة", "العجيلات", "صرمان", "طرابلس", "بنغازي", "سبها", "زوارة"].map(muni => {
                                const isChecked = editAllowedMunis.includes(muni);
                                return (
                                  <label key={muni} className="flex items-center gap-1.5 flex-row-reverse text-[10px] text-right cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setEditAllowedMunis(prev => prev.filter(m => m !== muni));
                                        } else {
                                          setEditAllowedMunis(prev => [...prev, muni]);
                                        }
                                      }}
                                      className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className={isChecked ? "font-bold text-emerald-700" : "text-slate-600"}>{muni}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <span className="text-[9px] text-gray-400 block mt-1">يُسمح للباحث بتقديم الزيارات واعتماد ملفات العائلات في هذه البلديات المحددة فقط.</span>
                          </div>
                        </div>

                        {/* Fine-grained Permissions Checklist (RBAC Permissions) */}
                        <div className="space-y-2.5">
                          <label className="block text-slate-700 font-extrabold">🔒 صلاحيات الدخول المحددة وتراخيص العمل المباشرة</label>
                          
                          <div className="space-y-2 bg-slate-950/5 border border-slate-200 p-3 rounded-2xl">
                            {[
                              { key: "approve_cases", label: "اعتماد الملفات الميدانية", desc: "السماح للباحث أو المشرف باعتماد ملفات الحالات المسجلة بعد الزيارة الميدانية." },
                              { key: "send_sos", label: "بث بلاغات الاستغاثة الجغرافية (Geo-SOS)", desc: "تخويل الموظف بإرسال تنبيهات طوارئ للمناطق المتضررة جغرافيًا." },
                              { key: "manage_funds", label: "تعديل ميزانيات الصناديق", desc: "صلاحية إعادة تخصيص الموارد المالية وتوزيع التبرعات الواردة." },
                              { key: "view_ledger", label: "استعراض السجل الوطني المالي", desc: "كشف تفاصيل الدفتر المالي المزدوج المركزي وسندات الحسابات الشاملة." },
                              { key: "audit_users", label: "حوكمة الكوادر والصلاحيات (RBAC)", desc: "التحكم الكامل في حسابات الموظفين وتعديل صلاحيات الوصول والبلديات." }
                            ].map(perm => {
                              const isChecked = editPermissions.includes(perm.key);
                              return (
                                <div key={perm.key} className="flex items-start gap-2 flex-row-reverse text-right pb-2 border-b border-slate-100 last:border-b-0">
                                  <input
                                    type="checkbox"
                                    id={`perm-${perm.key}`}
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setEditPermissions(prev => prev.filter(p => p !== perm.key));
                                      } else {
                                        setEditPermissions(prev => [...prev, perm.key]);
                                      }
                                    }}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                                  />
                                  <label htmlFor={`perm-${perm.key}`} className="flex-1 cursor-pointer select-none">
                                    <p className={`font-bold text-[11px] ${isChecked ? "text-emerald-700 font-extrabold" : "text-slate-800"}`}>
                                      {perm.label}
                                    </p>
                                    <p className="text-[9px] text-gray-400 leading-normal">{perm.desc}</p>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl cursor-pointer shadow-md text-center"
                          >
                            حفظ وإصدار الترخيص المحدث 🔑
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer text-center"
                          >
                            إلغاء التغييرات
                          </button>
                        </div>

                      </form>
                    </div>
                  ) : (
                    /* B. Normal Mode: Add/Register New staff form */
                    <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl space-y-4 shadow-sm">
                      <div>
                        <h3 className="font-black text-gray-900 text-sm">اعتماد الكوادر الرقابية والمدققين</h3>
                        <p className="text-[11px] text-gray-400">بصفتك المسؤول الأول، يمكنك إصدار تراخيص الوصول للمدققين ومسؤولي الجمعيات بالبلديات.</p>
                      </div>

                      <form onSubmit={handleRegisterNewAdmin} className="space-y-4 text-xs text-right">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">الاسم الكامل للموظف المعتمد *</label>
                          <input
                            type="text"
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                            placeholder="مثال: أ. فتحي عثمان الورشفاني"
                            className="w-full border border-[#E5E3DA] rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني المهني *</label>
                          <input
                            type="email"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            placeholder="email@takaful.ly"
                            className="w-full border border-[#E5E3DA] rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">الدور الوظيفي</label>
                            <select
                              value={newAdminRole}
                              onChange={(e) => setNewAdminRole(e.target.value as any)}
                              className="w-full border border-[#E5E3DA] rounded-xl p-2.5 bg-slate-50 text-slate-800 font-bold"
                            >
                              <option value="admin">🛡️ مدير نظام إضافي</option>
                              <option value="researcher">🔍 باحث ومدقق بلدي</option>
                              <option value="charity">🏢 جمعية شريكة معتمدة</option>
                              <option value="evaluation_committee">⚖️ لجنة تقييم محايدة</option>
                              <option value="finance_manager">💼 مدير ومراقب مالي</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1">بلدية الترخيص</label>
                            <select
                              value={newAdminMuni}
                              onChange={(e) => setNewAdminMuni(e.target.value)}
                              className="w-full border border-[#E5E3DA] rounded-xl p-2.5 bg-slate-50 text-slate-800"
                            >
                              <option value="صبراتة">صبراتة</option>
                              <option value="العجيلات">العجيلات</option>
                              <option value="صرمان">صرمان</option>
                              <option value="طرابلس">طرابلس</option>
                              <option value="بنغازي">بنغازي</option>
                              <option value="سبها">سبها</option>
                              <option value="زوارة">زوارة</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">النطاق الإداري الإشرافي</label>
                          <select
                            value={newAdminRegion}
                            onChange={(e) => setNewAdminRegion(e.target.value)}
                            className="w-full border border-[#E5E3DA] rounded-xl p-2.5 bg-slate-50 text-slate-800"
                          >
                            <option value="المنطقة الغربية">المنطقة الغربية / طرابلس الكبرى</option>
                            <option value="المنطقة الشرقية">المنطقة الشرقية / ساحلية الجبل الأخضر</option>
                            <option value="المنطقة الجنوبية">المنطقة الجنوبية / فزان الكبرى</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-sm text-center"
                        >
                          اعتماد وترخيص الكادر الجديد 🔑
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Central Registry of users with Filter & Details */}
            <div className="lg:col-span-7 bg-white border border-[#E5E3DA] p-6 rounded-3xl shadow-sm space-y-5">
              
              {/* Header and explanation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-gray-900 text-sm">سجل تراخيص وتفويضات الدخول للمنظومة (RBAC)</h3>
                  <p className="text-[11px] text-gray-400">إدارة الصلاحيات المخصصة للمشرفين والباحثين والجمعيات والمواطنين المسجلين بالسجل الوطني.</p>
                </div>
              </div>

              {/* Advanced Filter Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl text-[11px] font-bold">
                {[
                  { key: "all", label: "👥 الجميع" },
                  { key: "staff", label: "🛡️ الإداريين والمدققين" },
                  { key: "citizens", label: "👤 المواطنين (مستفيدي السجل)" },
                  { key: "donors", label: "💚 المانحين والداعمين" }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setRbacFilter(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      rbacFilter === tab.key
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Additional Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs">
                <select 
                  value={rbacRegionFilter} 
                  onChange={(e) => setRbacRegionFilter(e.target.value)}
                  className="border border-[#E5E3DA] rounded-xl p-2 bg-slate-50"
                >
                  <option value="all">كل الأقاليم</option>
                  <option value="المنطقة الغربية">المنطقة الغربية</option>
                  <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                  <option value="المنطقة الجنوبية">المنطقة الجنوبية</option>
                </select>

                <select 
                  value={rbacMuniFilter} 
                  onChange={(e) => setRbacMuniFilter(e.target.value)}
                  className="border border-[#E5E3DA] rounded-xl p-2 bg-slate-50"
                >
                  <option value="all">كل البلديات</option>
                  <option value="صبراتة">صبراتة</option>
                  <option value="العجيلات">العجيلات</option>
                  <option value="صرمان">صرمان</option>
                  <option value="طرابلس">طرابلس</option>
                  <option value="بنغازي">بنغازي</option>
                  <option value="سبها">سبها</option>
                  <option value="زوارة">زوارة</option>
                </select>

                {rbacFilter === "citizens" && (
                  <select 
                    value={rbacDonationFilter} 
                    onChange={(e) => setRbacDonationFilter(e.target.value as any)}
                    className="border border-[#E5E3DA] rounded-xl p-2 bg-slate-50"
                  >
                    <option value="all">حالة التبرع (الكل)</option>
                    <option value="received">استلموا تبرعات سابقاً</option>
                    <option value="not_received">لم يستلموا أي تبرع</option>
                  </select>
                )}
              </div>

              {/* Dynamic Table displaying filtered users */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-gray-600 font-bold">
                    <tr>
                      <th className="p-3 text-right">المسؤول / الحساب</th>
                      <th className="p-3">الدور</th>
                      <th className="p-3">النطاق والبلديات المرخصة</th>
                      <th className="p-3">صلاحيات RBAC المفعلة</th>
                      <th className="p-3 text-left">التحكم والضبط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localUsers
                      .filter(u => {
                        let passRole = true;
                        if (rbacFilter === "staff") passRole = u.role === "admin" || u.role === "researcher" || u.role === "charity";
                        if (rbacFilter === "citizens") passRole = u.role === "citizen";
                        if (rbacFilter === "donors") passRole = u.role === "donor";
                        if (!passRole) return false;

                        const region = (u as any).region || "المنطقة الغربية";
                        if (rbacRegionFilter !== "all" && region !== rbacRegionFilter) return false;

                        const muni = u.municipality || "صبراتة";
                        if (rbacMuniFilter !== "all" && muni !== rbacMuniFilter) return false;

                        if (rbacFilter === "citizens" && rbacDonationFilter !== "all") {
                          const userCases = cases.filter(c => c.userId === u.id);
                          const hasReceived = userCases.some(c => c.amountCollected > 0 || c.status === "funded" || c.status === "closed");
                          if (rbacDonationFilter === "received" && !hasReceived) return false;
                          if (rbacDonationFilter === "not_received" && hasReceived) return false;
                        }

                        return true;
                      })
                      .map((u) => {
                        const status = (u as any).status || "active";
                        const region = (u as any).region || "المنطقة الغربية";
                        const allowedMunis: string[] = (u as any).allowedMunicipalities || [u.municipality || "صبراتة"];
                        const permissions: string[] = (u as any).permissions || getDefaultPermissionsForRole(u.role);

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <div>
                                <p className="font-bold text-gray-900">{u.fullName}</p>
                                <p className="text-[9px] text-gray-400 font-mono">{u.email}</p>
                              </div>
                            </td>
                            
                            <td className="p-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                                u.role === "admin" 
                                  ? "bg-purple-50 text-purple-700 border border-purple-100" 
                                  : u.role === "researcher" 
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : u.role === "charity"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : u.role === "donor"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-slate-50 text-slate-600 border border-slate-100"
                              }`}>
                                {u.role === "admin" ? "إدارة عليا" : u.role === "researcher" ? "مدقق بلدي" : u.role === "charity" ? "جمعية شريكة" : u.role === "donor" ? "متبرع مرخص" : "مواطن مستفيد"}
                              </span>
                            </td>

                            <td className="p-3 space-y-0.5">
                              <p className="text-gray-700 font-bold text-[11px]">{region}</p>
                              <div className="flex flex-wrap gap-0.5 max-w-[140px]">
                                {allowedMunis.map(m => (
                                  <span key={m} className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.1 rounded">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {permissions.includes("approve_cases") && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded font-black">🛡️ اعتماد</span>
                                )}
                                {permissions.includes("send_sos") && (
                                  <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.2 rounded font-black">📡 طوارئ</span>
                                )}
                                {permissions.includes("manage_funds") && (
                                  <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded font-black">💰 ميزانية</span>
                                )}
                                {permissions.includes("view_ledger") && (
                                  <span className="text-[9px] bg-cyan-50 text-cyan-700 border border-cyan-100 px-1.5 py-0.2 rounded font-black">🗄️ سجلات</span>
                                )}
                                {permissions.includes("audit_users") && (
                                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded font-black">⚙️ حوكمة</span>
                                )}
                                {permissions.length === 0 && (
                                  <span className="text-[9px] text-gray-400 italic">لا توجد صلاحيات خاصة</span>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-left space-y-1">
                              {u.isSuperAdmin || u.id === "1" || u.email.toLowerCase() === "hosam.fono" ? (
                                <span className="text-[10px] text-gray-400 italic block">المسؤول العام الرئيسي</span>
                              ) : !isSuperAdmin ? (
                                <span className="text-[10px] text-gray-400 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block font-bold">🔒 صلاحيات مقفلة</span>
                              ) : (
                                <div className="flex flex-col sm:flex-row gap-1.5 items-end sm:items-center justify-end">
                                  
                                  {/* Custom edit button */}
                                  <button
                                    onClick={() => handleSelectUserForEdit(u)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                      editingUser?.id === u.id
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                    title="تعديل الصلاحيات والنطاق الجغرافي"
                                  >
                                    تعديل الصلاحيات ⚙️
                                  </button>

                                  {/* Fast status toggle */}
                                  {status === "banned" ? (
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-white flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3 text-rose-500" />
                                      محظور نهائياً
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleToggleAdminStatus(u.id)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                          status === "active"
                                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                        }`}
                                      >
                                        {status === "active" ? "تجميد 🔒" : "تفعيل🔓"}
                                      </button>
                                      
                                      {u.role === "citizen" && (
                                        <button
                                          onClick={() => handleBanCitizen(u.id)}
                                          title="إزالة المستفيد كمتحايل وحظره نهائياً"
                                          className="px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1"
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                          حظر نهائي
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB 4: SOS & EMERGENCY CONTROL ==================== */}
      {adminTab === "integrity" && (() => {
        const mapCases = cases.filter(c => {
          if (!c.latitude || !c.longitude) return false;
          if (mapScope === "muni") return c.municipality === selectedMuni;
          return true;
        });

        const lats = mapCases.map(c => c.latitude).filter(Boolean) as number[];
        const lngs = mapCases.map(c => c.longitude).filter(Boolean) as number[];

        const minLat = lats.length > 0 ? Math.min(...lats) : 32.65;
        const maxLat = lats.length > 0 ? Math.max(...lats) : 32.95;
        const minLng = lngs.length > 0 ? Math.min(...lngs) : 12.00;
        const maxLng = lngs.length > 0 ? Math.max(...lngs) : 12.80;

        const latRange = maxLat - minLat || 0.1;
        const lngRange = maxLng - minLng || 0.1;

        const paddedMinLat = minLat - latRange * 0.15;
        const paddedMaxLat = maxLat + latRange * 0.15;
        const paddedMinLng = minLng - lngRange * 0.15;
        const paddedMaxLng = maxLng + lngRange * 0.15;

        const getXY = (lat: number, lng: number) => {
          const latSpan = paddedMaxLat - paddedMinLat;
          const lngSpan = paddedMaxLng - paddedMinLng;

          const pctX = latSpan > 0 ? ((lng - paddedMinLng) / lngSpan) * 100 : 50;
          const pctY = lngSpan > 0 ? 100 - (((lat - paddedMinLat) / latSpan) * 100) : 50;

          return {
            x: 50 + (pctX / 100) * 900,
            y: 40 + (pctY / 100) * 320
          };
        };

        return (
          <div className="space-y-8 animate-fade-in text-right">
            {/* Geo-SOS Emergency Geographic Broadcast System */}
            <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-6 text-right" id="geosos-broadcast-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#E5E3DA]">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg animate-pulse">
                      <Radio className="w-5 h-5" />
                    </span>
                    بث تنبيه الطوارئ الجغرافي الفوري (Geo-SOS)
                  </h3>
                  <p className="text-xs text-gray-500">
                    أرسل نداء استغاثة فوري مباشر لجميع الهواتف والمانحين المتواجدين حالياً في بلدية معينة على الخريطة.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
                  <MapPin className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span className="text-xs font-black text-rose-900">
                    البلدية المستهدفة حالياً: <span className="underline">{selectedMuni}</span>
                  </span>
                </div>
              </div>

              {sosStatus && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${
                  sosStatus.includes("نجاح")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {sosStatus}
                </div>
              )}

              {/* GIS Dispatch & Emergency Coordinates Map */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                      <span>لوحة التوجيه والـ GIS لإحداثيات الاستغاثة الميدانية</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      رصد حي لإحداثيات البلاغات الطارئة وتوجيه فرق الإغاثة للمناطق المتضررة ببلدية {selectedMuni}.
                    </p>
                  </div>
                  
                  {/* Scope Filters */}
                  <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => { setMapScope("muni"); setSelectedMapCase(null); }}
                      className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${
                        mapScope === "muni" ? "bg-[#0F6E56] text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      بلدية {selectedMuni} فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMapScope("all"); setSelectedMapCase(null); }}
                      className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${
                        mapScope === "all" ? "bg-[#0F6E56] text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      كل بلديات المنطقة الغربية
                    </button>
                  </div>
                </div>

                {/* Bounding box range info */}
                <div className="text-[10px] text-slate-500 font-mono flex gap-4 bg-slate-950 p-2 rounded-lg justify-between items-center">
                  <span>📍 إطار المتابعة الجغرافي المنسق: Lat ({paddedMinLat.toFixed(4)}° to {paddedMaxLat.toFixed(4)}°) | Lng ({paddedMinLng.toFixed(4)}° to {paddedMaxLng.toFixed(4)}°)</span>
                  <span className="text-emerald-500 font-bold">● نظام الاستجابة السريعة نشط</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* The Interactive Coordinate SVG Plot */}
                  <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl relative p-3 overflow-hidden min-h-[300px] flex items-center justify-center">
                    {mapCases.length === 0 ? (
                      <div className="text-center space-y-2 p-6">
                        <Compass className="w-8 h-8 text-slate-600 mx-auto animate-spin" />
                        <p className="text-xs text-slate-400">لا توجد حالات إغاثة بإحداثيات مسجلة في هذا النطاق حالياً.</p>
                      </div>
                    ) : (
                      <div className="w-full relative">
                        {/* Compass visual absolute background */}
                        <div className="absolute top-4 left-4 text-slate-700 font-mono text-[9px] pointer-events-none space-y-0.5">
                          <div>LATITUDE GRID STATUS: CONNECTED</div>
                          <div>SIGNAL: STRONG (100%)</div>
                          <div>UNIT ID: GEO-DISPATCH-WEST</div>
                        </div>

                        <svg viewBox="0 0 1000 400" className="w-full h-auto max-h-[380px] block select-none">
                          {/* Define glowing marker filters */}
                          <defs>
                            <radialGradient id="glow-red-map" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="glow-amber-map" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="glow-blue-map" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </radialGradient>
                          </defs>

                          {/* Latitude Grid Lines */}
                          {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
                            const latVal = paddedMinLat + ratio * (paddedMaxLat - paddedMinLat);
                            const yPos = 40 + (1 - ratio) * 320;
                            return (
                              <g key={`lat-${idx}`} className="opacity-15">
                                <line x1="50" y1={yPos} x2="950" y2={yPos} className="stroke-slate-600 stroke-[1] stroke-dasharray-[4,4]" />
                                <text x="960" y={yPos + 3} className="fill-slate-400 text-[10px] font-mono text-left">{latVal.toFixed(3)}°N</text>
                              </g>
                            );
                          })}

                          {/* Longitude Grid Lines */}
                          {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
                            const lngVal = paddedMinLng + ratio * (paddedMaxLng - paddedMinLng);
                            const xPos = 50 + ratio * 900;
                            return (
                              <g key={`lng-${idx}`} className="opacity-15">
                                <line x1={xPos} y1="30" x2={xPos} y2="370" className="stroke-slate-600 stroke-[1] stroke-dasharray-[4,4]" />
                                <text x={xPos} y="385" textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">{lngVal.toFixed(3)}°E</text>
                              </g>
                            );
                          })}

                          {/* Grid Axes outline */}
                          <rect x="50" y="30" width="900" height="340" fill="none" className="stroke-slate-800 stroke-[1]" />

                          {/* Plotting Pins */}
                          {mapCases.map((c) => {
                            if (!c.latitude || !c.longitude) return null;
                            const { x, y } = getXY(c.latitude, c.longitude);
                            const isSelected = selectedMapCase?.id === c.id;
                            const isUrgent = c.priorityLevel === "عاجل" || c.priorityLevel === "مرتفع";
                            const color = c.priorityLevel === "عاجل" ? "#f43f5e" : c.priorityLevel === "مرتفع" ? "#f59e0b" : "#3b82f6";
                            const glowId = c.priorityLevel === "عاجل" ? "glow-red-map" : c.priorityLevel === "مرتفع" ? "glow-amber-map" : "glow-blue-map";

                            return (
                              <g
                                key={c.id}
                                transform={`translate(${x}, ${y})`}
                                className="cursor-pointer group"
                                onClick={() => setSelectedMapCase(c)}
                              >
                                {/* Glowing background halo */}
                                <circle
                                  r={isSelected ? 30 : 16}
                                  fill={`url(#${glowId})`}
                                  className={isUrgent ? "animate-pulse" : "opacity-60"}
                                />

                                {/* Radar scan ring for selected */}
                                {isSelected && (
                                  <circle
                                    r="24"
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="1.5"
                                    className="animate-ping opacity-75"
                                  />
                                )}

                                {/* Target crosshair for selected */}
                                {isSelected && (
                                  <g className="opacity-80">
                                    <line x1="-15" y1="0" x2="15" y2="0" stroke={color} strokeWidth="1" />
                                    <line x1="0" y1="-15" x2="0" y2="15" stroke={color} strokeWidth="1" />
                                  </g>
                                )}

                                {/* Outer solid rim */}
                                <circle
                                  r={isSelected ? 10 : 7}
                                  fill="#0f172a"
                                  stroke={color}
                                  strokeWidth="2.5"
                                  className="transition-all duration-200 group-hover:scale-125"
                                />

                                {/* Core bullet */}
                                <circle
                                  r={isSelected ? 5 : 3.5}
                                  fill={color}
                                  className="transition-all duration-200 group-hover:scale-125"
                                />

                                {/* Hover text label */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                  <rect
                                    x="-50"
                                    y="-35"
                                    width="100"
                                    height="22"
                                    rx="4"
                                    fill="#0f172a"
                                    stroke={color}
                                    strokeWidth="1"
                                  />
                                  <text
                                    x="0"
                                    y="-20"
                                    textAnchor="middle"
                                    fill="#ffffff"
                                    className="text-[10px] font-sans font-bold"
                                  >
                                    {c.caseNumber} ({c.municipality})
                                  </text>
                                </g>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Dispatch HUD Sidebar Panel (4 cols) */}
                  <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
                    {selectedMapCase ? (
                      <div className="space-y-4 text-right">
                        {/* Case metadata */}
                        <div className="border-b border-slate-800 pb-3">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              selectedMapCase.priorityLevel === "عاجل"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : selectedMapCase.priorityLevel === "مرتفع"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}>
                              أولوية {selectedMapCase.priorityLevel}
                            </span>
                            <span className="font-mono text-slate-400 text-xs font-bold">{selectedMapCase.caseNumber}</span>
                          </div>
                          <h5 className="font-bold text-sm text-slate-100 mt-2">
                            بلدية {selectedMapCase.municipality}
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            &quot;{selectedMapCase.description}&quot;
                          </p>
                        </div>

                        {/* Coordinates & Needs */}
                        <div className="space-y-2.5 text-xs text-slate-300">
                          <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                            <span className="text-slate-400">الإحداثيات الجغرافية:</span>
                            <span className="font-mono text-[11px] text-emerald-400 font-bold">
                              {selectedMapCase.latitude?.toFixed(5)}°, {selectedMapCase.longitude?.toFixed(5)}°
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">الاحتياجات الطارئة:</span>
                            <span className="font-bold text-slate-100">
                              {selectedMapCase.needTypes.join(" | ")}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">المبلغ المستحق:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {(selectedMapCase.amountRequired || 0).toLocaleString()} د.ل
                            </span>
                          </div>

                          {/* Bio-Verification badge integration */}
                          {selectedMapCase.bioVerification && (
                            <div className="flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <span>🔐</span> إثبات الهوية الرقمي معتمد
                              </span>
                              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                                {selectedMapCase.bioVerification.type === "camera" ? "بصمة وجه" : "توقيع مرسوم"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSosType(selectedMapCase.priorityLevel === "عاجل" ? "medical" : "custom");
                              setIsCustomMessage(true);
                              setSosMessage(
                                `🚨 نداء استغاثة ميداني عاجل ببلدية ${selectedMapCase.municipality} (إحداثيات: ${selectedMapCase.latitude?.toFixed(5)}°N, ${selectedMapCase.longitude?.toFixed(5)}°E). مطلوب تغطية الاحتياج لـ: ${selectedMapCase.needTypes.join(" و ")} للملف رقم ${selectedMapCase.caseNumber}.`
                              );
                              // Scroll down or show user where to send
                              const el = document.getElementById("geosos-broadcast-panel");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2 rounded-lg text-[11px] cursor-pointer flex items-center justify-center gap-1"
                          >
                            📢 نقل البيانات لاستمارة بث SOS
                          </button>

                          <button
                            type="button"
                            disabled={dispatchedCaseId === selectedMapCase.id && dispatchProgress < 100}
                            onClick={() => handleDispatchTeam(selectedMapCase.id)}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-[11px] cursor-pointer flex items-center justify-center gap-1"
                          >
                            🚑 توجيه فريق الإغاثة المباشر
                          </button>
                        </div>

                        {/* Dispatched Live Tracker Progress inside HUD */}
                        {dispatchedCaseId === selectedMapCase.id && (
                          <div className="mt-3 bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2 text-right">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 animate-bounce" /> {dispatchProgress}%
                              </span>
                              <span className="text-slate-300">متابعة الاستجابة الجغرافية</span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${dispatchProgress}%` }}
                              ></div>
                            </div>

                            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                              {dispatchStatus}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="my-auto text-center space-y-2 p-4 text-slate-400">
                        <Navigation className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                        <h5 className="font-bold text-xs text-slate-300">لم يتم اختيار بلاغ</h5>
                        <p className="text-[10px] text-slate-500">
                          انقر على أي نقطة أو دائرة مضيئة على الخريطة الجغرافية لتتبع الإحداثيات وتوجيه المساعدات وفرق الإغاثة فورا.
                        </p>
                      </div>
                    )}

                    <div className="border-t border-slate-900 pt-2.5 text-[9px] text-slate-500 font-mono flex items-center gap-1 justify-center">
                      <span>📡 GIS INTERFACE v4.0.2 - SECURE ENCRYPTED CHANNEL</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Composer (7 cols) */}
              <form onSubmit={handleSendGeoSOS} className="lg:col-span-7 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نوع حالة الطوارئ الجغرافية</label>
                    <select
                      value={sosType}
                      onChange={(e) => {
                        setSosType(e.target.value);
                        setIsCustomMessage(false);
                      }}
                      className="w-full border border-[#E5E3DA] bg-slate-50 rounded-xl p-2.5 text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:bg-white"
                    >
                      <option value="medical">🚑 حالة طبية حرجة وعاجلة</option>
                      <option value="water">💧 طوارئ انقطاع/شح مياه الشرب</option>
                      <option value="disaster">🌪️ كوارث طبيعية / سيول وأمطار</option>
                      <option value="custom">✍️ رسالة مخصصة بالكامل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">المنطقة الجغرافية (من الخريطة أعلاه)</label>
                    <div className="w-full bg-slate-100 border border-[#E5E3DA] text-slate-600 rounded-xl p-2.5 font-bold flex items-center justify-between">
                      <span>بلدية {selectedMuni}</span>
                      <span className="text-[10px] text-rose-600 font-mono animate-pulse">● نطاق 10 كم</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-bold">محتوى رسالة الإنذار SOS المستهدفة</label>
                    {isCustomMessage && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomMessage(false);
                          setSosMessage(getSosTemplate(sosType, selectedMuni));
                        }}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        إعادة تعيين القالب الذكي
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={sosMessage}
                    onChange={(e) => {
                      setSosMessage(e.target.value);
                      setIsCustomMessage(true);
                    }}
                    className="w-full border border-[#E5E3DA] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-rose-500/30 font-sans"
                    placeholder="ادخل نص رسالة الاستغاثة الموجهة للمواطنين والمانحين بالبلدية..."
                    required
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-400">
                    * بث البلاغ يرسل تنبيهاً فورياً وتفجر به إشعارات الهواتف المحمولة وتطبيقات المانحين ضمن خط الطول والعرض لبلدية {selectedMuni}.
                  </span>
                  <button
                    type="submit"
                    disabled={isSendingSos}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse shadow-md hover:shadow-lg"
                  >
                    <span>{isSendingSos ? "جاري بث التنبيه الموحد..." : "بث SOS الموجه الآن 📡"}</span>
                  </button>
                </div>
              </form>

              {/* Feed History (5 cols) */}
              <div className="lg:col-span-5 border border-[#E5E3DA] p-4 rounded-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1 flex-row-reverse">
                    <span>🕒</span>
                    <span>سجل بلاغات الطوارئ الجغرافية الأخيرة</span>
                  </h4>
                  <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                    {sosHistory.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1">
                        <div className="flex justify-between items-center text-gray-400 font-mono">
                          <span className="text-[9px]">{item.time}</span>
                          <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                            {item.muni} | {item.type === "medical" ? "طبية" : "طوارئ مياه"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-mono pr-2.5">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-dashed border-[#E5E3DA] p-2.5 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5 mt-3">
                  <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 animate-pulse" />
                  <span>
                    نظام SOS التابع لمنصة التكافل مشفر ومربوط بنظام الإحداثيات الموحد (GIS) بوزارة الشؤون الاجتماعية.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Push Notifications Periodic Update Reminder control panel */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-6 text-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#E5E3DA]">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg animate-pulse">
                    <Bell className="w-5 h-5" />
                  </span>
                  بث تنبيهات الدفع وتذكير الأسر بتحديث البيانات (Push Reminders)
                </h3>
                <p className="text-xs text-gray-500">
                  إشعار فوري من الرقابة الإدارية لتنبيه الأسر المسجلة بضرورة مراجعة بياناتها وتحديث الملف الميداني دورياً.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                <Volume2 className="w-4 h-4 text-amber-600 animate-bounce" />
                <span className="text-xs font-black text-amber-900">
                  قنوات الدفع: النشطة والمباشرة آلياً
                </span>
              </div>
            </div>

            {pushStatus && (
              <div className="p-4 rounded-xl text-xs font-bold border bg-emerald-50 border-emerald-200 text-emerald-800">
                {pushStatus}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Composer (7 cols) */}
              <form onSubmit={handleSendPushReminder} className="lg:col-span-7 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نوع التنبيه الموجه</label>
                    <select
                      value={pushType}
                      onChange={(e) => setPushType(e.target.value as any)}
                      className="w-full border border-[#E5E3DA] bg-slate-50 rounded-xl p-2.5 text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:bg-white"
                    >
                      <option value="deadline">⏳ موعد نهائي ومطابقة مطلوبة</option>
                      <option value="update">🔄 تحديث مسح ميداني دوري</option>
                      <option value="assignment">📋 مراجعة وتحديث الوثائق</option>
                      <option value="sos">⚠️ تنبيه طوارئ عام</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">البلدية المستهدفة بالتذكير</label>
                    <select
                      value={pushMuni}
                      onChange={(e) => setPushMuni(e.target.value)}
                      className="w-full border border-[#E5E3DA] bg-slate-50 rounded-xl p-2.5 text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:bg-white"
                    >
                      <option value="all">🌍 جميع بلديات المنطقة الغربية</option>
                      {Array.from(new Set(cases.map((c) => c.municipality))).map((m) => (
                        <option key={m} value={m}>📍 بلدية {m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">عنوان التنبيه (سيرسل كإشعار منبثق)</label>
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    className="w-full border border-[#E5E3DA] rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-sans font-bold"
                    placeholder="ادخل عنوان التنبيه القصير..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">محتوى رسالة التذكير بالتفصيل</label>
                  <textarea
                    rows={3}
                    value={pushMessage}
                    onChange={(e) => setPushMessage(e.target.value)}
                    className="w-full border border-[#E5E3DA] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-sans"
                    placeholder="ادخل نص رسالة التنبيه الموجهة..."
                    required
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-400">
                    * بث التذكير يمرر فوراً لتنبيهات الأسر (Citizen Notifications) المعتمدة والباحثين الميدانيين بالبلديات المحددة.
                  </span>
                  <button
                    type="submit"
                    disabled={isSendingPush}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse shadow-md hover:shadow-lg"
                  >
                    <span>{isSendingPush ? "جاري البث والتشهير..." : "بث إشعار الدفع الموحد 📢"}</span>
                  </button>
                </div>
              </form>

              {/* Push Log History (5 cols) */}
              <div className="lg:col-span-5 border border-[#E5E3DA] p-4 rounded-xl flex flex-col justify-between bg-slate-50">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1 flex-row-reverse">
                    <span>🕒</span>
                    <span>سجل حملات التنبيهات والتذكير الدورية</span>
                  </h4>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {pushHistory.map((item) => (
                      <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-lg text-[10px] space-y-1 shadow-xs">
                        <div className="flex justify-between items-center text-gray-400 font-mono">
                          <span className="text-[9px]">{item.sentAt}</span>
                          <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                            {item.targetMuni === "all" ? "كل البلديات" : item.targetMuni} | {item.type === "update" ? "تحديث دوري" : "موعد نهائي"}
                          </span>
                        </div>
                        <h5 className="font-black text-[11px] text-slate-800">{item.title}</h5>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-dashed border-[#E5E3DA] p-2.5 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5 mt-3">
                  <span>ℹ️</span>
                  <span>
                    التحذير والمسح الميداني يساعد في تطهير السجل وحصر التمويل لصالح المستحقين الفعليين.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Community Reports/Whistleblow Audit */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900">سجل البلاغات والشفافية المجتمعية</h3>
              <p className="text-xs text-gray-500">متابعة البلاغات والشكاوى المرفوعة من المواطنين بالبلديات لمكافحة الفساد والتحقق الفوري</p>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">لا توجد بلاغات مجتمعية نشطة حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-gray-600 border-b border-[#E5E3DA]">
                    <tr>
                      <th className="p-3">رقم البلاغ</th>
                      <th className="p-3">البلدية</th>
                      <th className="p-3">العنوان / الشكوى</th>
                      <th className="p-3">تاريخ التوثيق</th>
                      <th className="p-3">الحالة الرقابية</th>
                      <th className="p-3 text-left">التوجيه الإداري</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DA]">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-gray-700">{r.id}</td>
                        <td className="p-3 font-bold">{r.caseNumber ? `ملف: ${r.caseNumber}` : "السجل العام"}</td>
                        <td className="p-3 text-gray-600 max-w-xs truncate" title={r.reason}>
                          <span className="font-bold">بلاغ اشتباه أو عدم مطابقة: </span>
                          <span className="text-gray-400">{r.reason}</span>
                        </td>
                        <td className="p-3 font-mono text-gray-400">{r.createdAt}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === "resolved" 
                              ? "bg-emerald-50 text-emerald-700" 
                              : r.status === "investigated" 
                              ? "bg-blue-50 text-blue-700" 
                              : "bg-amber-50 text-amber-700 animate-pulse"
                          }`}>
                            {r.status === "resolved" ? "تم التحقق والإغلاق" : r.status === "investigated" ? "جاري التدقيق الميداني" : "بانتظار المراجعة"}
                          </span>
                        </td>
                        <td className="p-3 text-left space-x-1.5 space-x-reverse">
                          {r.status === "pending" && (
                            <button
                              onClick={() => onUpdateReportStatus(r.id, "investigated")}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded cursor-pointer text-[10px]"
                            >
                              إحالة للتحقيق 🔍
                            </button>
                          )}
                          {r.status === "investigated" && (
                            <button
                              onClick={() => onUpdateReportStatus(r.id, "resolved")}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded cursor-pointer text-[10px]"
                            >
                              إقرار ومعالجة القضية ✓
                            </button>
                          )}
                          {r.status === "resolved" && (
                            <span className="text-[10px] text-gray-400 italic">قضية مغلقة ومعالجة</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* ==================== TAB 5: CENTRAL LEDGER & USER REGISTER ==================== */}
      {adminTab === "ledger" && (
        <div className="space-y-8 animate-fade-in text-right">
          {/* Double-Entry Ledger Book (الدفتر المحاسبي الموحد) */}
          <div className="bg-white border border-[#E5E3DA] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#E5E3DA]">
              <h3 className="text-base font-bold text-gray-900">الدفتر المحاسبي والشفافية المالية (Ledger Logs)</h3>
              <p className="text-xs text-gray-500 mt-1">
                سجل القيود المحاسبية المزدوجة (مدين/دائن) الصادرة تلقائياً مع كل معاملة تبرع أو صرف مالي في ميزانية الصناديق.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-[#E5E3DA] text-gray-600">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">رقم القيد</th>
                    <th className="p-3 text-right">الحساب المدين (المنصرف له)</th>
                    <th className="p-3 text-right">الحساب الدائن (المصدر)</th>
                    <th className="p-3 text-left">القيمة المالية</th>
                    <th className="p-3">مرجع العملية والنزاهة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3DA] font-mono">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-gray-400 text-[10px]">{entry.entryDate}</td>
                      <td className="p-3 font-bold text-slate-800 text-[11px]">JV-{entry.id.substring(0, 6).toUpperCase()}</td>
                      <td className="p-3 text-red-600 font-bold text-right">{entry.debitAccount}</td>
                      <td className="p-3 text-emerald-600 font-bold text-right">{entry.creditAccount}</td>
                      <td className="p-3 font-bold text-slate-900 text-left text-xs">{entry.amount.toLocaleString()} د.ل</td>
                      <td className="p-3">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
                          <span className="text-emerald-500">✓</span> SHA256-{entry.id.substring(0, 8)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Funds status audit */}
            <div className="bg-white border border-[#E5E3DA] p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">أرصدة الصناديق والمحفظة الوطنية الموحدة</h3>
                <p className="text-xs text-gray-500">السيولة المتاحة لتغطية المساعدات العاجلة واعتمادات البلديات</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {funds.map((f) => {
                  const fundNames = {
                    "زكاة": "صندوق الزكاة الشرعي",
                    "صدقة": "صندوق الصدقات العامة",
                    "كفالة_يتيم": "صندوق كفالة الأيتام",
                    "صدقة_جارية": "صندوق الصدقة الجارية",
                    "طوارئ": "صندوق الإغاثة والطوارئ"
                  };
                  const displayName = fundNames[f.fundType] || "صندوق التمكين العام";
                  return (
                    <div key={f.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-right space-y-2">
                      <span className="text-2xl">{f.fundType === "طوارئ" ? "🚑" : f.fundType === "كفالة_يتيم" ? "👶" : "🌱"}</span>
                      <div>
                        <p className="font-bold text-gray-800 text-xs">{displayName}</p>
                        <p className="text-xs font-black text-emerald-700 font-mono mt-1">{f.balance.toLocaleString()} د.ل</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Central registry of verified users */}
            <div className="bg-white border border-[#E5E3DA] p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">سجل المستخدمين المعتمدين</h3>
                <p className="text-xs text-gray-500 font-mono">السجل الوطني الموحد للمحتاجين والجهات الشريكة</p>
              </div>

              <div className="space-y-3 divide-y divide-slate-100 max-h-[160px] overflow-y-auto pr-1">
                {users.map((u) => (
                  <div key={u.id} className="pt-2 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{u.fullName}</p>
                      <p className="text-[10px] text-gray-400">{u.email}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      u.role === "admin" 
                        ? "bg-purple-100 text-purple-700" 
                        : u.role === "researcher" 
                        ? "bg-amber-100 text-amber-700"
                        : u.role === "charity"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {u.role === "admin" ? "إدارة" : u.role === "researcher" ? "باحث" : u.role === "charity" ? "جمعية" : u.role === "donor" ? "متبرع" : "مواطن"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Admin controls (Feature Flags + Ban/Delete users) */}
            {(user.isSuperAdmin || user.email === "hosam.fono" || user.id === "super-admin") && (
              <AdvancedAdmin users={users} onRefresh={() => onRefresh && onRefresh()} />
            )}

          </div>
        </div>
      )}

      {/* Reject Case Dialog Modal */}
      {rejectingCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[190]">
          <div className="bg-white border border-[#E5E3DA] rounded-2xl max-w-md w-full p-6 shadow-xl text-right space-y-6">
            
            <div>
              <h3 className="text-lg font-black text-gray-900">رفض طلب المساعدة</h3>
              <p className="text-xs text-gray-500 mt-1">
                رقم الملف: {rejectingCase.caseNumber} | سيتم إرسال هذا التنبيه آلياً لحساب المواطن لتعديل ملفه الأسري.
              </p>
            </div>

            <form onSubmit={handleConfirmRejection} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">سبب الرفض بالتفصيل *</label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-[#E5E3DA] rounded-lg p-2"
                  placeholder="مثال: تبين بعد الزيارة الميدانية للباحث أن دخل العائلة كافٍ أو أن الأرقام المسجلة في السجل غير مطابقة للواقع المادي..."
                  required
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-[#E5E3DA]">
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {isSubmittingReject ? "جاري تسجيل الرفض..." : "تأكيد رفض الطلب"}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingCase(null)}
                  className="flex-1 bg-white border border-[#E5E3DA] hover:bg-slate-50 text-gray-700 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      <GoogleChatWidget />
    </div>
  );
}
