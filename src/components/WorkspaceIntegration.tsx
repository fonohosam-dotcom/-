import React, { useState, useEffect } from "react";
import { User, Case } from "../types";
import { Folder, Calendar, Mail, CheckSquare, MessageSquare, Plus, RefreshCw, AlertCircle, Check } from "lucide-react";
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
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // In this simple demo we require the user to explicitly login to get token
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

  const executeGoogleApiAction = async (actionFn: (accessToken: string) => Promise<void>, successMessage: string) => {
    if (!token) return;
    
    const confirmed = window.confirm("هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟\nسيتم استخدام حساب Google الخاص بك لتعديل أو إضافة بيانات.");
    if (!confirmed) return;

    setLoadingAction(true);
    setActionSuccess(null);
    try {
      await actionFn(token);
      setActionSuccess(successMessage);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error: any) {
      console.error("API Action Failed", error);
      alert("حدث خطأ أثناء تنفيذ الإجراء. يرجى التحقق من وحدة التحكم (Console).");
    } finally {
      setLoadingAction(false);
    }
  };

  const createDriveFolder = async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Takaful Reports Backup',
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    if (!res.ok) throw new Error("Drive API failed");
  };

  const createCalendarEvent = async (accessToken: string) => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: 'مراجعة المساعدات العاجلة - منصة التكافل',
        description: 'اجتماع مجدول لمراجعة الحالات الإنسانية العاجلة المرفوعة على منصة التكافل.',
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() }
      })
    });
    if (!res.ok) throw new Error("Calendar API failed");
  };

  const createDraftEmail = async (accessToken: string) => {
    const message = [
      'To: info@charity.org',
      'Subject: تحديثات حالات منصة التكافل',
      '',
      'مرحباً،',
      '',
      'نود إعلامكم بوجود حالات جديدة تتطلب دعمكم العاجل.',
      '',
      'فريق منصة التكافل'
    ].join('\n');
    
    // btoa is not fully safe for utf8, but enough for basic demo text
    const encodedEmail = btoa(unescape(encodeURIComponent(message))).replace(/\+/g, '-').replace(/\//g, '_');
    
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          raw: encodedEmail
        }
      })
    });
    if (!res.ok) throw new Error("Gmail API failed");
  };


  const syncCasesToTasks = async (accessToken: string) => {
    // 1. Create a task list
    const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'مهام منصة التكافل - ' + new Date().toLocaleDateString('ar-SA')
      })
    });
    if (!listRes.ok) throw new Error("Tasks API failed to create list");
    const listData = await listRes.json();
    const taskListId = listData.id;

    // 2. Identify cases to sync based on user role
    const pendingCases = cases.filter(c => {
      if (user?.role === 'researcher') return c.status === 'submitted' || c.status === 'under_review';
      if (user?.role === 'admin') return c.status === 'field_visit_done';
      return false;
    });

    if (pendingCases.length === 0) {
      throw new Error("لا توجد مهام معلقة لمزامنتها حالياً");
    }

    // 3. Add each pending case as a task
    for (const c of pendingCases) {
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `متابعة ملف رقم: ${c.caseNumber}`,
          notes: `الاحتياج: ${c.needTypes.join(' - ')}\nالموقع: ${c.municipality}\nالوصف: ${c.description}`
        })
      });
      // Small delay to prevent rate limit
      await new Promise(res => setTimeout(res, 300));
    }
  };

  const createTasksList = async (accessToken: string) => {
    const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'متابعة الحالات - منصة التكافل'
      })
    });
    if (!res.ok) throw new Error("Tasks API failed");
  };

  const createChatSpace = async (accessToken: string) => {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spaceType: 'SPACE',
        displayName: 'غرفة طوارئ التكافل'
      })
    });
    if (!res.ok) throw new Error("Chat API failed");
  };

  if (!token) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white border border-[#E5E3DA] rounded-3xl shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Folder className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">ربط خدمات جوجل وورك سبيس</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          قم بربط حساب جوجل الخاص بك لتتمكن من تصدير التقارير، جدولة الاجتماعات، وإدارة المهام مباشرة من المنصة.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-white border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 w-full max-w-sm mx-auto"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          {isLoggingIn ? "جاري تسجيل الدخول..." : "المتابعة بحساب جوجل"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white border border-[#E5E3DA] rounded-3xl shadow-sm">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="flex flex-row-reverse items-center gap-4">
          <button onClick={handleLogout} className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
            تسجيل الخروج
          </button>
          <h2 className="text-xl font-black text-slate-800">تكامل Workspace</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl flex-row-reverse">
          <button onClick={() => setActiveTab('drive')} className={`px-4 py-2 rounded-lg text-xs font-bold flex flex-row-reverse items-center gap-2 transition-colors ${activeTab === 'drive' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Folder className="w-4 h-4" /> جوجل درايف
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-lg text-xs font-bold flex flex-row-reverse items-center gap-2 transition-colors ${activeTab === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Calendar className="w-4 h-4" /> التقويم
          </button>
          <button onClick={() => setActiveTab('gmail')} className={`px-4 py-2 rounded-lg text-xs font-bold flex flex-row-reverse items-center gap-2 transition-colors ${activeTab === 'gmail' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Mail className="w-4 h-4" /> جيميل
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded-lg text-xs font-bold flex flex-row-reverse items-center gap-2 transition-colors ${activeTab === 'tasks' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}>
            <CheckSquare className="w-4 h-4" /> المهام
          </button>
          <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-lg text-xs font-bold flex flex-row-reverse items-center gap-2 transition-colors ${activeTab === 'chat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}>
            <MessageSquare className="w-4 h-4" /> محادثات
          </button>
        </div>
      </div>

      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
        {actionSuccess && (
          <div className="mb-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
            <Check className="w-4 h-4" />
            {actionSuccess}
          </div>
        )}

        {activeTab === "drive" && (
          <div className="space-y-4 max-w-sm mx-auto">
            <Folder className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-800">نسخ احتياطي للتقارير</h3>
            <p className="text-sm text-slate-500">قم بإنشاء مجلد في جوجل درايف لتصدير وحفظ تقارير المنصة داخله بشكل آمن.</p>
            <button
              onClick={() => executeGoogleApiAction(createDriveFolder, "تم إنشاء المجلد في درايف بنجاح")}
              disabled={loadingAction}
              className="mt-4 bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              إنشاء مجلد "Takaful Reports Backup"
            </button>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="space-y-4 max-w-sm mx-auto">
            <Calendar className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-800">جدولة اجتماعات المراجعة</h3>
            <p className="text-sm text-slate-500">قم بإضافة حدث في تقويم جوجل لاجتماع مراجعة الحالات العاجلة المرفوعة اليوم.</p>
            <button
              onClick={() => executeGoogleApiAction(createCalendarEvent, "تم إضافة الحدث للتقويم بنجاح")}
              disabled={loadingAction}
              className="mt-4 bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              مراجعة المساعدات العاجلة
            </button>
          </div>
        )}

        {activeTab === "gmail" && (
          <div className="space-y-4 max-w-sm mx-auto">
            <Mail className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-800">مراسلات الجمعيات</h3>
            <p className="text-sm text-slate-500">إنشاء مسودة بريد إلكتروني في جيميل تحتوي على ملخص الحالات لإرسالها للجمعيات.</p>
            <button
              onClick={() => executeGoogleApiAction(createDraftEmail, "تم إنشاء مسودة البريد في جيميل")}
              disabled={loadingAction}
              className="mt-4 bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-rose-700 disabled:opacity-50"
            >
              {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              إنشاء مسودة بريد لـ info@charity.org
            </button>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-4 max-w-sm mx-auto">
            <CheckSquare className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-800">مهام المتابعة</h3>
            <p className="text-sm text-slate-500">مزامنة الحالات المعلقة كقائمة مهام جديدة في مهام جوجل لمتابعة تنفيذ المشاريع والمساعدات.</p>
            
            <button
              onClick={() => executeGoogleApiAction(syncCasesToTasks, "تم مزامنة المهام مع Google Tasks بنجاح")}
              disabled={loadingAction}
              className="mt-4 bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              مزامنة المهام المعلقة
            </button>
            <button
              onClick={() => executeGoogleApiAction(createTasksList, "تم إنشاء قائمة المهام الفارغة بنجاح")}
              disabled={loadingAction}
              className="mt-2 bg-white text-blue-600 border border-blue-200 font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-blue-50 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              إنشاء قائمة "متابعة الحالات" فارغة
            </button>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-4 max-w-sm mx-auto">
            <MessageSquare className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-800">مساحات الدردشة للطوارئ</h3>
            <p className="text-sm text-slate-500">إنشاء مساحة دردشة جديدة في Google Chat خاصة بغرف الطوارئ ومتابعة الكوارث.</p>
            <button
              onClick={() => executeGoogleApiAction(createChatSpace, "تم إنشاء مساحة الدردشة بنجاح")}
              disabled={loadingAction}
              className="mt-4 bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              إنشاء مساحة "غرفة طوارئ التكافل"
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
