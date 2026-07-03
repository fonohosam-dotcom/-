import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User } from "lucide-react";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/chat.spaces');
provider.addScope('https://www.googleapis.com/auth/chat.messages');
provider.addScope('https://www.googleapis.com/auth/chat.messages.readonly');
provider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');

interface GoogleChatWidgetProps {
  caseId?: string; // If provided, the chat is context-aware to this case
}

export default function GoogleChatWidget({ caseId }: GoogleChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // In a real app, we might silently get a token, but here we require explicit login for Google APIs
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
        fetchSpaces(credential.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchSpaces = async (accessToken: string) => {
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpaces(data.spaces || []);
        if (data.spaces && data.spaces.length > 0) {
          setActiveSpace(data.spaces[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching spaces:', err);
    }
  };

  const fetchMessages = async () => {
    if (!token || !activeSpace) return;
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${activeSpace}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (activeSpace && token && isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSpace, token, isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSpace || !token) return;
    const msgText = newMessage;
    setNewMessage("");

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${activeSpace}/messages`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: msgText })
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 shadow-2xl flex flex-col items-start" dir="rtl">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-xl w-80 sm:w-96 overflow-hidden flex flex-col border border-emerald-100" style={{ height: "500px" }}>
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-bold">دردشة تقييم الحالات</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!token ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">تواصل فوري</h4>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                سجل الدخول باستخدام حساب Google الخاص بك للوصول إلى غرف دردشة Google Chat الخاصة بمتابعة الحالات وتقييمها.
              </p>
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
              >
                {isLoggingIn ? "جاري تسجيل الدخول..." : "تسجيل الدخول بـ Google"}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Spaces List (Horizontal scroll) */}
              <div className="bg-white border-b px-2 py-3 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide" dir="rtl">
                {spaces.length === 0 ? (
                  <span className="text-xs text-slate-500 px-2 py-1">لا توجد غرف متاحة...</span>
                ) : (
                  spaces.map((space) => (
                    <button
                      key={space.name}
                      onClick={() => setActiveSpace(space.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                        activeSpace === space.name ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {space.displayName || "مساحة غير مسماة"}
                    </button>
                  ))
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-400 text-xs font-medium">لا توجد رسائل سابقة في هذه الغرفة.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSystem = msg.sender?.type === "BOT";
                    // For demo, we don't know the exact user, just show messages.
                    return (
                      <div key={idx} className={`flex items-start gap-2 ${isSystem ? 'opacity-80' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {msg.sender?.avatarUrl ? (
                            <img src={msg.sender.avatarUrl} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm border border-slate-100 max-w-[85%]">
                          <p className="text-xs font-bold text-slate-800 mb-1">{msg.sender?.displayName || "مستخدم"}</p>
                          <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-3 bg-white border-t shrink-0">
                <div className="flex items-center gap-2 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالة للمشرفين..."
                    className="flex-1 bg-slate-100 border-none rounded-full py-3 px-5 text-sm focus:ring-2 focus:ring-emerald-500 pr-12"
                    dir="rtl"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                  >
                    <Send className="w-4 h-4 mr-0.5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
