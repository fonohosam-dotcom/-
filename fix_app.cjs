const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const s1 = `<button
                        onClick={() => handleSwitchProfile("researcher1@takaful.ly")}
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold py-2 rounded-xl text-[10px] cursor-pointer"
                      >
                        سريع: تجربة الباحث 🔍
                      </button>`;

const s2 = `<button
                        onClick={() => handleSwitchProfile("charity1@takaful.ly")}
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold py-2 rounded-xl text-[10px] cursor-pointer"
                      >
                        سريع: تجربة الجمعية 🏦
                      </button>`;

const s3 = `<button
                        onClick={() => handleSwitchProfile("admin@takaful.ly")}
                        className="flex-1 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 font-bold py-2 rounded-xl text-[10px] cursor-pointer"
                      >
                        سريع: تجربة الرقيب 👑
                      </button>`;

content = content.replace(s1, '');
content = content.replace(s2, '');
content = content.replace(s3, '');

fs.writeFileSync('src/App.tsx', content);
