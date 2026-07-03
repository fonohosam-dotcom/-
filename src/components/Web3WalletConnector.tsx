import React, { useState, useEffect } from "react";
import { Wallet, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Activity, Zap, Cpu } from "lucide-react";

interface Web3WalletConnectorProps {
  amountLyd: number;
  rates: { USD_LYD: number; BTC_USD: number; ETH_USD: number };
  selectedFund: string;
  onDonateSuccess: (donationData: any) => void;
  lang?: "ar" | "en" | "zh" | "fr" | "ru";
}

export default function Web3WalletConnector({
  amountLyd,
  rates,
  selectedFund,
  onDonateSuccess,
  lang = "ar"
}: Web3WalletConnectorProps) {
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "broadcasting" | "confirming" | "success">("idle");
  const [confirmations, setConfirmations] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const usdtAmount = (amountLyd / rates.USD_LYD).toFixed(2);

  const connectWallet = () => {
    // Simulate wallet connection
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] طلب الاتصال بمحفظة Web3...`, ...prev]);
    setTimeout(() => {
      setWalletAddress("0x" + Math.random().toString(16).substring(2, 42));
      setWalletBalance(Math.floor(Math.random() * 5000) + parseFloat(usdtAmount) + 100);
      setWalletConnected(true);
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] تم ربط المحفظة بنجاح (MetaMask/TrustWallet).`, ...prev]);
    }, 1500);
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setTxStatus("idle");
    setConfirmations(0);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] تم فصل المحفظة.`, ...prev]);
  };

  const executeTransaction = () => {
    if (parseFloat(usdtAmount) > walletBalance) {
      alert("الرصيد غير كافٍ");
      return;
    }
    
    setTxStatus("signing");
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] طلب توقيع المعاملة الذكية (Smart Contract)...`, ...prev]);
    
    setTimeout(() => {
      setTxStatus("broadcasting");
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] المعاملة قيد البث في شبكة Ethereum (ERC20)...`, ...prev]);
      
      setTimeout(() => {
        setTxStatus("confirming");
        
        let confs = 0;
        const interval = setInterval(() => {
          confs += 1;
          setConfirmations(confs);
          setLogs(prev => [`[${new Date().toLocaleTimeString()}] تأكيد البلوك ${confs}/3...`, ...prev]);
          
          if (confs >= 3) {
            clearInterval(interval);
            setTxStatus("success");
            setWalletBalance(prev => prev - parseFloat(usdtAmount));
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] ✅ تمت المعاملة وتوثيقها في دفتر الصدقات المزدوج.`, ...prev]);
            
            setTimeout(() => {
              onDonateSuccess({
                fund: selectedFund,
                amount: amountLyd,
                method: "web3-usdt",
                txId: "0x" + Math.random().toString(16).substring(2, 64)
              });
            }, 1500);
          }
        }, 1200);
      }, 2000);
    }, 1500);
  };

  const getFundNameAr = (fundKey: string) => {
    switch (fundKey) {
      case "orphans": return "صندوق كفالة الأيتام والرعاية الخاصة";
      case "empower": return "صندوق تمكين الأسر المنتجة";
      case "medical": return "صندوق المساعدات العلاجية والجراحية العاجلة";
      case "wells": return "صندوق آبار مياه الشرب النقية";
      default: return "الصدقة الجارية العامة للأشد احتياجاً";
    }
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-slate-200 shadow-xl relative overflow-hidden font-sans" dir="rtl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10 rounded-full"></div>
      
      <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-5">
        <div className="space-y-1 text-right">
          <h3 className="font-black text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>ربط محفظة Web3 (للمانحين الدوليين)</span>
          </h3>
          <p className="text-[10px] text-slate-400">
            تكامل مباشر مع محافظ العملات المستقرة (USDT/USDC) لدعم التبرعات الدولية فورياً.
          </p>
        </div>
        {walletConnected && (
          <button onClick={disconnectWallet} className="text-[10px] bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer">
            فصل المحفظة
          </button>
        )}
      </div>

      {!walletConnected ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-700 bg-slate-800/30 rounded-2xl gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
            <Activity className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-slate-300">لم يتم ربط أي محفظة حالياً</p>
          <div className="flex gap-2 text-[10px] text-slate-400">
            <span className="px-2 py-1 bg-slate-800 rounded">MetaMask</span>
            <span className="px-2 py-1 bg-slate-800 rounded">TrustWallet</span>
            <span className="px-2 py-1 bg-slate-800 rounded">WalletConnect</span>
          </div>
          <button
            onClick={connectWallet}
            className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            ربط محفظة Web3 تلقائياً
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">بيانات المحفظة المتصلة</h4>
              <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg font-mono text-[11px]">
                <span className="text-emerald-400 truncate w-32">{walletAddress}</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold">نشط (ERC20)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">رصيد USDT المتاح:</span>
                <span className="font-black text-white">{walletBalance.toFixed(2)} USDT</span>
              </div>
            </div>
            
            <div className="bg-slate-950 border border-emerald-900/50 rounded-xl p-4 space-y-3">
               <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ملخص التحويل</h4>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400">القيمة بالدينار:</span>
                 <span className="font-bold">{amountLyd.toLocaleString()} LYD</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400">القيمة المعادلة بـ USDT:</span>
                 <span className="font-black text-emerald-400">{usdtAmount} USDT</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400">الصندوق:</span>
                 <span className="font-bold text-slate-300 truncate max-w-[120px]">{getFundNameAr(selectedFund)}</span>
               </div>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1 border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold text-slate-400">متتبع حالة التحويل المباشر</span>
              {txStatus === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {txStatus !== "idle" && txStatus !== "success" && <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />}
            </div>
            <div className="h-28 overflow-y-auto font-mono text-[9px] text-slate-500 space-y-1.5 pr-2 custom-scrollbar text-right">
              {logs.length === 0 ? (
                <div className="text-center py-8 opacity-50">لا توجد عمليات جارية</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`${log.includes("✅") ? "text-emerald-400 font-bold" : ""} ${log.includes("خطأ") ? "text-rose-400" : ""}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={executeTransaction}
            disabled={txStatus !== "idle" && txStatus !== "success"}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {txStatus === "idle" || txStatus === "success" ? (
              <>
                <ShieldCheck className="w-5 h-5" />
                توقيع العقد الذكي والتبرع الفوري ({usdtAmount} USDT)
              </>
            ) : txStatus === "signing" ? (
              "يرجى الموافقة من نافذة المحفظة..."
            ) : txStatus === "broadcasting" ? (
              "جاري البث في الشبكة..."
            ) : (
              `جاري التأكيد (${confirmations}/3)...`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
