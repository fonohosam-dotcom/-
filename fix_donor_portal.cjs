const fs = require('fs');
let content = fs.readFileSync('src/components/DonorPortal.tsx', 'utf8');

const strToRemove = `                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center justify-center text-center">
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
                  </div>`;

content = content.replace(strToRemove, '');

const insertBeforeStr = `                  <div id="impact-summary-card" className="bg-white p-4 -mx-4 md:mx-0 md:p-6 rounded-2xl border border-[#E5E3DA] space-y-6">`;
const annualGoalUI = `                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
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
                  </div>\n\n`;

content = content.replace(insertBeforeStr, annualGoalUI + insertBeforeStr);

fs.writeFileSync('src/components/DonorPortal.tsx', content);
