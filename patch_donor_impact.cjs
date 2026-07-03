const fs = require('fs');
const content = fs.readFileSync('src/components/DonorPortal.tsx', 'utf8');

let newContent = content.replace(
  'const [activeTab, setActiveTab] = useState<"dashboard" | "inbox">("dashboard");',
  'const [activeTab, setActiveTab] = useState<"dashboard" | "inbox" | "impact">("dashboard");'
);

const impactTabBtn = `
        <button
          onClick={() => setActiveTab("impact")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${
            activeTab === "impact" ? "bg-slate-950 text-white" : "text-slate-600 bg-white border border-slate-200"
          }\`}
        >
          أثري
        </button>
`;

newContent = newContent.replace(
  '        <button\n          onClick={() => setActiveTab("inbox")}',
  impactTabBtn + '        <button\n          onClick={() => setActiveTab("inbox")}'
);

const impactTabContent = `
      {activeTab === "impact" ? (
        <div className="space-y-6 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-[#E5E3DA] p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              ملخص الأثر الشخصي
            </h2>
            
            {(() => {
              const userTransactions = dbTransactions.filter(t => t.donorId === user?.id);
              const totalContributions = userTransactions.reduce((sum, t) => sum + t.amount, 0);
              const uniqueCasesSupported = new Set(userTransactions.filter(t => t.caseId).map(t => t.caseId)).size;
              const uniqueProjectsSupported = new Set(userTransactions.filter(t => t.projectId).map(t => t.projectId)).size;
              const sortedTransactions = [...userTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              return (
                <div className="space-y-8">
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

                  <div>
                    <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">الجدول الزمني لعطائك</h3>
                    {sortedTransactions.length === 0 ? (
                      <p className="text-slate-500 text-sm">لم تقم بأي مساهمات بعد.</p>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {sortedTransactions.map((t, idx) => {
                          const c = cases.find(c => c.id === t.caseId);
                          const p = projects.find(p => p.id === t.projectId);
                          const title = c ? \`مساهمة في حالة: \${c.caseNumber}\` : p ? \`دعم مشروع: \${p.title}\` : \`تبرع عام - \${t.fundType}\`;
                          
                          return (
                            <div key={t.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <Heart className="w-4 h-4" />
                              </div>
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-slate-800 text-sm">{title}</span>
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{t.amount} د.ل</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">{new Date(t.createdAt).toLocaleDateString("ar-LY")} - {new Date(t.createdAt).toLocaleTimeString("ar-LY", {hour: '2-digit', minute:'2-digit'})}</div>
                                <div className="text-xs text-slate-600 mt-2">
                                  {t.fundType} عبر {t.paymentMethod}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : activeTab === "inbox" ? (
`;

newContent = newContent.replace(
  '      {activeTab === "inbox" ? (',
  impactTabContent
);

fs.writeFileSync('src/components/DonorPortal.tsx', newContent);
