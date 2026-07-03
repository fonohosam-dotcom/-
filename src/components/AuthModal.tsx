import React, { useState } from "react";
import { UserRole, User } from "../types";
import { translations, Language } from "../translations";
import { customFetch } from "../utils/api";
import { encryptValue } from "../utils/crypto";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";

const fetch = customFetch;

interface AuthModalProps {
  lang: Language;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export default function AuthModal({ lang, onClose, onLoginSuccess }: AuthModalProps) {
  const t = translations[lang];
  const [step, setStep] = useState<"login" | "register" | "complete_profile">("login");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authProvider, setAuthProvider] = useState<"local" | "google" | "apple">("local");
  const [providerUid, setProviderUid] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [municipality, setMunicipality] = useState("صبراتة");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const playClickSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");
    playClickSound();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const res = await fetch("/api/auth/social-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fbUser.email,
          fullName: fbUser.displayName || "Google User",
          provider: "google"
        })
      });
      const data = await res.json();
      
      if (data.status === "needs_profile") {
        setEmail(data.email);
        setFullName(data.fullName);
        setAuthProvider("google");
        setProviderUid(fbUser.uid);
        setStep("complete_profile");
      } else if (data.status === "success") {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMessage(data.message || t.error);
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setErrorMessage(lang === "ar" ? "فشل تسجيل الدخول عبر Google. يرجى تفعيل الدخول المنبثق (Pop-up) والمحاولة مجدداً." : "Google Sign-In failed. Please enable pop-ups and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");
    playClickSound();
    // Simulate Apple Login
    setTimeout(async () => {
      try {
        const appleEmail = `apple_${Date.now()}@privaterelay.appleid.com`;
        const res = await fetch("/api/auth/social-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: appleEmail,
            fullName: "مستخدم Apple",
            provider: "apple"
          })
        });
        const data = await res.json();
        
        if (data.status === "needs_profile") {
          setEmail(data.email);
          setFullName(data.fullName);
          setAuthProvider("apple");
          setProviderUid(`apple-uid-${Date.now()}`);
          setStep("complete_profile");
        } else if (data.status === "success") {
          onLoginSuccess(data.user, data.token);
          onClose();
        } else {
          setErrorMessage(data.message || t.error);
        }
      } catch (err: any) {
        setErrorMessage(lang === "ar" ? "فشل تسجيل الدخول عبر Apple." : "Apple Sign-In failed.");
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    playClickSound();

    if (step === "complete_profile") {
      try {
        const res = await fetch("/api/auth/social-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            fullName,
            phone,
            role,
            municipality,
            nationalId: await encryptValue(nationalId),
            address: await encryptValue(address),
            isAnonymous,
            provider: authProvider,
            uid: providerUid
          }),
        });
        const data = await res.json();
        if (data.status === "success") {
          onLoginSuccess(data.user, data.token);
          onClose();
        } else {
          setErrorMessage(data.message || t.error);
        }
      } catch (err) {
        setErrorMessage(t.error);
      } finally {
        setLoading(false);
      }
      return;
    }

    const endpoint = step === "register" ? "/api/auth/register" : "/api/auth/login";
    const body = step === "register" 
      ? { 
          email, 
          password, 
          fullName, 
          phone, 
          role, 
          municipality, 
          nationalId: await encryptValue(nationalId), 
          address: await encryptValue(address) 
        }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === "success") {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMessage(data.message || t.error);
      }
    } catch (err) {
      setErrorMessage(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in" id="auth-modal-overlay">
      <div className="bg-white/95 border border-emerald-500/20 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] md:max-h-[85vh]">
        
        {/* Decorative Top Accent */}
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400"></div>

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800">
              {step === "complete_profile" 
                ? (lang === "ar" ? "استكمال ملفك الشخصي" : "Complete Your Profile")
                : step === "register" ? t.register : t.login}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {step === "complete_profile" 
                ? (lang === "ar" ? "يرجى إضافة بياناتك الشخصية المتبقية" : "Please add your remaining personal data")
                : step === "register" 
                ? (lang === "ar" ? "انضم للسجل الوطني الموحد ببيانات مشفرة" : "Join the unified national registry with encrypted credentials")
                : (lang === "ar" ? "الوصول الآمن لحسابك الشخصي" : "Secure access to your personal portal")}
            </p>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title={lang === "ar" ? "إغلاق" : "Close"}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <p className="font-bold">{errorMessage}</p>
            </div>
          )}

          

          <form onSubmit={handleAuth} className="space-y-4 text-xs">
            
            {(step === "register" || step === "complete_profile") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.fullName} *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    placeholder="محمد عبدالله التواتي"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.phone}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    placeholder="091XXXXXXX"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {step === "register" || step === "complete_profile"
                    ? `${t.email} *` 
                    : (lang === "ar" ? "معرف تسجيل الدخول *" : "Login Identifier *")}
                </label>
                <input
                  type={step === "register" || step === "complete_profile" ? "email" : "text"}
                  required
                  disabled={step === "complete_profile"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border border-slate-200 bg-white rounded-xl p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-right ${step === "complete_profile" ? "bg-slate-100 text-slate-500" : ""}`}
                  dir={step === "register" || step === "complete_profile" ? "ltr" : "auto"}
                  placeholder={step === "register" || step === "complete_profile"
                    ? "name@takaful.ly" 
                    : (lang === "ar" ? "البريد، الهاتف، الرقم الوطني أو اسم المستخدم" : "Email, phone, national ID or username")}
                />
              </div>

              {step !== "complete_profile" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.password} *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>

            {(step === "register" || step === "complete_profile") && (
              <>
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-slate-700 font-black mb-2">{t.role} *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("citizen")}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                        role === "citizen" 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold block text-xs">👤 {t.citizen}</span>
                      <span className="text-[10px] text-slate-500 font-light leading-snug">طلب الدعم والتمكين الأسري</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("donor")}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                        role === "donor" 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold block text-xs">🪙 {t.donor}</span>
                      <span className="text-[10px] text-slate-500 font-light leading-snug">تصفح الحالات والتبرع الآمن</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("researcher")}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                        role === "researcher" 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold block text-xs">📋 {t.researcher}</span>
                      <span className="text-[10px] text-slate-500 font-light leading-snug">إجراء الزيارات الميدانية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("charity")}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                        role === "charity" 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold block text-xs">🤝 {t.charity}</span>
                      <span className="text-[10px] text-slate-500 font-light leading-snug">اعتماد الحالات وصرف المنح</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("evaluation_committee")}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                        role === "evaluation_committee" 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold block text-xs">⚖️ لجنة التقييم</span>
                      <span className="text-[10px] text-slate-500 font-light leading-snug">تقييم محايد مجهول الهوية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("finance_manager")}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                        role === "finance_manager" 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold block text-xs">💼 المدير المالي</span>
                      <span className="text-[10px] text-slate-500 font-light leading-snug">مراقبة السجل المالي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("volunteer")}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                        role === "volunteer" 
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-1 ring-orange-500" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold block text-xs">🤝 متطوع ميداني</span>
                      <span className="text-[10px] text-slate-500 font-light leading-snug">إيصال المساعدات</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{t.municipality} *</label>
                    <select
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="صبراتة">صبراتة</option>
                      <option value="صرمان">صرمان</option>
                      <option value="العجيلات">العجيلات</option>
                      <option value="الجميل">الجميل</option>
                      <option value="زوارة">زوارة</option>
                      <option value="الزاوية">الزاوية</option>
                    </select>
                  </div>

                  {(role === "citizen" || role === "researcher") && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">{t.nationalId} *</label>
                      <input
                        type="text"
                        required
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                        placeholder="1199XXXXXXXX"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === "ar" ? "العنوان السكني الحالي" : "Current Address"}</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    placeholder="اسم البلدية، اسم المحلة، المعالم البارزة"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 border border-emerald-100 bg-emerald-50/50 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="block font-black text-emerald-800 text-xs">
                        {lang === "ar" ? "تفعيل الهوية الرقمية الخفية (وضع التخفي)" : "Enable Hidden Digital Identity"}
                      </span>
                      <span className="block text-[10px] text-emerald-600/80 mt-1 leading-snug">
                        {lang === "ar" 
                          ? "عند تفعيل هذا الخيار، سيتم إخفاء اسمك وبياناتك الشخصية من السجلات العامة وقوائم المتبرعين، وستظهر بصفتك 'فاعل خير'." 
                          : "When enabled, your name and personal details will be hidden from public ledgers, appearing as 'Anonymous Donor'."}
                      </span>
                    </div>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10 active:scale-[0.98] mt-6 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>🔒</span>
                  <span>{step === "complete_profile" ? (lang === "ar" ? "استكمال وإنشاء الحساب" : "Complete & Create Account") : step === "register" ? t.register : t.login}</span>
                </>
              )}
            </button>

            {step !== "complete_profile" && (
              <>
                {/* Social Sign-In Integration */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative px-3 bg-white text-xs text-slate-500 font-bold">
                    {lang === "ar" ? "أو عبر الحساب الموحد" : "Or via unified account"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-300 transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{lang === "ar" ? "دخول بـ Google" : "Google"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleAppleSignIn}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 384 512" fill="currentColor">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    <span>{lang === "ar" ? "دخول بـ Apple" : "Apple"}</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer Link */}
        {step !== "complete_profile" && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs">
            <span className="text-slate-500">
              {step === "register" 
                ? (lang === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?")
                : (lang === "ar" ? "ليس لديك حساب للآن؟" : "Don't have an account yet?")}
            </span>{" "}
            <button
              onClick={() => { playClickSound(); setStep(step === "register" ? "login" : "register"); setErrorMessage(""); }}
              className="text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              {step === "register" ? t.login : t.register}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
