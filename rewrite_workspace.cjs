const fs = require('fs');

const content = `import React, { useState, useEffect } from "react";
import { User, Case } from "../types";
import { Folder, Calendar, Mail, CheckSquare, MessageSquare, Plus, RefreshCw, AlertCircle, Check, Shield, Zap, Globe, Cloud, LayoutDashboard } from "lucide-react";
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

  const executeGoogleApiAction = async (actionFn: (accessToken: string) => Promise<void>, successMessage: string) => {
    if (!token) return;
    
    const confirmed = window.confirm("هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟\\nسيتم استخدام حساب Google Workspace الخاص بك لتعديل أو إضافة بيانات.");
    if (!confirmed) return;

    setLoadingAction(true);
    setActionSuccess(null);
    try {
      await actionFn(token);
      setActionSuccess(successMessage);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (error: any) {
      console.error("API Action Failed", error);
      alert("حدث خطأ أثناء تنفيذ الإجراء. يرجى التحقق من الصلاحيات.");
    } finally {
      setLoadingAction(false);
    }
  };

  const createDriveFolder = async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'تقارير منصة التكافل - ' + new Date().getFullYear(),
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
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: 'مراجعة طلبات الإسكان والآبار العاجلة',
        description: 'اجتماع مجدول لمراجعة الحالات الإنسانية المرفوعة على منصة التكافل.',
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        colorId: '5'
      })
    });
    if (!res.ok) throw new Error("Calendar API failed");
  };

  const createDraftEmail = async (accessToken: string) => {
    const message = [
      'To: info@charity-takaful.org',
      'Subject: تحديثات حالات منصة التكافل - المهام العاجلة',
      '',
      'فريق منصة التكافل المحترم،',
      '',
      'نود إعلامكم بوجود حالات جديدة للإسكان والآبار تتطلب مراجعة واعتماد عاجل.',
      '',
      'تحياتي،',
      'المنصة المركزية للتكافل'
    ].join('\\n');
    
    const encodedEmail = btoa(unescape(encodeURIComponent(message))).replace(/\\+/g, '-').replace(/\\//g, '_');
    
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
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
    const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'مهام منصة التكافل - ' + new Date().toLocaleDateString('ar-SA')
      })
    });
    if (!listRes.ok) throw new Error("Tasks API failed to create list");
    const listData = await listRes.json();
    const taskListId = listData.id;

    const pendingCases = cases.filter(c => {
      if (user?.role === 'researcher') return c.status === 'submitted' || c.status === 'under_review';
      if (user?.role === 'admin') return c.status === 'field_visit_done';
      return false;
    });

    if (pendingCases.length === 0) {
      throw new Error("لا توجد مهام معلقة لمزامنتها حالياً");
    }

    for (const c of pendingCases) {
      await fetch(\`https://tasks.googleapis.com/tasks/v1/lists/\${taskListId}/tasks\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: \`متابعة ملف رقم: \${c.caseNumber}\`,
          notes: \`الاحتياج: \${c.needTypes.join(' - ')}\\nالموقع: \${c.municipality}\\nالوصف: \${c.description}\`
        })
      });
      await new Promise(res => setTimeout(res, 300));
    }
  };

  const createChatSpace = async (accessToken: string) => {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spaceType: 'SPACE',
        displayName: 'غرفة طوارئ التكافل المركزية'
      })
    });
    if (!res.ok) throw new Error("Chat API failed");
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-1 bg-gradient-to-br from-[#4285F4]/20 via-[#EA4335]/10 to-[#34A853]/20 rounded-[2rem] shadow-2xl">
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
            <span className="relative z-10">{isLoggingIn ? "جاري الاتصال بالسحابة..." : "تسجيل الدخول باستخدام Google"}</span>
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
    { id: 'drive', label: 'درايف', icon: Folder, color: 'text-[#4285F4]', bgHover: 'hover:bg-[#4285F4]/10', activeBg: 'bg-[#4285F4]/10 border-[#4285F4]/30' },
    { id: 'calendar', label: 'التقويم', icon: Calendar, color: 'text-[#4285F4]', bgHover: 'hover:bg-[#4285F4]/10', activeBg: 'bg-[#4285F4]/10 border-[#4285F4]/30' },
    { id: 'gmail', label: 'جيميل', icon: Mail, color: 'text-[#EA4335]', bgHover: 'hover:bg-[#EA4335]/10', activeBg: 'bg-[#EA4335]/10 border-[#EA4335]/30' },
    { id: 'tasks', label: 'المهام', icon: CheckSquare, color: 'text-[#4285F4]', bgHover: 'hover:bg-[#4285F4]/10', activeBg: 'bg-[#4285F4]/10 border-[#4285F4]/30' },
    { id: 'chat', label: 'محادثات', icon: MessageSquare, color: 'text-[#34A853]', bgHover: 'hover:bg-[#34A853]/10', activeBg: 'bg-[#34A853]/10 border-[#34A853]/30' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
               <img src="https://www.google.com/favicon.ico" alt="Google" className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Google Workspace</h2>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                <Shield className="w-3.5 h-3.5 text-[#34A853]" />
                تم الاتصال وتوثيق الجلسة بنجاح
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-full transition-colors flex items-center gap-2"
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
        <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
          {actionSuccess && (
            <div className="mb-8 flex items-center gap-3 bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/20 px-5 py-4 rounded-2xl text-sm font-bold animate-fade-in shadow-sm">
              <div className="bg-[#34A853] rounded-full p-1 text-white"><Check className="w-3 h-3" /></div>
              {actionSuccess}
            </div>
          )}

          <div className="h-full flex flex-col justify-center max-w-lg mx-auto py-8">
            {activeTab === "drive" && (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-[#4285F4]/5 rounded-3xl flex items-center justify-center mx-auto border border-[#4285F4]/10 shadow-inner">
                  <Folder className="w-12 h-12 text-[#4285F4]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-800 mb-3">أرشفة ونسخ احتياطي</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    قم بإنشاء مجلد آمن في Google Drive لأرشفة تقارير المشاريع، بيانات التبرعات، وإحصائيات الحالات באופן تلقائي.
                  </p>
                </div>
                <button
                  onClick={() => executeGoogleApiAction(createDriveFolder, "تم إنشاء المجلد في درايف بنجاح")}
                  disabled={loadingAction}
                  className="w-full bg-[#4285F4] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#3367d6] hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  إنشاء مجلد التوثيق لعام {new Date().getFullYear()}
                </button>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-[#4285F4]/5 rounded-3xl flex items-center justify-center mx-auto border border-[#4285F4]/10 shadow-inner">
                  <Calendar className="w-12 h-12 text-[#4285F4]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-800 mb-3">جدولة اللجان والمراجعة</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    استخدم تقويم جوجل لبرمجة مواعيد اجتماعات اللجان الميدانية، والزيارات المخصصة للاطلاع على احتياجات الإسكان.
                  </p>
                </div>
                <button
                  onClick={() => executeGoogleApiAction(createCalendarEvent, "تم إضافة الحدث للتقويم بنجاح")}
                  disabled={loadingAction}
                  className="w-full bg-[#4285F4] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#3367d6] hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  حجز موعد مراجعة ميدانية عاجلة
                </button>
              </div>
            )}

            {activeTab === "gmail" && (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-[#EA4335]/5 rounded-3xl flex items-center justify-center mx-auto border border-[#EA4335]/10 shadow-inner">
                  <Mail className="w-12 h-12 text-[#EA4335]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-800 mb-3">توجيه الرسائل التلقائية</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    قم بإعداد مسودة رسالة موحدة في Gmail لتوزيع المهام على الجمعيات الخيرية والجهات التنفيذية الشريكة.
                  </p>
                </div>
                <button
                  onClick={() => executeGoogleApiAction(createDraftEmail, "تم إنشاء مسودة البريد في جيميل")}
                  disabled={loadingAction}
                  className="w-full bg-[#EA4335] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#d33426] hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  إنشاء مسودة مراسلات للشركاء
                </button>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-[#4285F4]/5 rounded-3xl flex items-center justify-center mx-auto border border-[#4285F4]/10 shadow-inner">
                  <CheckSquare className="w-12 h-12 text-[#4285F4]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-800 mb-3">إدارة المهام الميدانية</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    حول الحالات الحرجة والمراجعات المعلقة مباشرة إلى قوائم في Google Tasks لضمان عدم نسيان أي ملف محتاج.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => executeGoogleApiAction(syncCasesToTasks, "تم مزامنة المهام مع Google Tasks بنجاح")}
                    disabled={loadingAction}
                    className="w-full bg-[#4285F4] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#3367d6] hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    مزامنة الحالات إلى مهام جوجل
                  </button>
                  <button
                    onClick={() => executeGoogleApiAction(syncCasesToTasks, "تم إنشاء قائمة المهام الفارغة بنجاح")}
                    disabled={loadingAction}
                    className="w-full bg-white text-[#4285F4] border-2 border-[#4285F4]/20 font-bold py-3.5 px-6 rounded-2xl hover:bg-[#4285F4]/5 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    تهيئة قائمة مهام فارغة
                  </button>
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-[#34A853]/5 rounded-3xl flex items-center justify-center mx-auto border border-[#34A853]/10 shadow-inner">
                  <MessageSquare className="w-12 h-12 text-[#34A853]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-800 mb-3">مساحات إدارة الأزمات</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    شكل غرف عمليات فورية في Google Chat للمتطوعين وفرق التدخل السريع لمتابعة الحالات التي لا تحتمل التأخير.
                  </p>
                </div>
                <button
                  onClick={() => executeGoogleApiAction(createChatSpace, "تم إنشاء مساحة الدردشة بنجاح")}
                  disabled={loadingAction}
                  className="w-full bg-[#34A853] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#2d9147] hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  تأسيس غرفة عمليات طوارئ 
                </button>
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
