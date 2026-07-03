const fs = require('fs');
const content = fs.readFileSync('src/components/DonorPortal.tsx', 'utf8');

const progressUI = `
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        هدف الأثر السنوي
                      </h3>
                      {!isEditingGoal && (
                        <button onClick={() => setIsEditingGoal(true)} className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          تعديل الهدف
                        </button>
                      )}
                    </div>
                    
                    {isEditingGoal ? (
                      <div className="flex gap-2 mb-4">
                        <input
                          type="number"
                          value={tempGoal}
                          onChange={(e) => setTempGoal(Number(e.target.value))}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button onClick={handleSaveGoal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">حفظ</button>
                        <button onClick={() => { setIsEditingGoal(false); setTempGoal(annualGoal); }} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">إلغاء</button>
                      </div>
                    ) : null}

                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">
                            {Math.min(100, Math.round((totalContributions / annualGoal) * 100))}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700">
                            {totalContributions.toLocaleString()} <span className="text-slate-400 font-normal">/ {annualGoal.toLocaleString()} د.ل</span>
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-indigo-100">
                        <div style={{ width: \`\${Math.min(100, (totalContributions / annualGoal) * 100)}%\` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
`;

const updatedContent = content.replace(
  '                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">',
  progressUI.trim()
);

fs.writeFileSync('src/components/DonorPortal.tsx', updatedContent);
