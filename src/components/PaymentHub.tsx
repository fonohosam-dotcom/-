import React, { useState, useEffect } from "react";
import { CreditCard, Coins, Check, ShieldCheck, ArrowRight, RefreshCw, Smartphone, QrCode } from "lucide-react";
import Web3WalletConnector from "./Web3WalletConnector";

interface PaymentHubProps {
  lang: "ar" | "en" | "zh" | "fr" | "ru";
  onDonateSuccess: (donationData: any) => void;
}

export default function PaymentHub({ lang, onDonateSuccess }: PaymentHubProps) {
  const [amount, setAmount] = useState<number>(150);
  const [selectedFund, setSelectedFund] = useState<string>("orphans");
  const [paymentType, setPaymentType] = useState<"local" | "bank" | "global" | "crypto" | "web3">("local");
  const [paymentMethod, setPaymentMethod] = useState<string>("sadad");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>("");

  // Bank Transfer state
  const [bankSenderName, setBankSenderName] = useState<string>("");
  const [bankTxRef, setBankTxRef] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string>("");

  // Local state for forms
  const [phone, setPhone] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpVerified, setOtpVerified] = useState<boolean>(false);

  const [cardHolder, setCardHolder] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");

  const [cryptoAddress, setCryptoAddress] = useState<string>("TYsM7dDqWb4p3gXmRt1qPzS6Xv7p9yN4vK");
  const [cryptoCopied, setCryptoCopied] = useState<boolean>(false);
  const [confirmations, setConfirmations] = useState<number>(0);
  const [cryptoSelected, setCryptoSelected] = useState<string>("USDT");

  // Simulated live rates
  const [rates, setRates] = useState({ USD_LYD: 4.83, BTC_USD: 64200, ETH_USD: 3450 });

  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => ({
        USD_LYD: +(prev.USD_LYD + (Math.random() - 0.5) * 0.01).toFixed(2),
        BTC_USD: Math.round(prev.BTC_USD + (Math.random() - 0.5) * 50),
        ETH_USD: Math.round(prev.ETH_USD + (Math.random() - 0.5) * 5),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendOTP = () => {
    if (!phone) return;
    setOtpSent(true);
    // Sound play
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.value = 800;
      osc.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const handleVerifyOTP = () => {
    if (otpCode === "5912") {
      setOtpVerified(true);
    } else {
      alert(lang === "ar" ? "رمز التحقق غير صحيح، أدخل 5912" : "Invalid OTP code, enter 5912");
    }
  };

  const processPayment = () => {
    setIsProcessing(true);
    
    let currentConf = 0;
    if (paymentType === "web3") {
      const interval = setInterval(() => {
        currentConf += 2;
        setConfirmations(currentConf);
        if (currentConf >= 12) {
          clearInterval(interval);
          completePayment();
        }
      }, 400);
    } else {
      setTimeout(() => {
        completePayment();
      }, 1500);
    }
  };

  const completePayment = () => {
    const txId = "TX-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    setTransactionId(txId);
    setIsProcessing(false);
    setPaymentSuccess(true);
    
    // Play sound
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
      osc.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}

    onDonateSuccess({
      fund: selectedFund,
      amount,
      method: paymentMethod,
      txId
    });
  };

  const resetForm = () => {
    setPaymentSuccess(false);
    setAmount(150);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
    setPhone("");
    setCardHolder("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setBankSenderName("");
    setBankTxRef("");
    setConfirmations(0);
  };

  return (
    <div className="bg-white border border-[#E5E3DA] rounded-3xl p-6 md:p-8 max-w-4xl mx-auto space-y-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-6 gap-4">
        <div className="text-right">
          <h2 className="text-2xl font-black text-gray-900 flex items-center justify-end gap-2">
            <span>🌐</span>
            <span>بوابة المدفوعات العالمية الفائقة (V2 Unified Checkout)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            بنية تبرع وإسناد مالي متكاملة تربط الحسابات المصرفية المحلية، البطاقات الائتمانية الدولية، والعملات الرقمية آلياً
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-[10px] font-mono px-3 py-1.5 rounded-xl self-start md:self-center border border-emerald-100">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span>أسعار الصرف: 1 USD ≈ {rates.USD_LYD} LYD</span>
        </div>
      </div>

      {paymentSuccess ? (
        <div className="bg-emerald-50/60 border border-emerald-500/20 p-8 rounded-3xl text-center space-y-6 relative overflow-hidden animate-fade-in">
          {/* Circular Badge */}
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto shadow-lg shadow-emerald-600/20">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-emerald-900">تمت العملية بنجاح!</h3>
            <p className="text-xs text-emerald-700/80">تم توثيق المعاملة وتسجيلها فورياً في السجل الوطني المحاسبي المزدوج للمنصة</p>
          </div>

          {/* Secure Bookkeeping Receipt */}
          <div className="max-w-md mx-auto bg-white border border-emerald-500/10 rounded-2xl p-6 text-right space-y-4 shadow-sm relative font-mono text-xs">
            <div className="absolute top-0 left-0 bg-emerald-600 text-white px-3 py-1 rounded-br-2xl rounded-tl-sm text-[8px] tracking-widest font-black">
              AUDITED
            </div>
            <div className="border-b pb-3 text-center">
              <p className="font-sans font-black text-sm text-slate-800">سند استلام وقيد مالي معتمد</p>
              <p className="text-[10px] text-gray-400 mt-0.5">NATIONAL TAKAFUL AUDIT SYSTEM</p>
            </div>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between flex-row-reverse border-b border-dashed pb-1.5">
                <span className="text-gray-400">رقم القيد (Transaction ID)</span>
                <span className="font-bold text-slate-800">{transactionId}</span>
              </div>
              <div className="flex justify-between flex-row-reverse border-b border-dashed pb-1.5">
                <span className="text-gray-400">القيمة الإجمالية</span>
                <span className="font-bold text-emerald-700">{amount} LYD</span>
              </div>
              <div className="flex justify-between flex-row-reverse border-b border-dashed pb-1.5">
                <span className="text-gray-400">قناة الدفع المعتمدة</span>
                <span className="font-bold text-slate-800 uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between flex-row-reverse border-b border-dashed pb-1.5">
                <span className="text-gray-400">الصندوق المستفيد</span>
                <span className="font-bold text-slate-800">
                  {selectedFund === "orphans" && "صندوق كفالة الأيتام والرعاية الخاصة"}
                  {selectedFund === "empower" && "صندوق دعم الأسر المنتجة والتمكين الاقتصادي"}
                  {selectedFund === "medical" && "صندوق المساعدات العلاجية والجراحية العاجلة"}
                  {selectedFund === "wells" && "صندوق آبار مياه الشرب النقية"}
                  {selectedFund === "general" && "الصدقة الجارية العامة للأشد احتياجاً"}
                </span>
              </div>
              <div className="flex justify-between flex-row-reverse border-b border-dashed pb-1.5">
                <span className="text-gray-400">النوع المحاسبي المزدوج</span>
                <span className="text-indigo-600 font-bold">DEBIT Cash / CREDIT Beneficiary Fund</span>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 text-center leading-relaxed font-sans pt-2">
              ✓ تم تمرير التبرع وتجريد المعاملة من البيانات الخاصة لضمان أقصى حماية ونزاهة. شكراً لعطائكم المستدام.
            </div>
          </div>

          <button
            onClick={resetForm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer transition-colors"
          >
            إجراء مساهمة جديدة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
          
          {/* Left Column: Input Panel & Selection */}
          <div className={`${paymentType === "web3" || paymentType === "web3" ? "lg:col-span-12" : "lg:col-span-7"} space-y-6`}>
            
            {/* 1. Select Beneficiary Fund */}
            <div className="space-y-3">
              <label className="block text-slate-700 font-extrabold text-xs">1. اختر الصندوق الإنساني المستهدف:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: "orphans", label: "كفالة الأيتام والرعاية", icon: "👶" },
                  { key: "empower", label: "تمكين الأسر المنتجة", icon: "🧵" },
                  { key: "medical", label: "العلاج والجراحات العاجلة", icon: "🩺" },
                  { key: "wells", label: "سقيا الماء وحفر الآبار", icon: "🚰" },
                  { key: "general", label: "الصدقات الجارية العامة", icon: "🌱" }
                ].map(fund => (
                  <button
                    key={fund.key}
                    onClick={() => setSelectedFund(fund.key)}
                    className={`p-3 border rounded-xl flex items-center justify-between flex-row-reverse transition-all cursor-pointer ${
                      selectedFund === fund.key
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-extrabold shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="text-base">{fund.icon}</span>
                    <span className="text-xs">{fund.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Slider Amount */}
            <div className="space-y-3 bg-slate-50/60 border border-slate-100 p-4 rounded-2xl">
              <div className="flex justify-between flex-row-reverse items-center text-xs">
                <label className="font-extrabold text-slate-700">2. حدد قيمة المساهمة بالدينار الليبي (LYD):</label>
                <span className="font-mono bg-white border px-2.5 py-1 rounded-lg text-emerald-800 font-black text-sm">
                  {amount} LYD
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={2000}
                step={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between font-mono text-[9px] text-gray-400 flex-row-reverse">
                <span>2000 د.ل</span>
                <span>1000 د.ل</span>
                <span>500 د.ل</span>
                <span>250 د.ل</span>
                <span>20 د.ل</span>
              </div>
            </div>

            {/* 3. Category Channel Type */}
            <div className="space-y-3">
              <label className="block text-slate-700 font-extrabold text-xs">3. اختر فئة قناة الدفع:</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                {[
                  { key: "local", label: "محافظ محلية (ليبيا)", icon: "📱" },
                  { key: "bank", label: "تحويل مصرفي مباشر", icon: "🏦" },
                  { key: "global", label: "بطاقات عالمية", icon: "💳" },
                  { key: "crypto", label: "تحويل رقمي يدوي", icon: "🪙" },
                  { key: "web3", label: "ربط محفظة Web3", icon: "🦊" }
                ].map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setPaymentType(cat.key as any);
                      if (cat.key === "local") {
                        setPaymentMethod("sadad");
                      } else if (cat.key === "bank") {
                        setPaymentMethod("bank_transfer");
                      } else if (cat.key === "global") {
                        setPaymentMethod("stripe");
                      } else if (cat.key === "crypto") {
                        setPaymentMethod("binance");
                      } else {
                        setPaymentMethod("web3");
                      }
                    }}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentType === cat.key
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-extrabold shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[10px] leading-tight font-sans text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Payment Options Details */}
            <div className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-4">
              
              {/* LOCAL PAYMENTS */}
              {paymentType === "local" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-row-reverse border-b pb-2">
                    <span className="font-bold text-slate-800 text-xs">الشبكات المصرفية والمحافظ الرقمية الليبية</span>
                    <span className="text-[10px] text-gray-400 font-mono">SECURE WALLET DEBIT</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "sadad", label: "سداد المدار" },
                      { key: "mobicash", label: "موبي كاش تداول" },
                      { key: "tadawool", label: "تداول الوطنية" },
                      { key: "edfali", label: "إدفع لي التجاري" }
                    ].map(pm => (
                      <button
                        key={pm.key}
                        onClick={() => {
                          setPaymentMethod(pm.key);
                          setOtpSent(false);
                          setOtpVerified(false);
                        }}
                        className={`p-2 border rounded-lg text-center text-[10px] font-bold cursor-pointer transition-all ${
                          paymentMethod === pm.key
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>

                  {!otpSent ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500">أدخل رقم الهاتف المسجل بالخدمة المصرفية لتلقي رمز المصادقة التلقائي:</p>
                      <div className="flex gap-2 flex-row-reverse">
                        <input
                          type="tel"
                          placeholder="091XXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-center font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={!phone}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold px-4 rounded-xl cursor-pointer text-xs"
                        >
                          أرسل رمز OTP
                        </button>
                      </div>
                    </div>
                  ) : !otpVerified ? (
                    <div className="space-y-2 animate-fade-in">
                      <p className="text-[10px] text-emerald-700 font-bold">✓ تم إرسال الرمز الهاتفي المؤقت بنجاح. أدخل الرمز (5912) للتأكيد:</p>
                      <div className="flex gap-2 flex-row-reverse">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="XXXX"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-center tracking-widest font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl cursor-pointer text-xs"
                        >
                          تأكيد الرمز
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-between flex-row-reverse animate-fade-in text-xs">
                      <span className="font-bold">✓ تم التحقق والمصادقة الأمنية لخط الهاتف بنجاح</span>
                      <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px]">{phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* BANK TRANSFER (DIRECT DEPOSIT) */}
              {paymentType === "bank" && (
                <div className="space-y-4 animate-fade-in text-right">
                  <div className="flex items-center justify-between flex-row-reverse border-b pb-2">
                    <span className="font-bold text-slate-800 text-xs">حساب تبرعات المنصة المعتمد الرسمي</span>
                    <span className="text-[10px] text-gray-400 font-mono">OFFICIAL DIRECT BANK TRANSFER</span>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-5 text-white space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-[#1D9E75] text-white font-extrabold text-[8px] px-3 py-1 rounded-br-xl font-mono">
                      PRIMARY DONATIONS BANK
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="text-gray-400 text-[10px]">اسم المصرف :</span>
                        <span className="font-bold text-xs text-emerald-400">مصرف شمال أفريقيا</span>
                      </div>
                      
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="text-gray-400 text-[10px]">اسم صاحب الحساب :</span>
                        <span className="font-black text-xs text-white">حسام الدين الفيتوري احميد فونو</span>
                      </div>

                      <div className="border-t border-slate-700/60 my-2"></div>

                      {/* Account Number Field */}
                      <div className="flex justify-between items-center flex-row-reverse gap-2">
                        <div className="text-right">
                          <span className="text-gray-400 text-[9px] block">رقم الحساب التبرعات الموحد :</span>
                          <span className="font-mono font-bold text-xs text-slate-100">020011199217014</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("020011199217014");
                            setCopiedField("account");
                            setTimeout(() => setCopiedField(""), 2000);
                          }}
                          className="bg-slate-700 hover:bg-slate-600 text-gray-200 hover:text-white px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                        >
                          {copiedField === "account" ? "✓ تم النسخ" : "نسخ رقم الحساب"}
                        </button>
                      </div>

                      {/* IBAN Field */}
                      <div className="flex justify-between items-center flex-row-reverse gap-2 mt-2">
                        <div className="text-right">
                          <span className="text-gray-400 text-[9px] block">رقم حساب الدولي (IBAN) :</span>
                          <span className="font-mono font-bold text-[11px] text-slate-100 break-all">LY09007020020011199217014</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("LY09007020020011199217014");
                            setCopiedField("iban");
                            setTimeout(() => setCopiedField(""), 2000);
                          }}
                          className="bg-slate-700 hover:bg-slate-600 text-gray-200 hover:text-white px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-colors shrink-0"
                        >
                          {copiedField === "iban" ? "✓ تم النسخ" : "نسخ IBAN"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <p className="text-[10px] text-slate-500 font-bold">يرجى ملء بيانات حوالتك لإرفاقها وقيدها إلكترونياً تحت تدقيق اللجنة الموحدة:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold text-[10px]">اسم مرسل الحوالة *</label>
                        <input
                          type="text"
                          required
                          value={bankSenderName}
                          onChange={(e) => setBankSenderName(e.target.value)}
                          placeholder="مثال: حسام الدين الفيتوري"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold text-[10px]">رقم مرجع التحويل / الإشعار *</label>
                        <input
                          type="text"
                          required
                          value={bankTxRef}
                          onChange={(e) => setBankTxRef(e.target.value)}
                          placeholder="مثال: TRF-90281-2026"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GLOBAL PAYMENTS */}
              {paymentType === "global" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-row-reverse border-b pb-2">
                    <span className="font-bold text-slate-800 text-xs">البطاقات الائتمانية العالمية والبوابات السريعة</span>
                    <span className="text-[10px] text-gray-400 font-mono">GLOBAL GATEWAYS</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "stripe", label: "Stripe Checkout" },
                      { key: "paypal", label: "PayPal Global" },
                      { key: "applepay", label: "Apple / Google Pay" }
                    ].map(pm => (
                      <button
                        key={pm.key}
                        onClick={() => setPaymentMethod(pm.key)}
                        className={`p-2 border rounded-lg text-center text-[10px] font-bold cursor-pointer transition-all ${
                          paymentMethod === pm.key
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "applepay" ? (
                    <div className="p-4 border border-slate-100 bg-white rounded-xl text-center space-y-3">
                      <p className="text-[10px] text-gray-500">قم بالمصادقة فوراً باستخدام بصمة الإصبع أو الوجه عبر ميزان الحماية الحيوي المدمج بهاتفك</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProcessing(true);
                          setTimeout(() => {
                            setIsProcessing(false);
                            setPaymentSuccess(true);
                          }, 1200);
                        }}
                        className="bg-black text-white hover:bg-slate-900 font-black px-6 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 mx-auto active:scale-95 transition-transform"
                      >
                        <span></span> Pay with Apple Pay
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-right text-xs">
                      <div className="col-span-2">
                        <label className="block text-slate-600 mb-1 font-bold">اسم صاحب البطاقة</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="MOHAMED A AL-TOUATI"
                          className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none font-mono uppercase text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">رقم البطاقة</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                            setCardNumber(val);
                          }}
                          placeholder="4000 1234 5678 9010"
                          className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none font-mono text-center text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-right">
                        <div>
                          <label className="block text-slate-600 mb-1 font-bold">CVV</label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none font-mono text-center text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-bold">Expiry</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full border border-slate-200 bg-white rounded-xl p-2 focus:outline-none font-mono text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CRYPTO PAYMENTS */}
              

              {/* WEB3 WALLET */}
              {paymentType === "web3" && (
                <Web3WalletConnector
                  amountLyd={amount}
                  selectedFund={selectedFund}
                  lang={lang}
                  onDonateSuccess={onDonateSuccess}
                  rates={rates}
                />
              )}

            </div>

          </div>

          {/* Right Column: Visual Credit Card / Visual Information & Submit */}
          {paymentType !== "crypto" && paymentType !== "web3" && (
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              
              {/* Visual Credit Card */}
              {paymentType === "global" && paymentMethod !== "applepay" ? (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 p-5 rounded-2xl text-white font-mono shadow-md flex flex-col justify-between h-40 relative overflow-hidden animate-fade-in border border-indigo-500/20">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl -z-10"></div>
                  <div className="flex justify-between items-start flex-row-reverse">
                    <span className="text-lg font-black italic text-indigo-300">PLATINUM</span>
                    <div className="w-10 h-8 bg-amber-400/80 rounded-md"></div>
                  </div>
                  <div className="text-base tracking-widest text-center py-2 font-bold text-slate-200">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300 flex-row-reverse">
                    <div>
                      <p className="text-[7px] text-slate-500 uppercase">Card Holder</p>
                      <p className="font-bold truncate max-w-[150px] uppercase">{cardHolder || "FULL NAME"}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-500 uppercase">Expires</p>
                      <p className="font-bold text-slate-200">{cardExpiry || "MM/YY"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#0F6E56] to-[#148366] p-5 rounded-3xl text-white font-sans shadow-md flex flex-col justify-between h-40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl -z-10"></div>
                  <div className="flex justify-between items-start flex-row-reverse">
                    <span className="text-lg font-black tracking-wider">TAKAFUL</span>
                    <ShieldCheck className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] text-emerald-200 font-mono block">صندوق العطاء الوطني الموحد</span>
                    <span className="text-2xl font-black font-sans leading-none">{amount} د.ل</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-200 flex-row-reverse">
                    <span>صك تبرع مضمون وموثق</span>
                    <span className="font-mono">VERIFIED BY AUDIT</span>
                  </div>
                </div>
              )}

              {/* Accounting details & dynamic rates info */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-slate-800 flex items-center justify-end gap-1.5">
                  <span>⚖️</span>
                  <span>الحوكمة المحاسبية المزدوجة للمساهمة</span>
                </h4>
                <p className="text-[10px] text-gray-500 leading-relaxed text-right">
                  سيقوم النظام فور نقرك على زر التأكيد أدناه بإجراء قيد محاسبي مزدوج حقيقي: الخصم من حسابك المالي المختار (Debit) وتوجيهه فوراً لقيد حساب المستفيد المقابل (Credit) مع تجريد المعاملة لضمان الشفافية.
                </p>
                {paymentType === "web3" && (
                  <div className="bg-yellow-50 border border-yellow-200/50 p-2.5 rounded-xl text-[9px] text-yellow-800 leading-normal">
                    ⏳ يتطلب التحويل على شبكة TRON نحو 12 تأكيداً للكتلة. سيقوم النظام بمراقبة العنوان وتحديث قيد الدفتر تلقائياً.
                  </div>
                )}
              </div>

              {/* Main Action Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={processPayment}
                  disabled={
                    isProcessing ||
                    (paymentType === "local" && !otpVerified) ||
                    (paymentType === "bank" && (!bankSenderName || !bankTxRef)) ||
                    (paymentType === "global" && paymentMethod !== "applepay" && (!cardHolder || !cardNumber || !cardCvv))
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl cursor-pointer shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2 text-sm transition-all"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>
                        {paymentType === "web3" 
                          ? `جاري التحقق من الشبكة (${confirmations}/12)...` 
                          : "جاري تأكيد القيد والتسجيل المالي..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>تأكيد المساهمة وصرف السند المحاسبي</span>
                    </>
                  )}
                </button>

                <p className="text-[9px] text-gray-400 text-center">
                  مساهمتكم مؤمنة بالكامل من خلال بروتوكول التشفير الموحد لمنصة التكافل الوطني V2.
                </p>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
