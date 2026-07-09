import { playAlertSound as playAlertSoundUtil } from "./utils/audio";
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, Case, MajorProject, Fund, LedgerEntry, CommunityReport, OmniTransaction, Family, AppNotification, NotificationPreferences } from "./types";
const ZakatCalculator = lazy(() => import("./components/ZakatCalculator"));
const GamificationDashboard = lazy(() => import("./components/GamificationDashboard"));
const AIChatbot = lazy(() => import("./components/AIChatbot"));
const BlockchainExplorer = lazy(() => import("./components/BlockchainExplorer"));
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
const MedicalPortal = lazy(() => import("./components/MedicalPortal"));
const OfficialPrintCenter = lazy(() => import("./components/OfficialPrintCenter"));
const SecurityAuditVault = lazy(() => import("./components/SecurityAuditVault"));
const PublicVerifyPortal = lazy(() => import("./components/PublicVerifyPortal"));

const MapsSearchPortal = lazy(() => import("./components/MapsSearchPortal"));
const InteractiveReports = lazy(() => import("./components/InteractiveReports"));
const WorkspaceIntegration = lazy(() => import("./components/WorkspaceIntegration"));
import { translations, Language } from "./translations";
import { Bell, Volume2, VolumeX, CheckCheck, Globe, LogOut, LogIn, AlertCircle, Settings, ShieldAlert, CreditCard, Coins, Check, HelpCircle, ShieldCheck, ArrowLeft, ArrowRight, UserCheck, MapPin, Radio, Activity, HeartPulse, RefreshCw, Menu, X, Sun, Moon, Home, Heart, Building2, Map, Printer, FileText, Star, Database } from "lucide-react";
import UsersManagement from "./components/UsersManagement";
import UserProfile from "./components/UserProfile";

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
          title: "تبرع مالي جديد تم إثباته بالتوقيع العشري 💎",
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

    const handleTriggerGeoSOS = (muni: string) => {
    setActiveGeoSOS(muni);
    playAlertSound("notification");
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
        { id: "zakat", label: lang === "ar" ? "حاسبة الزكاة الذكية" : "Zakat Calculator", icon: Coins, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: true },
        { id: "gamification", label: lang === "ar" ? "لوحة التميز والتأثير" : "Gamification", icon: Star, Database, colorClass: "text-yellow-500", bgColor: "bg-yellow-500/20", show: true },
        { id: "blockchain", label: lang === "ar" ? "مستكشف كتل التكافل" : "Blockchain Explorer", icon: Database, colorClass: "text-indigo-500", bgColor: "bg-indigo-500/20", show: true },
        { id: "verify", label: lang === "ar" ? "التحقق ومكافحة الاحتيال" : "Public Verify", icon: ShieldCheck, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: featureFlags.module_verify !== false },
        { id: "reports", label: t.navReports || "التقارير والمؤشرات", icon: FileText, colorClass: "text-yellow-500", bgColor: "bg-yellow-500/20", show: featureFlags.module_reports !== false },
      ]
    },
    {
      title: lang === "ar" ? "العمليات والميدان" : "Field & GIS",
      showGroup: true,
      items: [
        { id: "map", label: t.navMapsSearch || "الخرائط والبحث", icon: Map, colorClass: "text-sky-500", bgColor: "bg-sky-500/20", show: featureFlags.module_map !== false },
        { id: "intake", label: lang === "ar" ? "بوابة التمكين وتسجيل حالة" : "Apply for Help", icon: UserCheck, colorClass: "text-indigo-500", bgColor: "bg-indigo-500/20", show: !currentUser },
        { id: "cases", label: t.navAddBeneficiary || "الحالات الميدانية", icon: Heart, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: !!currentUser && ["admin", "researcher", "charity", "field_coordinator"].includes(currentUser.role) },
        { id: "infrastructure", label: t.navHospitalsSchools || "المشاريع الكبرى", icon: Building2, colorClass: "text-indigo-500", bgColor: "bg-indigo-500/20", show: featureFlags.module_projects !== false },
        { id: "medical", label: lang === "ar" ? "القطاع الصحي والعلاجي" : "Health & Medical", icon: HeartPulse, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: true },
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
        { id: "admin/cases", label: "الطلبات والموافقات", icon: FileText, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
        { id: "admin/projects", label: "اعتماد المشاريع", icon: Building2, colorClass: "text-blue-500", bgColor: "bg-blue-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
        { id: "admin/funds", label: "إدارة الصناديق", icon: Coins, colorClass: "text-amber-500", bgColor: "bg-amber-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
        { id: "admin/geosos", label: "نداء الطوارئ الميداني", icon: Radio, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
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
                              {n.type === "donation" ? "💎" : n.type === "assignment" ? "📋" : n.type === "mention" ? "💬" : "🚨"}
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
          {activeTab === "zakat" && <ZakatCalculator lang={lang} t={translations[lang]} theme={theme} />}
          {activeTab === "gamification" && <GamificationDashboard lang={lang} theme={theme} />}
          <AIChatbot lang={lang} theme={theme} />
          {activeTab === "blockchain" && <BlockchainExplorer lang={lang} theme={theme} />}
          {activeTab === "home" && (
            <LandingView
              cases={cases}
              projects={projects}
              funds={funds}
              onSubmitReport={handleSubmitCommunityReport}
              onNavigateToDonor={() => {
                setActiveTab("donation");
                window.scrollTo(0, 0);
              }}
              onNavigateToTab={(tab) => {
                setActiveTab(tab as any);
                window.scrollTo(0, 0);
              }}
              activeGeoSOS={activeGeoSOS}
              lang={lang}
              reports={reports}
            />
          )}

          {activeTab === "intake" && (
            <IntakePortal 
              user={currentUser}
              cases={cases}
              onRegisterCase={handleRegisterCase}
              onUpdateFamily={handleUpdateFamily}
            />
          )}
          {activeTab === "donation" && (
            <DonorPortal
              user={currentUser}
              cases={cases}
              projects={projects}
              onDonate={handleDonate}
              onSubmitSkill={() => {}}
              activeGeoSOS={activeGeoSOS}
              onTriggerGeoSOS={handleTriggerGeoSOS}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "citizen" && (
            <CitizenPortal
              user={currentUser}
              citizenCase={citizenCase}
              onRegisterCase={handleRegisterCase}
              onUpdateFamily={handleUpdateFamily}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "researcher" && (
            <ResearcherPortal
              user={currentUser}
              cases={cases}
              onSubmitVisit={handleSubmitVisitReport}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "charity" && (
            <CharityPortal
              user={currentUser}
              cases={cases}
              onAdopt={handleAdoptCaseByCharity}
              onDisburse={handleDisburseCaseByCharity}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "field_coordinator" && (
            <VolunteerPortal
              user={currentUser}
              cases={cases}
            />
          )}

          {activeTab === "admin/cases" && currentUser?.role === "admin" && (
            <AdminPortal
              user={currentUser}
              users={users}
              cases={cases}
              projects={projects}
              ledger={ledger}
              funds={funds}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              onApproveCase={handleApproveCaseByAdmin}
              onRejectCase={handleRejectCaseByAdmin}
              onUpdateBudget={handleUpdateCaseBudgetByAdmin}
              onApproveProject={handleApproveProjectByAdmin}
              lang={lang}
            />
          )}
          
          {activeTab === "admin/projects" && currentUser?.role === "admin" && (
            <AdminPortal
              user={currentUser}
              users={users}
              cases={cases}
              projects={projects}
              ledger={ledger}
              funds={funds}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              onApproveCase={handleApproveCaseByAdmin}
              onRejectCase={handleRejectCaseByAdmin}
              onUpdateBudget={handleUpdateCaseBudgetByAdmin}
              onApproveProject={handleApproveProjectByAdmin}
              lang={lang}
            />
          )}

          {activeTab === "medical" && (
            <MedicalPortal lang={lang} />
          )}
          {activeTab === "infrastructure" && (
            <InfrastructurePortal
              projects={projects}
              cases={cases}
              user={currentUser}
              lang={lang}
            />
          )}

          {activeTab === "verify" && (
            <PublicVerifyPortal
              cases={cases}
              reports={reports}
              users={users}
              onAddReport={handleSubmitCommunityReport}
              lang={lang}
            />
          )}

          {activeTab === "map" && (
            <MapsSearchPortal
              cases={cases}
              projects={projects}
              charities={users.filter(u => u.role === "charity")}
              lang={lang}
              onDonate={handleDonate}
              user={currentUser}
            />
          )}

          {activeTab === "reports" && (
            <InteractiveReports
              cases={cases}
              projects={projects}
              ledger={ledger}
              funds={funds}
              lang={lang}
            />
          )}

          {activeTab === "printing" && (
            <OfficialPrintCenter
              cases={cases}
              projects={projects}
              user={currentUser}
              lang={lang}
            />
          )}

          {activeTab === "security" && currentUser?.role === "admin" && (
            <SecurityAuditVault
              cases={cases}
              projects={projects}
              ledger={ledger}
              users={users}
              lang={lang}
            />
          )}
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
