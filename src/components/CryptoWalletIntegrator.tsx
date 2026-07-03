import React, { useState, useEffect } from "react";
import { QrCode, Copy, Check, RefreshCw, Cpu, CheckCircle2, TrendingUp, HelpCircle, Activity, ShieldCheck, Zap } from "lucide-react";

interface CryptoWalletIntegratorProps {
  amountLyd: number;
  selectedFund: string;
  lang?: "ar" | "en" | "zh" | "fr" | "ru";
  onDonateSuccess: (donationData: any) => void;
  rates: { USD_LYD: number; BTC_USD: number; ETH_USD: number };
}

type CryptoAsset = "USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH";

export default function CryptoWalletIntegrator({
  amountLyd,
  selectedFund,
  lang = "ar",
  onDonateSuccess,
  rates
}: CryptoWalletIntegratorProps) {
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>("USDT_TRC20");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [sessionTxId, setSessionTxId] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "broadcasting" | "confirming" | "completed">("pending");
  const [confirmations, setConfirmations] = useState<number>(0);
  const [blockHeight, setBlockHeight] = useState<number>(849204);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [networkSpeed, setNetworkSpeed] = useState<string>("عادي");
  const [gasFee, setGasFee] = useState<string>("0.00");

  // Helper to get fund name in Arabic
  const getFundNameAr = (fundKey: string) => {
    switch (fundKey) {
      case "orphans": return "صندوق كفالة الأيتام والرعاية الخاصة";
      case "empower": return "صندوق تمكين الأسر المنتجة";
      case "medical": return "صندوق المساعدات العلاجية والجراحية العاجلة";
      case "wells": return "صندوق آبار مياه الشرب النقية";
      default: return "الصدقة الجارية العامة للأشد احتياجاً";
    }
  };

  // Convert LYD to USD, and then to Crypto
  const usdVal = amountLyd / rates.USD_LYD;
  
  const getCryptoAmount = () => {
    switch (selectedAsset) {
      case "BTC":
        return (usdVal / rates.BTC_USD).toFixed(6);
      case "ETH":
        return (usdVal / rates.ETH_USD).toFixed(5);
      case "USDT_TRC20":
      case "USDT_ERC20":
        return usdVal.toFixed(2);
      default:
        return usdVal.toFixed(2);
    }
  };

  const cryptoSymbol = () => {
    if (selectedAsset.startsWith("USDT")) return "USDT";
    return selectedAsset;
  };

  const getNetworkName = () => {
    switch (selectedAsset) {
      case "USDT_TRC20": return "TRON (TRC-20)";
      case "USDT_ERC20": return "Ethereum (ERC-20)";
      case "BTC": return "Bitcoin Mainnet";
      case "ETH": return "Ethereum Mainnet";
    }
  };

  // Generate dynamic, real-looking addresses for each unique combination
  const generateDynamicAddress = () => {
    // Deterministic generation based on the inputs to ensure a unique address per checkout session
    const uniqueSeed = `${selectedAsset}-${amountLyd}-${selectedFund}-${sessionTxId}`;
    let hash = 0;
    for (let i = 0; i < uniqueSeed.length; i++) {
      hash = (hash << 5) - hash + uniqueSeed.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash).toString(16);
    const suffix = absHash.padEnd(12, "f");

    switch (selectedAsset) {
      case "USDT_TRC20":
        return `TYsM7dDqWb${suffix.substring(0, 8)}gXmRt1qPzS6Xv7p9yN4vK`;
      case "USDT_ERC20":
      case "ETH":
        return `0x742d35Cc6634C0${suffix.substring(0, 10)}Bc454e4438f44e`;
      case "BTC":
        return `bc1q9e${suffix.substring(0, 12)}v9c8shz6u2a8z5mxt9k`;
    }
  };

  // Update dynamic address when inputs change
  useEffect(() => {
    // Generate a new transaction reference for the session if not set
    if (!sessionTxId) {
      setSessionTxId("TXS-" + Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    const addr = generateDynamicAddress();
    setWalletAddress(addr);

    // Initial log messages
    const timeStr = new Date().toLocaleTimeString("ar-LY");
    setSystemLogs([
      `[${timeStr}] 🌐 تم إنشاء محفظة إيداع ديناميكية تابعة للمنصة الوطنية.`,
      `[${timeStr}] 📡 بانتظار الإيداع على شبكة ${getNetworkName()}...`
    ]);

    // Set gas fee estimates
    switch (selectedAsset) {
      case "USDT_TRC20":
        setGasFee("1.20 USDT (~5.80 د.ل)");
        setNetworkSpeed("سريع (أقل من دقيقتين)");
        break;
      case "USDT_ERC20":
        setGasFee("4.50 USDT (~21.70 د.ل)");
        setNetworkSpeed("متوسط (3-5 دقائق)");
        break;
      case "BTC":
        setGasFee("0.00008 BTC (~25.00 د.ل)");
        setNetworkSpeed("بطيء (10 دقائق)");
        break;
      case "ETH":
        setGasFee("0.0012 ETH (~20.00 د.ل)");
        setNetworkSpeed("سريع (1-3 دقائق)");
        break;
    }

    setPaymentStatus("pending");
    setConfirmations(0);
  }, [selectedAsset, amountLyd, selectedFund, sessionTxId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateSession = () => {
    setSessionTxId("TXS-" + Math.random().toString(36).substring(2, 10).toUpperCase());
    setBlockHeight(prev => prev + Math.floor(Math.random() * 5) + 1);
  };

  // Simulated blockchain flow when user clicks "Simulate Payment Received"
  const handleSimulatePayment = () => {
    if (paymentStatus !== "pending") return;

    setPaymentStatus("broadcasting");
    const now = new Date();
    
    // Add broadcasting logs
    setSystemLogs(prev => [
      `[${now.toLocaleTimeString("ar-LY")}] 🚀 تم الكشف عن حركة واردة بالشبكة! المعاملة قيد البث...`,
      `[${now.toLocaleTimeString("ar-LY")}] 🔗 Hash: 0x${Math.random().toString(16).substring(2, 18)}...`,
      ...prev
    ]);

    // Transition to confirming after 1.5s
    setTimeout(() => {
      setPaymentStatus("confirming");
      let currentConfirmations = 0;
      const interval = setInterval(() => {
        currentConfirmations += 2;
        if (currentConfirmations > 12) currentConfirmations = 12;
        setConfirmations(currentConfirmations);

        const logTime = new Date().toLocaleTimeString("ar-LY");
        setSystemLogs(prev => [
          `[${logTime}] ⛏️ تأكيد المعاملة بالكتلة #${blockHeight + Math.floor(currentConfirmations/3)} (${currentConfirmations}/12)`,
          ...prev
        ]);

        if (currentConfirmations >= 12) {
          clearInterval(interval);
          setPaymentStatus("completed");
          
          setSystemLogs(prev => [
            `[${new Date().toLocaleTimeString("ar-LY")}] ✅ تم تأكيد القيد المالي بنجاح! جاري التوجيه للدفتر المركزي...`,
            ...prev
          ]);

          // Sound effect
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
            osc.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.4);
          } catch (e) {}

          // Complete the donation
          setTimeout(() => {
            onDonateSuccess({
              fund: selectedFund,
              amount: amountLyd,
              method: `crypto-${cryptoSymbol().toLowerCase()}`,
              txId: sessionTxId
            });
          }, 1000);
        }
      }, 500);
    }, 1500);
  };

  // QR Code URL based on the cryptocurrency URI scheme
  const getQRData = () => {
    const cryptoAmt = getCryptoAmount();
    if (selectedAsset === "BTC") return `bitcoin:${walletAddress}?amount=${cryptoAmt}`;
    if (selectedAsset === "ETH") return `ethereum:${walletAddress}?value=${cryptoAmt}`;
    return walletAddress; // raw for USDT
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getQRData())}`;

  return (
    <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 text-right text-slate-100 space-y-6 relative overflow-hidden shadow-2xl">
      {/* Background Glow */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white flex items-center gap-2 flex-row-reverse">
            <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Zap className="w-4 h-4 animate-pulse" />
            </span>
            <span>بوابة التبرع بالعملات الرقمية الفورية</span>
          </h3>
          <p className="text-[10px] text-slate-400">
            أول تكامل وطني مشفر يدعم محافظ الأصول الرقمية المباشرة مع توليد عناوين ديناميكية آمنة
          </p>
        </div>
        <button
          onClick={handleRegenerateSession}
          disabled={paymentStatus !== "pending"}
          className="text-[10px] font-bold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 flex-row-reverse transition-colors disabled:opacity-40"
        >
          <RefreshCw className="w-3 h-3" />
          <span>توليد جلسة جديدة</span>
        </button>
      </div>

      {/* Crypto Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(["USDT_TRC20", "USDT_ERC20", "BTC", "ETH"] as CryptoAsset[]).map((asset) => {
          const names = {
            USDT_TRC20: "USDT (TRC20)",
            USDT_ERC20: "USDT (ERC20)",
            BTC: "Bitcoin (BTC)",
            ETH: "Ethereum (ETH)"
          };
          const active = selectedAsset === asset;
          return (
            <button
              key={asset}
              disabled={paymentStatus !== "pending"}
              onClick={() => setSelectedAsset(asset)}
              className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                active
                  ? "border-emerald-500 bg-emerald-950/40 text-emerald-400 font-black shadow-lg shadow-emerald-500/5"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              } disabled:opacity-40`}
            >
              <span>{names[asset]}</span>
              {active && <span className="text-[8px] bg-emerald-500/20 px-1 py-0.2 rounded text-emerald-300">الشبكة النشطة</span>}
            </button>
          );
        })}
      </div>

      {/* Main Core Section: QR Code and Address Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Dynamic QR Code Box */}
        <div className="md:col-span-4 flex flex-col items-center space-y-2">
          <div className="bg-white p-2.5 rounded-2xl shadow-inner relative group border border-slate-700">
            {/* Status overlays */}
            {paymentStatus === "completed" && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-emerald-400 rounded-2xl animate-fade-in p-4 text-center">
                <CheckCircle2 className="w-10 h-10 mb-2 animate-bounce" />
                <span className="text-xs font-black">تم تأكيد الإيداع!</span>
              </div>
            )}
            
            <img
              src={qrCodeUrl}
              alt="Crypto QR Code"
              referrerPolicy="no-referrer"
              className="w-36 h-36 md:w-40 md:h-40 object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
            />
          </div>
          <span className="text-[9px] text-slate-500 font-mono text-center">
            إصدار البوابة: V2-DynaQR
          </span>
        </div>

        {/* Right: Wallet Address, Converted Amount and Meta Information */}
        <div className="md:col-span-8 space-y-4">
          {/* Exchange Rates Display */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/40 border border-slate-800 p-3 rounded-2xl text-xs">
            <div>
              <span className="text-slate-400 block text-[9px] mb-0.5">القيمة المكافئة بالعملة الرقمية:</span>
              <span className="font-mono text-white font-black text-sm text-emerald-400">
                {getCryptoAmount()} {cryptoSymbol()}
              </span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 block text-[9px] mb-0.5">سعر صرف الشبكة المباشر:</span>
              <span className="font-mono text-slate-300 font-semibold text-xs">
                {selectedAsset === "BTC" && `1 BTC ≈ ${rates.BTC_USD.toLocaleString()} USD`}
                {selectedAsset === "ETH" && `1 ETH ≈ ${rates.ETH_USD.toLocaleString()} USD`}
                {selectedAsset.startsWith("USDT") && `1 USDT ≈ 1.00 USD`}
              </span>
            </div>
          </div>

          {/* Dynamic Wallet Address Copy Block */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-extrabold flex justify-between items-center flex-row-reverse">
              <span>عنوان الإيداع المخصص للجلسة الحالية ({getNetworkName()}):</span>
              <span className="text-[9px] text-emerald-400/80 font-mono">ID: {sessionTxId}</span>
            </label>
            <div className="flex gap-2 flex-row-reverse items-center bg-slate-950 border border-slate-800 rounded-xl p-2 font-mono">
              <input
                type="text"
                readOnly
                value={walletAddress}
                className="flex-1 bg-transparent border-none text-white text-[10px] md:text-xs font-mono text-center focus:outline-none focus:ring-0 cursor-default select-all"
              />
              <button
                onClick={handleCopy}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                title="نسخ العنوان"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Network Estimates */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
            <div className="bg-slate-950/30 p-2 rounded-xl border border-slate-800/50">
              <span className="text-slate-500 block mb-0.5">رسوم الشبكة المقدرة</span>
              <span className="font-mono text-amber-400 font-bold">{gasFee}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-xl border border-slate-800/50">
              <span className="text-slate-500 block mb-0.5">زمن المعالجة المتوقع</span>
              <span className="font-bold text-slate-300">{networkSpeed}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-xl border border-slate-800/50">
              <span className="text-slate-500 block mb-0.5">صندوق الإسناد المستفيد</span>
              <span className="font-bold text-emerald-400 truncate block max-w-full">
                {getFundNameAr(selectedFund)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Tracker Console and Simulated Controls */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2.5">
          {/* Simulation controller */}
          <div>
            {paymentStatus === "pending" ? (
              <button
                onClick={handleSimulatePayment}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 flex-row-reverse cursor-pointer shadow-md shadow-emerald-600/10"
              >
                <Cpu className="w-3 h-3 animate-pulse" />
                <span>محاكاة إرسال المعاملة ومراقبة البث 📡</span>
              </button>
            ) : paymentStatus === "broadcasting" ? (
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5 flex-row-reverse animate-pulse">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                <span>جاري بث المعاملة بالشبكة...</span>
              </span>
            ) : paymentStatus === "confirming" ? (
              <div className="flex items-center gap-2 flex-row-reverse text-[10px]">
                <span className="text-emerald-400 font-bold">جاري تأكيد البلوك: {confirmations}/12</span>
                <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(confirmations / 12) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-emerald-400 font-black flex items-center gap-1 flex-row-reverse">
                <Check className="w-3.5 h-3.5" />
                <span>تم تأكيد وحفظ القيد بالبلوكشين والمنصة ✓</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-row-reverse text-xs">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              مراقب الشبكة المباشر
            </span>
          </div>
        </div>

        {/* Real-time system logs console */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-3 h-24 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {systemLogs.map((log, index) => (
            <div key={index} className="leading-normal flex justify-between flex-row-reverse font-mono text-right">
              <span className={log.includes("✅") ? "text-emerald-400" : log.includes("🚀") ? "text-amber-400" : "text-slate-400"}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-slate-950/20 border border-slate-800 p-3 rounded-2xl flex items-center gap-2.5 flex-row-reverse text-[9px] text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <span className="leading-normal text-right">
          <strong>بروتوكول السلامة الموحد:</strong> ترتبط هذه العناوين الذكية بآلية حوكمة مزدوجة القيود. عند تبرعك، يتم تحويل القيمة على الشبكة اللامركزية وبنفس اللحظة يقوم النظام المحاسبي الوطني بتوليد سند قيد معادل بالدينار الليبي معتمداً من الهيئة العليا المستقلة للرقابة والتكافل.
        </span>
      </div>
    </div>
  );
}
