const fs = require('fs');

const content = `import React, { useState, useEffect } from "react";
import { User, Case } from "../types";
import { Folder, Calendar, Mail, CheckSquare, MessageSquare, Plus, RefreshCw, AlertCircle, Check, Shield, Globe, LayoutDashboard, FileSpreadsheet, Send, Users, FileText, Bell, Database } from "lucide-react";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase Auth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Requesting scopes for Workspace Integration
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/chat.spaces');
provider.addScope('https://www.googleapis.com/auth/chat.messages');

interface WorkspaceIntegrationProps {
  user: User | null;
  cases?: Case[];
  lang?: string;
}

export default function WorkspaceIntegration({ user, cases = [], lang = "ar" }: WorkspaceIntegrationProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"drive" | "calendar" | "gmail" | "tasks" | "chat">("drive");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // In this demo, user clicks login
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setToken(null);
  };

  const executeGoogleApiAction = async (actionId: string, actionFn: (accessToken: string) => Promise<void>, successMessage: string) => {
    if (!token) return;
    
    const confirmed = window.confirm("هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟\\nسيتم استخدام حساب Google Workspace الخاص بك لتعديل أو إضافة بيانات.");
    if (!confirmed) return;

    setLoadingAction(actionId);
    setActionSuccess(null);
    try {
      await actionFn(token);
      setActionSuccess(successMessage);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (error: any) {
      console.error("API Action Failed", error);
      alert("حدث خطأ أثناء تنفيذ الإجراء. يرجى التحقق من الصلاحيات.");
    } finally {
      setLoadingAction(null);
    }
  };

  // --- DRIVE ACTIONS ---
  const createDriveFolder = async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'تقارير منصة التكافل - ' + new Date().getFullYear(), mimeType: 'application/vnd.google-apps.folder' })
    });
    if (!res.ok) throw new Error("Drive API failed");
  };

  const exportCasesCSV = async (accessToken: string) => {
    const csvContent = "رقم الملف,النوع,الموقع,الحالة\\n" + cases.map(c => \`\${c.caseNumber},\${c.needTypes.join(' | ')},\${c.municipality},\${c.status}\`).join("\\n");
    const metadata = { name: \`تصدير_الحالات_\${new Date().toLocaleDateString('ar-SA')}.csv\`, mimeType: 'text/csv' };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([csvContent], { type: 'text/csv' }));
    
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\` },
      body: form
    });
    if (!res.ok) throw new Error("Drive API Export failed");
  };

  const generateAuditReport = async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'تقرير تدقيق أمني وإحصائي - ' + new Date().toLocaleDateString('ar-SA'), mimeType: 'application/vnd.google-apps.document' })
    });
    if (!res.ok) throw new Error("Drive API failed");
  };

  // --- CALENDAR ACTIONS ---
  const createCalendarEvent = async (accessToken: string) => {
    const startTime = new Date(); startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'مراجعة طلبات الإسكان والآبار العاجلة', description: 'اجتماع مجدول لمراجعة الحالات الإنسانية المرفوعة على منصة التكافل.', start: { dateTime: startTime.toISOString() }, end: { dateTime: endTime.toISOString() }, colorId: '5' })
    });
    if (!res.ok) throw new Error("Calendar API failed");
  };

  const scheduleFieldVisit = async (accessToken: string) => {
    const startTime = new Date(); startTime.setDate(startTime.getDate() + 1); startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'زيارة ميدانية لفريق البحث', description: 'زيارة تفقدية للحالات قيد المراجعة في المنطقة المحددة.', start: { dateTime: startTime.toISOString() }, end: { dateTime: endTime.toISOString() }, colorId: '11' })
    });
    if (!res.ok) throw new Error("Calendar API failed");
  };

  const setupWeeklyCommittee = async (accessToken: string) => {
    const startTime = new Date(); startTime.setDate(startTime.getDate() + (4 - startTime.getDay() + 7) % 7); // Next Thursday
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'اجتماع اللجنة العليا للتكافل', description: 'اجتماع دوري لمراجعة الاعتمادات والتدقيق المالي.', start: { dateTime: startTime.toISOString() }, end: { dateTime: endTime.toISOString() }, recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TH'], colorId: '8' })
    });
    if (!res.ok) throw new Error("Calendar API failed");
  };

  // --- GMAIL ACTIONS ---
  const sendEmailDraft = async (accessToken: string, subject: string, bodyContent: string) => {
    const message = [\`To: info@charity-takaful.org\`,\`Subject: \${subject}\`,'',\`\${bodyContent}\`].join('\\n');
    const encodedEmail = btoa(unescape(encodeURIComponent(message))).replace(/\\+/g, '-').replace(/\\//g, '_');
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { raw: encodedEmail } })
    });
    if (!res.ok) throw new Error("Gmail API failed");
  };

  // --- TASKS ACTIONS ---
  const syncCasesToTasks = async (accessToken: string) => {
    const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'مهام منصة التكافل - ' + new Date().toLocaleDateString('ar-SA') })
    });
    if (!listRes.ok) throw new Error("Tasks API failed to create list");
    const listData = await listRes.json();
    const taskListId = listData.id;

    const pendingCases = cases.filter(c => c.status === 'submitted' || c.status === 'under_review');
    if (pendingCases.length === 0) throw new Error("لا توجد مهام معلقة لمزامنتها حالياً");

    for (const c of pendingCases.slice(0, 5)) { // limit to 5 for demo
      await fetch(\`https://tasks.googleapis.com/tasks/v1/lists/\${taskListId}/tasks\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: \`متابعة ملف رقم: \${c.caseNumber}\`, notes: \`الاحتياج: \${c.needTypes.join(' - ')}\\nالموقع: \${c.municipality}\\nالوصف: \${c.description}\` })
      });
      await new Promise(res => setTimeout(res, 300));
    }
  };

  const createAuditTaskList = async (accessToken: string) => {
    const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'مهام التدقيق المالي والأمني' })
    });
    if (!res.ok) throw new Error("Tasks API failed");
  };

  // --- CHAT ACTIONS ---
  const createChatSpace = async (accessToken: string, spaceName: string) => {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ spaceType: 'SPACE', displayName: spaceName })
    });
    if (!res.ok) throw new Error("Chat API failed");
  };


  if (!token) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-1 bg-gradient-to-br from-[#4285F4]/20 via-[#EA4335]/10 to-[#34A853]/20 rounded-[2rem] shadow-2xl animate-fade-in">
        <div className="bg-white rounded-[1.9rem] p-12 text-center h-full">
          <div className="flex justify-center mb-6 space-x-2 space-x-reverse">
            <div className="w-4 h-4 rounded-full bg-[#4285F4]"></div>
            <div className="w-4 h-4 rounded-full bg-[#EA4335]"></div>
            <div className="w-4 h-4 rounded-full bg-[#FBBC05]"></div>
            <div className="w-4 h-4 rounded-full bg-[#34A853]"></div>
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Google Workspace</h2>
          <p className="text-base text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto">
            قم بتسجيل الدخول لربط حساب جوجل الخاص بك وإدارة المهام والتقارير والاجتماعات بشكل آلي ومتكامل عبر تطبيقات جوجل السحابية.
          </p>
          
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="group relative bg-white border border-[#dadce0] text-[#3c4043] font-medium py-3 px-8 rounded-full shadow-sm hover:bg-[#f8f9fa] hover:shadow-md transition-all flex items-center justify-center gap-4 mx-auto overflow-hidden"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 relative z-10" />
            <span className="relative z-10">{isLoggingIn ? "جاري الاتصال بالسحابة..." : "تسجيل الدخول باستخدام Google Workspace"}</span>
            <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
          
          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center gap-6 opacity-60">
            <Folder className="w-6 h-6 text-[#4285F4]" />
            <Calendar className="w-6 h-6 text-[#4285F4]" />
            <Mail className="w-6 h-6 text-[#EA4335]" />
            <CheckSquare className="w-6 h-6 text-[#4285F4]" />
            <MessageSquare className="w-6 h-6 text-[#34A853]" />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'drive', label: 'جوجل درايف', icon: Folder, color: 'text-[#4285F4]', bgHover: 'hover:bg-[#4285F4]/10', activeBg: 'bg-[#4285F4]/10 border-[#4285F4]/30' },
    { id: 'calendar', label: 'التقويم الذكي', icon: Calendar, color: 'text-[#4285F4]', bgHover: 'hover:bg-[#4285F4]/10', activeBg: 'bg-[#4285F4]/10 border-[#4285F4]/30' },
    { id: 'gmail', label: 'جيميل و المراسلات', icon: Mail, color: 'text-[#EA4335]', bgHover: 'hover:bg-[#EA4335]/10', activeBg: 'bg-[#EA4335]/10 border-[#EA4335]/30' },
    { id: 'tasks', label: 'إدارة المهام', icon: CheckSquare, color: 'text-[#4285F4]', bgHover: 'hover:bg-[#4285F4]/10', activeBg: 'bg-[#4285F4]/10 border-[#4285F4]/30' },
    { id: 'chat', label: 'غرف المحادثة', icon: MessageSquare, color: 'text-[#34A853]', bgHover: 'hover:bg-[#34A853]/10', activeBg: 'bg-[#34A853]/10 border-[#34A853]/30' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner shrink-0">
               <img src="https://www.google.com/favicon.ico" alt="Google" className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">تكامل مساحة العمل (Google Workspace)</h2>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                <Shield className="w-3.5 h-3.5 text-[#34A853]" />
                الجلسة متصلة و موثقة بنجاح - بصلاحيات كاملة
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-full transition-colors flex items-center gap-2 shrink-0"
          >
            إنهاء الجلسة الآمنة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-4 border border-slate-200 shadow-sm h-fit">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={\`w-full px-4 py-3.5 rounded-2xl text-sm font-extrabold flex items-center gap-3 transition-all duration-300 border border-transparent \${isActive ? \`\${tab.activeBg} \${tab.color} shadow-sm\` : \`text-slate-600 \${tab.bgHover}\`}\`}
                >
                  <Icon className={\`w-5 h-5 \${isActive ? tab.color : 'text-slate-400'}\`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[500px]">
          {actionSuccess && (
            <div className="mb-8 flex items-center gap-3 bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/20 px-5 py-4 rounded-2xl text-sm font-bold animate-fade-in shadow-sm">
              <div className="bg-[#34A853] rounded-full p-1 text-white"><Check className="w-3 h-3" /></div>
              {actionSuccess}
            </div>
          )}

          <div className="h-full w-full py-2">
            {activeTab === "drive" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#4285F4]/10 rounded-2xl flex items-center justify-center border border-[#4285F4]/20">
                    <Folder className="w-8 h-8 text-[#4285F4]" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-slate-800">أرشفة وإدارة الملفات (Drive)</h3>
                    <p className="text-slate-500 font-medium mt-1">تصدير التقارير وإنشاء الهياكل التنظيمية السحابية للمؤسسة.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <Folder className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">هيكل المجلدات السنوي</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">إنشاء مجلد رئيسي لتوثيق أعمال سنة {new Date().getFullYear()} يتضمن أرشيف الصناديق والمشاريع.</p>
                    <button onClick={() => executeGoogleApiAction('create_folder', createDriveFolder, "تم إنشاء المجلد في درايف بنجاح")} disabled={loadingAction !== null} className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loadingAction === 'create_folder' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} إنشاء المجلد
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <FileSpreadsheet className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">تصدير بيانات الحالات</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">إنشاء ملف CSV يحتوي على جميع الحالات المعلقة والمكتملة ورفعه إلى مساحة العمل الخاصة بك.</p>
                    <button onClick={() => executeGoogleApiAction('export_csv', exportCasesCSV, "تم تصدير ملف CSV وحفظه في درايف")} disabled={loadingAction !== null} className="w-full bg-[#4285F4] text-white font-bold py-2.5 rounded-xl hover:bg-[#3367d6] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-sm">
                      {loadingAction === 'export_csv' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} بدء التصدير (CSV)
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50 md:col-span-2">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <FileText className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">تقرير التدقيق والشفافية (Google Docs)</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">إنشاء مستند جديد لتدوين ملاحظات التدقيق الأمني والمالي، ومشاركته مع فريق الإدارة العليا.</p>
                    <button onClick={() => executeGoogleApiAction('audit_doc', generateAuditReport, "تم إنشاء مستند تقرير التدقيق بنجاح")} disabled={loadingAction !== null} className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loadingAction === 'audit_doc' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} توليد المستند 
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#4285F4]/10 rounded-2xl flex items-center justify-center border border-[#4285F4]/20">
                    <Calendar className="w-8 h-8 text-[#4285F4]" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-slate-800">التقويم والجدولة (Calendar)</h3>
                    <p className="text-slate-500 font-medium mt-1">تنسيق الاجتماعات والزيارات الميدانية لفرق المنصة.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <Users className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">لجنة المراجعة العاجلة</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">جدولة اجتماع طارئ خلال ساعة لمراجعة طلبات الإسكان والآبار العاجلة.</p>
                    <button onClick={() => executeGoogleApiAction('cal_urgent', createCalendarEvent, "تم إضافة الحدث للتقويم بنجاح")} disabled={loadingAction !== null} className="w-full bg-rose-50 border border-rose-200 text-rose-700 font-bold py-2.5 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loadingAction === 'cal_urgent' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />} حجز موعد عاجل
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <Globe className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">زيارة ميدانية لفريق البحث</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">جدولة زيارة تفقدية للحالات قيد المراجعة، لليوم التالي في الفترة الصباحية.</p>
                    <button onClick={() => executeGoogleApiAction('cal_field', scheduleFieldVisit, "تم حجز الزيارة الميدانية")} disabled={loadingAction !== null} className="w-full bg-[#4285F4] text-white font-bold py-2.5 rounded-xl hover:bg-[#3367d6] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-sm">
                      {loadingAction === 'cal_field' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} جدولة زيارة 
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50 md:col-span-2">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <LayoutDashboard className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">اجتماع اللجنة العليا الأسبوعي</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">برمجة اجتماع دوري يتكرر أسبوعياً (يوم الخميس) لمراجعة الاعتمادات النهائية والتدقيق المالي للمنصة.</p>
                    <button onClick={() => executeGoogleApiAction('cal_weekly', setupWeeklyCommittee, "تم إعداد الاجتماع الدوري")} disabled={loadingAction !== null} className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loadingAction === 'cal_weekly' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} إعداد سلسلة الاجتماعات 
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gmail" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#EA4335]/10 rounded-2xl flex items-center justify-center border border-[#EA4335]/20">
                    <Mail className="w-8 h-8 text-[#EA4335]" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-slate-800">المراسلات البريدية (Gmail)</h3>
                    <p className="text-slate-500 font-medium mt-1">توليد الرسائل وتوجيه البلاغات للمستفيدين والمانحين.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#EA4335]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#EA4335]">
                      <Bell className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">تنبيه عاجل للشركاء</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">إنشاء مسودة بريد إلكتروني عاجل لإعلام الجمعيات بحالات الإسكان والآبار الطارئة.</p>
                    <button onClick={() => executeGoogleApiAction('mail_urgent', (t) => sendEmailDraft(t, 'تحديثات حالات منصة التكافل - المهام العاجلة', 'نود إعلامكم بوجود حالات جديدة للإسكان والآبار تتطلب مراجعة واعتماد عاجل.'), "تم إنشاء مسودة البريد في جيميل")} disabled={loadingAction !== null} className="w-full bg-rose-50 border border-rose-200 text-rose-700 font-bold py-2.5 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loadingAction === 'mail_urgent' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} مسودة تنبيه 
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#EA4335]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#EA4335]">
                      <FileText className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">نشرة دورية للمانحين</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">إعداد مسودة نشرة أخبار الإنجازات الأسبوعية وتطور العمل في المشاريع الخيرية.</p>
                    <button onClick={() => executeGoogleApiAction('mail_newsletter', (t) => sendEmailDraft(t, 'نشرة التكافل: إنجازات هذا الأسبوع', 'يسرنا إطلاعكم على أحدث المشاريع التي اكتملت هذا الأسبوع بفضل دعمكم...'), "تم إنشاء مسودة النشرة في جيميل")} disabled={loadingAction !== null} className="w-full bg-[#EA4335] text-white font-bold py-2.5 rounded-xl hover:bg-[#d33426] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-sm">
                      {loadingAction === 'mail_newsletter' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} مسودة النشرة 
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#4285F4]/10 rounded-2xl flex items-center justify-center border border-[#4285F4]/20">
                    <CheckSquare className="w-8 h-8 text-[#4285F4]" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-slate-800">إدارة قوائم المهام (Tasks)</h3>
                    <p className="text-slate-500 font-medium mt-1">ربط الحالات الميدانية بمهام قابلة للتتبع والتنفيذ.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <RefreshCw className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">مزامنة الحالات كمهام</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">تصدير الحالات المعلقة (قيد المراجعة) كقائمة مهام جديدة في Google Tasks لسهولة المتابعة الفردية.</p>
                    <button onClick={() => executeGoogleApiAction('task_sync', syncCasesToTasks, "تم مزامنة الحالات وتصديرها كمهام بنجاح")} disabled={loadingAction !== null} className="w-full bg-[#4285F4] text-white font-bold py-2.5 rounded-xl hover:bg-[#3367d6] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-sm">
                      {loadingAction === 'task_sync' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />} بدء المزامنة
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#4285F4]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#4285F4]">
                      <Shield className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">قائمة التدقيق الأمني</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">إنشاء قائمة مهام مخصصة لفريق التدقيق الداخلي لمراجعة الإجراءات ومطابقتها للمعايير.</p>
                    <button onClick={() => executeGoogleApiAction('task_audit', createAuditTaskList, "تم إنشاء قائمة التدقيق في Tasks")} disabled={loadingAction !== null} className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loadingAction === 'task_audit' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} إنشاء قائمة التدقيق
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#34A853]/10 rounded-2xl flex items-center justify-center border border-[#34A853]/20">
                    <MessageSquare className="w-8 h-8 text-[#34A853]" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-slate-800">تنسيق فرق العمل (Chat)</h3>
                    <p className="text-slate-500 font-medium mt-1">تأسيس قنوات تواصل سريعة وفعالة للفرق الميدانية والمكتبية.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#34A853]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#34A853]">
                      <AlertCircle className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">غرفة عمليات الطوارئ</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">تأسيس مساحة دردشة جديدة مخصصة للاستجابة السريعة لحالات الكوارث أو الطوارئ الحرجة.</p>
                    <button onClick={() => executeGoogleApiAction('chat_emergency', (t) => createChatSpace(t, 'غرفة عمليات طوارئ التكافل'), "تم إنشاء مساحة الطوارئ بنجاح")} disabled={loadingAction !== null} className="w-full bg-rose-50 border border-rose-200 text-rose-700 font-bold py-2.5 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loadingAction === 'chat_emergency' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} تأسيس غرفة الطوارئ
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#34A853]/30 hover:shadow-md transition-all bg-slate-50">
                    <div className="flex items-center gap-3 mb-3 text-[#34A853]">
                      <Users className="w-5 h-5" />
                      <h4 className="font-bold text-slate-800">تنسيق المتطوعين</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">إنشاء مساحة تواصل عامة لتنظيم جهود المتطوعين وتوزيع مهام التوزيع الميداني.</p>
                    <button onClick={() => executeGoogleApiAction('chat_volunteers', (t) => createChatSpace(t, 'تنسيق المتطوعين - التكافل'), "تم إنشاء مساحة المتطوعين بنجاح")} disabled={loadingAction !== null} className="w-full bg-[#34A853] text-white font-bold py-2.5 rounded-xl hover:bg-[#2d9147] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-sm">
                      {loadingAction === 'chat_volunteers' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} مساحة المتطوعين
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/components/WorkspaceIntegration.tsx', content);
