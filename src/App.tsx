import { playAlertSound as playAlertSoundUtil } from "./utils/audio";
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, Case, MajorProject, Fund, LedgerEntry, CommunityReport, OmniTransaction, Family, AppNotification, NotificationPreferences } from "./types";
const LandingView = lazy(() => import("./components/LandingView"));
const CitizenPortal = lazy(() => import("./components/CitizenPortal"));
const ResearcherPortal = lazy(() => import("./components/ResearcherPortal"));
const DonorPortal = lazy(() => import("./components/DonorPortal"));
const CharityPortal = lazy(() => import("./components/CharityPortal"));
const VolunteerPortal = lazy(() => import("./components/VolunteerPortal"));
const AdminPortal = lazy(() => import("./components/AdminPortal"));
import AuthModal from "./components/AuthModal";
import ProfileModal from "./components/ProfileModal";
const PaymentHub = lazy(() => import("./components/PaymentHub"));
const IntakePortal = lazy(() => import("./components/IntakePortal"));
const InfrastructurePortal = lazy(() => import("./components/InfrastructurePortal"));
const OfficialPrintCenter = lazy(() => import("./components/OfficialPrintCenter"));
const SecurityAuditVault = lazy(() => import("./components/SecurityAuditVault"));
const PublicVerifyPortal = lazy(() => import("./components/PublicVerifyPortal"));

const MapsSearchPortal = lazy(() => import("./components/MapsSearchPortal"));
const InteractiveReports = lazy(() => import("./components/InteractiveReports"));
const WorkspaceIntegration = lazy(() => import("./components/WorkspaceIntegration"));
import { translations, Language } from "./translations";
import { Bell, Volume2, VolumeX, CheckCheck, Globe, LogOut, LogIn, AlertCircle, Settings, ShieldAlert, CreditCard, Coins, Check, HelpCircle, ShieldCheck, ArrowLeft, ArrowRight, UserCheck, MapPin, Radio, Activity, RefreshCw, Menu, X, Sun, Moon, Home, Heart, Building2, Map, Printer, FileText } from "lucide-react";
import { customFetch } from "./utils/api";

