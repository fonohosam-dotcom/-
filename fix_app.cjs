const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/className={`group relative w-full flex items-center justify-between p-2\.5 rounded-xl transition-all duration-300 font-extrabold text-xs cursor-pointer overflow-hidden \${[\s\S]*?isActive\s*\?\s*"bg-gradient-to-r from-emerald-950 to-emerald-900 border border-emerald-800\/50 shadow-\[0_0_15px_rgba\(16,185,129,0\.15\)\]"\s*:\s*"border border-transparent hover:bg-slate-800\/80 hover:border-slate-700 hover:shadow-lg"\s*}`}/g,
`className={\`group relative w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 font-extrabold text-xs cursor-pointer overflow-hidden \${
                          isActive
                            ? (isWorkspace ? "bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 shadow-[0_0_15px_rgba(66,133,244,0.15)]" : "bg-gradient-to-r from-emerald-950 to-emerald-900 border border-emerald-800/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]")
                            : "border border-transparent hover:bg-slate-800/80 hover:border-slate-700 hover:shadow-lg"
                        }\`}`);

content = content.replace(/<div className="absolute top-0 left-0 w-1 h-full \${isWorkspace \? 'bg-blue-500 shadow-\[0_0_10px_#4285F4\]' : 'bg-\[#10B981\] shadow-\[0_0_10px_#10B981\]'}"><\/div>/g,
`<div className={\`absolute top-0 left-0 w-1 h-full \${isWorkspace ? 'bg-blue-500 shadow-[0_0_10px_#4285F4]' : 'bg-[#10B981] shadow-[0_0_10px_#10B981]'}\`}></div>`);

content = content.replace(/className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 \${[\s\S]*?isActive[\s\S]*?\? `\$\{item.bgColor\} \$\{item.colorClass\} shadow-inner`[\s\S]*?: `bg-slate-900\/80 text-slate-400 group-hover:\$\{item.bgColor\} group-hover:\$\{item.colorClass\} group-hover:scale-110`[\s\S]*?}`}/g,
`className={\`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 \${
                            isActive
                               ? (isWorkspace ? "bg-white text-blue-600 shadow-inner" : \`\${item.bgColor} \${item.colorClass} shadow-inner\`)
                               : (isWorkspace ? "bg-slate-900/80 text-blue-400/70 group-hover:bg-white group-hover:text-blue-600 group-hover:scale-110" : \`bg-slate-900/80 text-slate-400 group-hover:\${item.bgColor} group-hover:\${item.colorClass} group-hover:scale-110\`)
                          }\`}`);

content = content.replace(/className={`transition-all duration-300 group-hover:text-white \${isActive \? "\$\{isWorkspace \? 'text-blue-400' : 'text-\[#10B981\]'\}" : "text-slate-300 group-hover:-translate-x-1"}`}/g,
`className={\`transition-all duration-300 group-hover:text-white \${isActive ? (isWorkspace ? 'text-blue-400' : 'text-[#10B981]') : "text-slate-300 group-hover:-translate-x-1"}\`}`);

fs.writeFileSync('src/App.tsx', content);
