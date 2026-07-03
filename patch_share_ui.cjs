const fs = require('fs');
const content = fs.readFileSync('src/components/DonorPortal.tsx', 'utf8');

const newUI = `
            {(() => {
              const userTransactions = dbTransactions.filter(t => t.donorId === user?.id);
              const totalContributions = userTransactions.reduce((sum, t) => sum + t.amount, 0);
              const uniqueCasesSupported = new Set(userTransactions.filter(t => t.caseId).map(t => t.caseId)).size;
              const uniqueProjectsSupported = new Set(userTransactions.filter(t => t.projectId).map(t => t.projectId)).size;
              const sortedTransactions = [...userTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              const handleShareText = async () => {
                const text = \`ساهمت بـ \${totalContributions.toLocaleString()} د.ل لدعم \${uniqueCasesSupported} حالة و \${uniqueProjectsSupported} مشروع عبر منصة التكافل! #أثر_يبقى\`;
                try {
                  await navigator.clipboard.writeText(text);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                } catch (err) {
                  console.error('Failed to copy', err);
                }
              };

              const handleShareImage = async () => {
                const el = document.getElementById("impact-summary-card");
                if (!el) return;
                setIsGeneratingImage(true);
                // Give React a moment to render any loading states if needed
                setTimeout(async () => {
                  try {
                    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
                    const url = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = "my_impact_takaful.png";
                    link.href = url;
                    link.click();
                  } catch(err) {
                    console.error('Failed to generate image', err);
                  } finally {
                    setIsGeneratingImage(false);
                  }
                }, 100);
              };

              return (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      ملخص الأثر الشخصي
                    </h2>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={handleShareText} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors">
                        {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? "تم النسخ!" : "نسخ النص"}
                      </button>
                      <button onClick={handleShareImage} disabled={isGeneratingImage} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50">
                        {isGeneratingImage ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                        {isGeneratingImage ? "جاري الحفظ..." : "حفظ كصورة"}
                      </button>
                    </div>
                  </div>

                  <div id="impact-summary-card" className="bg-white p-4 -mx-4 md:mx-0 md:p-6 rounded-2xl border border-[#E5E3DA] space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center justify-center text-center">
                        <Heart className="w-8 h-8 text-emerald-500 mb-2" />
                        <span className="text-3xl font-black text-emerald-700">{totalContributions.toLocaleString()} د.ل</span>
                        <span className="text-xs font-bold text-emerald-600 mt-1">إجمالي التبرعات</span>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center text-center">
                        <Award className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-3xl font-black text-blue-700">{uniqueCasesSupported}</span>
                        <span className="text-xs font-bold text-blue-600 mt-1">حالة تم دعمها</span>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex flex-col items-center justify-center text-center">
                        <Sparkles className="w-8 h-8 text-amber-500 mb-2" />
                        <span className="text-3xl font-black text-amber-700">{uniqueProjectsSupported}</span>
                        <span className="text-xs font-bold text-amber-600 mt-1">مشروع تمت المساهمة فيه</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-t pt-4">
                      <span>{new Date().toLocaleDateString('ar-LY')}</span>
                      <span>منصة التكافل - Takaful</span>
                    </div>
                  </div>
`;

let newContent = content.replace(
  /<h2 className="text-xl font-bold mb-6 flex items-center gap-2">[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-3 gap-4">/m,
  newUI
);

// We need to also clean up the closing tags for the return () since we added a wrapper around the top section.
// No, I added the header into the returned block of the IIFE. Let's see the regex match accurately.
fs.writeFileSync('src/components/DonorPortal.tsx', newContent);