const fetch = customFetch;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname === "/" ? "home" : location.pathname.substring(1);
  const setActiveTab = (tab: string) => {
    if (tab === "home") navigate("/");
    else navigate(`/${tab}`);
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("takaful_theme") as "light" | "dark") || "light";
  });
  const [lang, setLang] = useState<Language>("ar");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  }); // Open by default only on desktop screens, collapsible
  const [langOpen, setLangOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    projectUpdates: true,
    taskAssignments: true,
    mentions: true,
    deadlines: true,
    donations: true,
    soundEnabled: true
  });

  useEffect(() => {
    localStorage.setItem("takaful_theme", theme);
  }, [theme]);

  const playAlertSound = (type: "success" | "notification" | "click") => {
    playAlertSoundUtil(type, notificationPrefs.soundEnabled);
  };

  // Core data states loaded from Express server
  const [cases, setCases] = useState<Case[]>([]);
  const [projects, setProjects] = useState<MajorProject[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    module_map: true,
    module_reports: true,
    module_projects: true,
    module_donation: true,
    module_verify: true,
  });

  // Real-time data refresh pause/resume state and last refreshed timestamp
  const [isRefreshPaused, setIsRefreshPaused] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Simulation Alert State (Geo-SOS)
  const [activeGeoSOS, setActiveGeoSOS] = useState<string | null>(null);

  // Live Visitor Stats
  const [visitorsCount, setVisitorsCount] = useState(125430);
  const [onlineUsersCount, setOnlineUsersCount] = useState(842);

  // Quick switch profile options
  const profiles = [
    { email: "guest", label: "زائر (تصفح وتبرع كضيف)", role: "guest" },
    { email: "citizen1@takaful.ly", label: "مواطن محتاج للتمكين", role: "citizen" },
    { email: "researcher1@takaful.ly", label: "باحث اجتماعي ميداني", role: "researcher" },
    { email: "donor1@takaful.ly", label: "متبرع ليبي مسجّل", role: "donor" },
    { email: "charity1@takaful.ly", label: "جمعية خيرية معتمدة", role: "charity" },
  ];

  // Helper for safe, retrying fetch with warning logging instead of fatal errors
  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 5, delay = 2000): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return await res.json();
      } catch (e) {
        if (i === retries - 1) {
          console.warn(`Failed to load from ${url} after ${retries} attempts. Error:`, e);
          throw e;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // Fetch notifications from server
  const loadNotifications = async () => {
    try {
      const data = await fetchWithRetry("/api/notifications");
      if (Array.isArray(data)) {
        setNotifications(data);
        const unread = data.filter((n) => !n.read).length;
        setUnreadCount((prev) => {
          // If there's new unread, trigger chime
          if (unread > prev && prev > 0) {
            playAlertSound("notification");
          }
          return unread;
        });
      }
    } catch (e) {
      console.warn("Could not load notifications:", e);
    }
  };

  // Load Sijil data from server APIs
  const loadData = async () => {
    try {
      const [resFlags, resCases, resProjects, resFunds, resLedger, resReports, resUsers] = await Promise.all([
        fetchWithRetry("/api/feature-flags"),
        fetchWithRetry("/api/cases"),
        fetchWithRetry("/api/projects"),
        fetchWithRetry("/api/funds"),
        fetchWithRetry("/api/ledger"),
        fetchWithRetry("/api/reports"),
        fetchWithRetry("/api/users"),
      ]);

      setCases(resCases);
      setProjects(resProjects);
      setFunds(resFunds);
      // Sort ledger newest first
      setLedger(resLedger.reverse());
      setReports(resReports);
      setLastRefreshedAt(new Date());
      
      // Load users directly from API
      setUsers(resUsers);
      if (resFlags && resFlags.flags) setFeatureFlags(resFlags.flags);

      await loadNotifications();

    } catch (e) {
      console.warn("Could not load server state data:", e);
    }
  };

  // Run on mount: verify session and set background poller
  useEffect(() => {
    loadData();

    // Verify session if token exists
    const token = localStorage.getItem("takaful_session_token");
    if (token) {
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "success") {
          setFeatureFlags(data.state.featureFlags || {});
            setCurrentUser(data.user);
            setSessionToken(token);
          } else {
            localStorage.removeItem("takaful_session_token");
          }
        })
        .catch((err) => console.warn("Session verification failed:", err));
    }

    // Interval poller for real-time notifications
    const timer = setInterval(() => {
      loadNotifications();
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  // Data is fetched on initial load or user action, not polled
  // Removed automatic 8-second polling to prevent high load and self-DDOS

  useEffect(() => {
    // We only simulate fake stats if required by UX, but let's just leave it clean
  }, []);

  // Handle Switch Profile
  const handleSwitchProfile = async (email: string) => {
    if (email === "guest") {
      setCurrentUser(null);
      localStorage.removeItem("takaful_session_token");
      setSessionToken(null);
      setActiveTab("home");
      playAlertSound("click");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }), // Bypasses password check for quick switch simulator
      });
      const data = await res.json();
      if (data.status === "success") {
        setCurrentUser(data.user);
        localStorage.setItem("takaful_session_token", data.token);
        setSessionToken(data.token);
        // Automatically open their respective portal for seamless UX
        if (data.user.role === "citizen") {
          setActiveTab("cases");
        } else if (data.user.role === "donor") {
          setActiveTab("donation");
        } else {
          setActiveTab("supervision");
        }
        playAlertSound("success");
      }
    } catch (e) {
      console.error("Login switch profile failed:", e);
    }
  };

  // API Callbacks for Portals
  const handleRegisterCase = async (caseData: any) => {
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFamily = async (family: Family) => {
    const c = cases.find((item) => item.userId === currentUser?.id);
    if (!c) return;

    try {
      const res = await fetch(`/api/cases/${c.id}/family`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
        playAlertSound("success");
      }
    } catch (e) {
      console.error("Failed to delete case:", e);
    }
  };

  const handleUpdateCase = async (caseId: string, updatedFields: any) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
        playAlertSound("success");
      }
    } catch (e) {
      console.error("Failed to update case:", e);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
        playAlertSound("success");
      }
    } catch (e) {
      console.error("Failed to delete project:", e);
    }
  };

  const handleUpdateProject = async (projectId: string, updatedFields: any) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
        playAlertSound("success");
      }
    } catch (e) {
      console.error("Failed to update project:", e);
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
        playAlertSound("success");
      }
    } catch (e) {
      console.error("Failed to create project:", e);
    }
  };

  const handleSubmitVisitReport = async (caseId: string, visitScores: any) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researcherScores: visitScores,
          researcherId: currentUser?.fullName || "أ. خليل التواتي",
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveCaseByAdmin = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectCaseByAdmin = async (caseId: string, reason: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCaseBudgetByAdmin = async (caseId: string, amount: number) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountRequired: amount }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveProjectByAdmin = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectProjectByAdmin = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProjectBudgetByAdmin = async (projectId: string, amount: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAmount: amount }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdoptCaseByCharity = async (caseId: string, charityId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/adopt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charityId }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisburseCaseByCharity = async (caseId: string, charityId: string, disburseData: any) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/disburse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charityId, ...disburseData }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDonate = async (donationData: any): Promise<OmniTransaction> => {
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donationData),
    });
    const data = await res.json();

    // Trigger simulated system notification immediately
    try {
      const isCase = !!donationData.caseId;
      const targetLabel = isCase ? "حالة إنسانية مستحقة بالسجل" : "مشروع عيني وقفي";
      await fetch("/api/notifications/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "تبرع مالي جديد تم إثباته بالتوقيع العشري 🪙",
          message: `أجرى المانح مساهمة مباركة بقيمة ${donationData.amount} ${donationData.currency || "د.ل"} لدعم ${targetLabel}. تم توثيق تبرعه في دفتر الشفافية المزدوج.`,
          type: "donation"
        })
      });
    } catch (e) {
      console.error("Simulation notify trigger failed:", e);
    }

    await loadData();
    playAlertSound("success");
    return data.transaction;
  };

  const handleSubmitSkill = async (skillData: any) => {
    try {
      await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skillData),
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: "pending" | "investigated" | "resolved") => {
    try {
      await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitCommunityReport = async (reportData: any) => {
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadNotifications();
        playAlertSound("click");
      }
    } catch (e) {
      console.error("Mark notification as read failed:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.status === "success") {
        await loadNotifications();
        playAlertSound("success");
      }
    } catch (e) {
      console.error("Mark all notifications as read failed:", e);
    }
  };

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: sessionToken })
        });
      } catch (e) {
        console.error("Logout request error:", e);
      }
    }
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem("takaful_session_token");
    setActiveTab("home");
    playAlertSound("click");
  };

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setSessionToken(token);
    localStorage.setItem("takaful_session_token", token);
    setShowAuthModal(false);
    if (user.role === "citizen") {
      setActiveTab("cases");
    } else if (user.role === "donor") {
      setActiveTab("donation");
    } else {
      setActiveTab("supervision");
    }
    playAlertSound("success");
  };

  const toggleSound = () => {
    setNotificationPrefs(prev => {
      const updated = { ...prev, soundEnabled: !prev.soundEnabled };
      playAlertSound("click");
      return updated;
    });
  };

  const langOptions = [
    { code: "ar", label: "العربية 🇱🇾" },
    { code: "en", label: "English 🇬🇧" },
    { code: "zh", label: "中文 🇨🇳" },
    { code: "fr", label: "Français 🇫🇷" },
    { code: "ru", label: "Русский 🇷🇺" },
  ];

  const t = translations[lang] || translations.ar;

  // Find the current citizen's specific case
  const citizenCase = cases.find((c) => c.userId === currentUser?.id) || null;

  const navGroups = [
    {
      title: lang === "ar" ? "الخدمات العامة" : "Public Services",
      showGroup: true,
      items: [
        { id: "home", label: t.navHome || "الرئيسية", icon: Home, colorClass: "text-[#10B981]", bgColor: "bg-emerald-500/20", show: featureFlags.module_home !== false },
        { id: "donation", label: t.navDonateNow || "تبرع الآن", icon: Coins, colorClass: "text-amber-500", bgColor: "bg-amber-500/20", show: featureFlags.module_donation !== false },
        { id: "verify", label: lang === "ar" ? "التحقق ومكافحة الاحتيال" : "Public Verify", icon: ShieldCheck, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: featureFlags.module_verify !== false },
        { id: "reports", label: t.navReports || "التقارير والمؤشرات", icon: FileText, colorClass: "text-yellow-500", bgColor: "bg-yellow-500/20", show: featureFlags.module_reports !== false },
      ]
    },
    {
      title: lang === "ar" ? "العمليات والميدان" : "Field & GIS",
      showGroup: true,
      items: [
        { id: "map", label: t.navMapsSearch || "الخرائط والبحث", icon: Map, colorClass: "text-sky-500", bgColor: "bg-sky-500/20", show: featureFlags.module_map !== false },
        { id: "cases", label: t.navAddBeneficiary || "الحالات الميدانية", icon: Heart, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: !!currentUser && ["admin", "researcher", "charity", "field_coordinator"].includes(currentUser.role) },
        { id: "infrastructure", label: t.navHospitalsSchools || "المشاريع الكبرى", icon: Building2, colorClass: "text-indigo-500", bgColor: "bg-indigo-500/20", show: featureFlags.module_projects !== false },
      ]
    },
    {
      title: lang === "ar" ? "الإدارة والرقابة" : "Management",
      showGroup: true,
      items: [
        { 
          id: "supervision", 
          label: currentUser?.role === "citizen" ? (lang === "ar" ? "لوحة المستفيد" : "Beneficiary") : (t.navSupervisionGovernance || "الإشراف والتدقيق"), 
          icon: Settings, 
          colorClass: "text-violet-500", 
          bgColor: "bg-violet-500/20", 
          show: !!currentUser 
        },
        { id: "printing", label: t.navPrintCenter || "سجلات الطباعة", icon: Printer, colorClass: "text-blue-500", bgColor: "bg-blue-500/20", show: !!currentUser && ["admin", "researcher", "charity"].includes(currentUser.role) },
        { id: "security", label: t.navSecurityIntegrity || "سجل التدقيق الأمني", icon: ShieldAlert, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: !!currentUser && currentUser.role === "admin" },
        { id: "workspace", label: lang === "ar" ? "تكامل مساحة العمل" : "Workspace Integration", icon: Globe, colorClass: "text-blue-600", bgColor: "bg-blue-600/20", show: !!currentUser && ["admin", "charity", "researcher", "data_analyst", "content_manager"].includes(currentUser.role) },
      ]
    }
  ];

  return (
    <div 
      className={`min-h-screen ${theme === "dark" ? "bg-[#090D16] text-[#F1F5F9] dark" : "bg-[#FAFAF8] text-[#1F1E1B]"} font-sans selection:bg-[#E1F5EE] selection:text-[#085041] transition-colors duration-200`} 
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      
      <header className="bg-[#0B1519] text-white border-b border-slate-800 sticky top-0 z-40 print:hidden shadow-lg backdrop-blur-xl">
        <div className="mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {/* COLLAPSIBLE SIDEBAR TOGGLER BUTTON (THREE BARS) */}
            <button
              onClick={() => { setSidebarOpen(!sidebarOpen); playAlertSound("click"); }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 transition-all text-[#10B981] cursor-pointer border border-slate-800 flex items-center justify-center shadow-inner hover:scale-105 active:scale-95"
              title="تعديل القوائم الجانبية"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo Brand */}
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center text-white text-base font-extrabold shadow-md shadow-emerald-500/20">
                🤝
              </span>
              <div className="text-right">
                <span className="text-xs font-black text-gray-50 block leading-none">{t.appName}</span>
                <span className="text-[9px] text-[#10B981] font-mono mt-0.5 block leading-none">{t.appSubName}</span>
              </div>
            </div>
          </div>

          {/* Action Utilities (Language, Notifications, Profile Session) */}
          <div className="flex items-center gap-3">
            
            {/* Elegant Sun/Moon Theme Toggle Button */}
            <button
              onClick={() => {
                setTheme(theme === "light" ? "dark" : "light");
                playAlertSound("click");
              }}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-gray-200 hover:text-[#10B981] transition-all rounded-xl cursor-pointer border border-slate-800 flex items-center justify-center shadow-inner hover:scale-105 active:scale-95"
              title={theme === "light" ? "تفعيل النمط الداكن" : "تفعيل النمط الفاتح"}
              id="theme-mode-toggle-btn"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Click-activated Language Selector */}
            <div className="relative">
              <button 
                onClick={() => { setLangOpen(!langOpen); playAlertSound("click"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-gray-200 hover:text-white hover:bg-slate-800 transition-colors rounded-xl cursor-pointer text-xs font-extrabold focus:outline-none border border-slate-800"
              >
                <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                <span>{langOptions.find((o) => o.code === lang)?.label.split(" ")[0]}</span>
              </button>
              {langOpen && (
                <>
                  {/* Backdrop guard to close dropdown */}
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)}></div>
                  <div className={`absolute top-10 ${lang === "ar" ? "left-0" : "right-0"} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 w-32 animate-fade-in`}>
                    {langOptions.map((o) => (
                      <button
                        key={o.code}
                        onClick={() => {
                          setLang(o.code as Language);
                          setLangOpen(false);
                          playAlertSound("click");
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs hover:bg-slate-800 transition-colors block cursor-pointer font-bold ${
                          lang === o.code ? "text-[#10B981] bg-slate-950" : "text-gray-300"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Real-time Notification System Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifDropdown(!showNotifDropdown); playAlertSound("click"); }}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-slate-800 transition-colors rounded-xl cursor-pointer focus:outline-none"
                id="notification-bell-btn"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div 
                  className={`absolute top-11 ${lang === "ar" ? "left-0" : "right-0"} w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 p-4 space-y-3 text-white`}
                  id="notification-popover"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-sm text-gray-100 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#10B981]" />
                      {t.notifications || "التنبيهات"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleSound}
                        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                        title={t.soundAlerts || "Sound Alerts"}
                      >
                        {notificationPrefs.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-4 h-4 text-emerald-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-xs">
                        {lang === "ar" ? "لا توجد تنبيهات جديدة حالياً" : "No new notifications"}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`p-2.5 rounded-2xl border transition-all text-xs cursor-pointer ${
                            n.read
                              ? "bg-slate-950 border-slate-900 text-gray-500"
                              : "bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-950/30 text-gray-200 font-medium"
                          }`}
                        >
                          <div className="flex items-start gap-1.5">
                            <span className="text-sm mt-0.5">
                              {n.type === "donation" ? "🪙" : n.type === "assignment" ? "📋" : n.type === "mention" ? "💬" : "🚨"}
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <div className="font-bold text-[11px] text-gray-100">{n.title}</div>
                              <div className="text-[10px] leading-relaxed text-gray-400">{n.message}</div>
                              <div className="text-[9px] text-gray-500 font-mono text-left">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="w-full text-center text-[10px] font-bold text-[#10B981] hover:underline pt-1 block cursor-pointer"
                    >
                      {lang === "ar" ? "تعيين الكل كمقروء" : "Mark all as read"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Session Management */}
            <div className="text-xs">
              {currentUser ? (
                <div className="bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-gray-200 hidden sm:inline">
                    {currentUser.isAnonymous ? (lang === "ar" ? "فاعل خير (مخفي)" : "Anonymous") : currentUser.fullName.split(" ")[0]}
                  </span>
                  {currentUser.gamificationPoints !== undefined && (
                    <span className="bg-amber-950 text-amber-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-black">
                      🏆{currentUser.gamificationPoints}
                    </span>
                  )}
                  <button
                    onClick={() => { setShowProfileModal(true); playAlertSound("click"); }}
                    className="p-1 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer ml-1"
                    title={lang === "ar" ? "الإعدادات" : "Settings"}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1 rounded-lg text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title={t.logout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowAuthModal(true); playAlertSound("click"); }}
                  className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:opacity-90 text-white font-extrabold py-1.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.login}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Responsive, Animated 2026 Layout Shell */}
      <div className="flex relative">
        {/* Mobile Sidebar Overlay Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            style={{ top: "calc(62px + 32px)" }}
            onClick={() => { setSidebarOpen(false); playAlertSound("click"); }}
          />
        )}

        {/* Sliding Sidebar Container */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`bg-[#0B1519] text-white border-slate-800 flex flex-col justify-between print:hidden z-30 shadow-2xl h-[calc(100vh-62px)] sticky top-[62px] 
                ${lang === "ar" ? "border-l right-0" : "border-r left-0"} 
                absolute md:relative shrink-0 overflow-hidden`}
            >
              {/* Sidebar Navigation Options */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar text-right">
            {navGroups.map((group, gIdx) => {
              if (group.showGroup === false) return null;
              
              const visibleItems = group.items.filter((item) => item.show);
              if (visibleItems.length === 0 && gIdx === 2 && currentUser) return null; // Handle empty management group edge case
              
              return (
                <div key={gIdx} className="space-y-1">
                  <div className={`px-2 pb-2 pt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider ${gIdx !== 0 ? 'border-t border-slate-800/50' : ''}`}>
                    {group.title}
                  </div>
                  
                  {visibleItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as any); playAlertSound("click"); if (window.innerWidth < 768) setSidebarOpen(false); }}
                        className={`group relative w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 font-extrabold text-xs cursor-pointer overflow-hidden ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-950 to-emerald-900 border border-emerald-800/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                            : "border border-transparent hover:bg-slate-800/80 hover:border-slate-700 hover:shadow-lg"
                        }`}
                      >
                        {/* Active Glow indicator */}
                        {isActive && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981] shadow-[0_0_10px_#10B981]"></div>
                        )}
                        
                        {/* Hover Glow effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out`}></div>

                        <span className="flex items-center gap-2.5 flex-row-reverse w-full relative z-10">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isActive 
                              ? `${item.bgColor} ${item.colorClass} shadow-inner` 
                              : `bg-slate-900/80 text-slate-400 group-hover:${item.bgColor} group-hover:${item.colorClass} group-hover:scale-110`
                          }`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className={`transition-all duration-300 group-hover:text-white ${isActive ? "text-[#10B981]" : "text-slate-300 group-hover:-translate-x-1"}`}>
                            {item.label}
                          </span>
                        </span>
                      </button>
                    );
                  })}

                  {/* Special case: Inject Login Button for unauthenticated users in the Management group */}
                  {gIdx === 2 && !currentUser && (
                    <button
                      onClick={() => { setShowAuthModal(true); playAlertSound("click"); }}
                      className="group relative w-full flex items-center gap-2.5 flex-row-reverse p-2.5 rounded-xl text-xs font-extrabold text-gray-400 hover:bg-slate-800/80 hover:border-slate-700 hover:text-white hover:shadow-lg border border-transparent transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out`}></div>
                      <span className="w-7 h-7 rounded-xl bg-slate-900/80 group-hover:bg-slate-800 group-hover:scale-110 transition-all duration-300 flex items-center justify-center shrink-0 relative z-10">
                        <LogIn className="w-4 h-4" />
                      </span>
                      <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1">{lang === "ar" ? "تسجيل الدخول للنظام" : "System Login"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800 space-y-2 text-[10px] text-gray-500 font-mono text-center w-64">
            <div>SECURITY ACCESS: SECURE</div>
            <div>TAKAFUL WEB 2026.3</div>
          </div>
        </motion.aside>
        )}
        </AnimatePresence>

        {/* Content Box with Modern 2026 glass-feeling design */}
        <div className="flex-1 min-h-[calc(100vh-62px)] overflow-y-auto overflow-x-hidden relative">
          {/* Main body content container */}
          <main className="max-w-6xl mx-auto px-4 py-8 min-h-[70vh]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
        <Suspense fallback={<div className="flex justify-center items-center h-64 text-emerald-600 animate-pulse font-bold">جاري تحميل المكونات...</div>}><Routes location={location} >
        <Route path="/" element={
          <LandingView
            cases={cases}
            projects={projects}
            funds={funds}
            onSubmitReport={handleSubmitCommunityReport}
            onNavigateToDonor={() => setActiveTab("donation")}
            onNavigateToTab={setActiveTab}
            visitorsCount={visitorsCount}
            onlineUsersCount={onlineUsersCount}
            registeredUsersCount={users.length}
          />
        } />
        <Route path="/workspace" element={
          <WorkspaceIntegration user={currentUser} lang={lang} cases={cases} />
        } />
        <Route path="/cases" element={
          <IntakePortal
            user={currentUser}
            cases={cases}
            onRegisterCase={handleRegisterCase}
            onUpdateFamily={handleUpdateFamily}
            onDeleteCase={handleDeleteCase}
            onUpdateCase={handleUpdateCase}
          />
        } />

        <Route path="/infrastructure" element={
          <InfrastructurePortal
            user={currentUser}
            projects={projects}
            onDonateToProject={async (projId, amount) => {
              await handleDonate({
                donorId: currentUser?.id || null,
                donorNameOverride: currentUser?.fullName || "متبرع فاعل خير",
                projectId: projId,
                fundType: "صدقة_جارية",
                amount: amount,
                currency: "LYD",
                paymentMethod: "بوابة البنية التحتية"
              });
            }}
            onRefreshData={loadData}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
          />
        } />

        <Route path="/map" element={
          <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">{lang === "ar" ? "جاري تحميل الخريطة التفاعلية..." : "Loading Interactive Map..."}</div>}>
            <MapsSearchPortal
              user={currentUser}
              cases={cases}
              projects={projects}
              charities={users.filter(u => u.role === 'charity')}
              onDonate={handleDonate}
              lang={lang}
            />
          </Suspense>
        } />

        <Route path="/donation" element={
          <div className="space-y-8 animate-fade-in">
            {/* Integrated high-fidelity Payment Hub */}
            <PaymentHub
              lang={lang}
              onDonateSuccess={(data) => {
                handleDonate({
                  donorId: currentUser?.id || null,
                  donorNameOverride: currentUser?.fullName || "متبرع فاعل خير",
                  fundType: data.fund,
                  amount: data.amount,
                  currency: "LYD",
                  paymentMethod: data.method
                });
              }}
            />
            {/* Live Trackers & Donor leaderboard */}
            <DonorPortal
              user={currentUser}
              cases={cases}
              projects={projects}
              onDonate={handleDonate}
              onSubmitSkill={handleSubmitSkill}
              activeGeoSOS={activeGeoSOS}
              onTriggerGeoSOS={(msg) => setActiveGeoSOS(msg)}
              lang={lang}
            />
          </div>
        } />

        <Route path="/reports" element={
          <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">{lang === "ar" ? "جاري تحميل التقارير التفاعلية..." : "Loading Interactive Reports..."}</div>}>
            <InteractiveReports
              cases={cases}
              projects={projects}
              funds={funds}
              ledger={ledger}
            />
          </Suspense>
        } />

        <Route path="/printing" element={
          <OfficialPrintCenter
            cases={cases}
            projects={projects}
            ledger={ledger}
          />
        } />

        <Route path="/security" element={
          <SecurityAuditVault
            cases={cases}
            projects={projects}
            ledger={ledger}
            users={users}
            lang={lang}
          />
        } />

        <Route path="/verify" element={
          <PublicVerifyPortal
            cases={cases}
            reports={reports}
            users={users}
            onAddReport={(newReport) => setReports((prev) => [newReport, ...prev])}
          />
        } />

        <Route path="/supervision" element={
          <>
            {currentUser ? (
              <div className="space-y-6">
                {/* Active Session Role Banner */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3 flex-row-reverse text-right">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <p className="font-black text-sm text-slate-100">{currentUser.fullName}</p>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                        الجلسة نشطة بصفتك: {
                          currentUser.role === "admin" ? "لجنة الإدارة والتدقيق الوطني" :
                          currentUser.role === "citizen" ? "مستفيد السجل الوطني" :
                          currentUser.role === "researcher" ? "باحث اجتماعي ميداني" :
                          currentUser.role === "evaluation_committee" ? "عضو لجنة التقييم المحايدة" :
                          currentUser.role === "finance_manager" ? "المدير المالي للصندوق" :
                          "جمعية شريكة معتمدة"
                        } ({currentUser.email})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 flex-row-reverse"
                  >
                    <span>تسجيل الخروج والانتقال لدور آخر</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Render Portal Component */}
                {currentUser.role === "citizen" && (
                  <CitizenPortal
                    user={currentUser}
                    citizenCase={citizenCase}
                    onRegisterCase={handleRegisterCase}
                    onUpdateFamily={handleUpdateFamily}
                  />
                )}
                {currentUser.role === "researcher" && (
                  <ResearcherPortal
                    user={currentUser}
                    cases={cases}
                    onSubmitVisit={handleSubmitVisitReport}
                  />
                )}
                {currentUser.role === "charity" && (
                  <CharityPortal
                    user={currentUser}
                    cases={cases}
                    funds={funds}
                    onAdoptCase={handleAdoptCaseByCharity}
                    onDisburseCase={handleDisburseCaseByCharity}
                  />
                )}
                {currentUser.role === "volunteer" && (
                  <VolunteerPortal
                    user={currentUser}
                    cases={cases}
                  />
                )}
                {(currentUser.role === "admin" || currentUser.role === "evaluation_committee" || currentUser.role === "finance_manager") && (
                  <AdminPortal
                    user={currentUser}
                    cases={cases}
                    projects={projects}
                    ledger={ledger}
                    funds={funds}
                    reports={reports}
                    users={users}
                    onApproveCase={handleApproveCaseByAdmin}
                    onRejectCase={handleRejectCaseByAdmin}
                    onUpdateCaseBudget={handleUpdateCaseBudgetByAdmin}
                    onApproveProject={handleApproveProjectByAdmin}
                    onRejectProject={handleRejectProjectByAdmin}
                    onUpdateProjectBudget={handleUpdateProjectBudgetByAdmin}
                    onUpdateReportStatus={handleUpdateReportStatus}
                    onTriggerGeoSOS={(msg) => setActiveGeoSOS(msg)}
                    lang={lang}
                    isRefreshPaused={isRefreshPaused}
                    onToggleRefresh={() => setIsRefreshPaused((prev) => !prev)}
                    lastUpdated={lastRefreshedAt}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in text-right">
                {/* Welcoming Gate Header */}
                <div className="max-w-2xl mx-auto text-center space-y-2">
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 uppercase">
                    بوابة الإشراف والحوكمة الموحدة
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">السجل الوطني الشامل للتدقيق والمتابعة</h2>
                  <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                    منصة حوكمة التمكين والمساعدات الميدانية. اختر رتبة الدخول لتصفح المهام، تقديم المعاملات، أو مطابقة قيود الدفتر المالي المزدوج والمتابعة الميدانية.
                  </p>
                </div>

                {/* Grid of Portals */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  
                  {/* Card 1: Field Inspector */}
                  <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl flex flex-col justify-between hover:border-emerald-600/30 transition-all shadow-sm">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center text-lg shadow-sm">
                        📋
                      </div>
                      <h3 className="font-black text-slate-800 text-sm">بوابة الباحثين والمدققين الميدانيين</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        إجراء التقييمات العشرية السرية الميدانية للتحقق من أهليّة الأسر، رفع الصور الموثقة لحالة المبنى مجرّدة GPS لحفظ حرمة المنازل.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-row-reverse pt-4 border-t border-slate-50">
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer"
                      >
                        بوابة المفتشين المعتمدة
                      </button>
                      
                    </div>
                  </div>

                  {/* Card 2: Charities */}
                  <div className="bg-white border border-[#E5E3DA] p-6 rounded-3xl flex flex-col justify-between hover:border-emerald-600/30 transition-all shadow-sm">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center text-lg shadow-sm">
                        🏢
                      </div>
                      <h3 className="font-black text-slate-800 text-sm">بوابة الجمعيات والمؤسسات الشريكة</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        صرف المخصصات المالية والعينية والطبية للجمعيات الأهلية المعتمدة وطنياً، وتبني الحالات الإنسانية المعتمدة من الهيئة مباشرة.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-row-reverse pt-4 border-t border-slate-50">
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer"
                      >
                        بوابة الجمعيات الشريكة
                      </button>
                      
                    </div>
                  </div>

                  {/* Card 3: Administrative Board */}
                  <div className="bg-white border border-rose-100 p-6 rounded-3xl flex flex-col justify-between hover:border-rose-600/30 transition-all shadow-sm ring-1 ring-rose-50/50">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center text-lg shadow-sm">
                        🛡️
                      </div>
                      <h3 className="font-black text-slate-800 text-sm">مجلس الإدارة العليا وهيئة التدقيق المالي</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        مفتشي ديوان المحاسبة واللجنة الإدارية العليا: اعتماد الملفات الحيوية، مكافحة الاحتيال، مراجعة الدفتر المالي المزدوج، وإرسال تنبيهات الطوارئ الجغرافية SOS.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-row-reverse pt-4 border-t border-slate-50">
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer"
                      >
                        بوابة الهيئة الرقابية
                      </button>
                      
                    </div>
                  </div>

                </div>

                {/* Visual Security Notice */}
                <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-100 p-5 rounded-3xl flex items-start gap-3 flex-row-reverse text-xs leading-relaxed text-slate-600">
                  <span className="text-xl">🔒</span>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">بروتوكول الأمان الموحد (TLS-Takaful SEC)</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      يتم تشفير كافة المدخلات الهوياتية والأرقام الوطنية حيوياً بمستوى أمان عالي. لا يتم تداول بيانات الإحداثيات والصور للباحث الميداني إلا بصلاحيات معتمدة من ديوان المحاسبة لضمان أقصى كفاءة للمنظومة التكافلية.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </>
        } />
        </Routes></Suspense>
              </motion.div>
            </AnimatePresence>
      </main>

      {/* General Footer */}
      <footer className="bg-[#2C2C2A] text-white py-12 mt-12 border-t border-[#E5E3DA] text-xs">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <div className="space-y-3">
            <span className="text-sm font-black text-emerald-400">منصة التكافل الوطني الذكية</span>
            <p className="text-gray-400 leading-relaxed font-light text-[11px]">
              سجل وطني شامل موحد لإدارة المساعدات الاجتماعية والتمكين والتحقق الميداني الموثق. تم البناء والتصميم وفق نموذج متكامل من النزاهة والعدالة الشرعية والمالية.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-bold text-gray-200">دليل النزاهة ومكافحة الاحتيال</span>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              نحن نلتزم بالتحقق الميداني العشري ومطابقة القيود المحاسبية عبر دفتر الأستاذ العام وتجريد الصور من بيانات GPS لسلامة الخصوصية.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-bold text-gray-200">تواصل معنا</span>
            <p className="text-gray-400 text-[11px]">البريد الإلكتروني: info@takaful.ly | الدعم الفني: 191</p>
            <p className="text-emerald-400 text-[10px] font-mono">© 2026 NATIONAL TAKAFUL PLATFORM V2. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

        </div>
      </div>

      {/* Secure registration and login dialogue */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          lang={lang}
        />
      )}

      {showProfileModal && currentUser && (
        <ProfileModal
          user={currentUser}
          sessionToken={sessionToken}
          onClose={() => setShowProfileModal(false)}
          onUserUpdate={(u) => {
            setCurrentUser(u);
            const lsStateStr = localStorage.getItem("takaful_state");
            if (lsStateStr) {
               const lsState = JSON.parse(lsStateStr);
               lsState.currentUser = u;
               localStorage.setItem("takaful_state", JSON.stringify(lsState));
            }
          }}
        />
      )}

    </div>
  );
}
