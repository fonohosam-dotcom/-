sed -i 's/const isActive = activeTab === item.id;/const isActive = activeTab === item.id;\n                    const isWorkspace = item.id === "workspace";/g' src/App.tsx

sed -i 's/isActive ? "bg-gradient-to-r from-emerald-950 to-emerald-900 border border-emerald-800\/50 shadow-\[0_0_15px_rgba(16,185,129,0.15)\]"/isActive ? (isWorkspace ? "bg-gradient-to-r from-blue-950 to-slate-900 border border-blue-500\/30 shadow-[0_0_15px_rgba(66,133,244,0.15)]" : "bg-gradient-to-r from-emerald-950 to-emerald-900 border border-emerald-800\/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]")/g' src/App.tsx

sed -i 's/bg-\[#10B981\] shadow-\[0_0_10px_#10B981\]/${isWorkspace ? '"'"'bg-blue-500 shadow-[0_0_10px_#4285F4]'"'"' : '"'"'bg-[#10B981] shadow-[0_0_10px_#10B981]'"'"'}/g' src/App.tsx

sed -i 's/isActive\n                               ? `${item.bgColor} ${item.colorClass} shadow-inner`\n                               : `bg-slate-900\/80 text-slate-400 group-hover:${item.bgColor} group-hover:${item.colorClass} group-hover:scale-110`/isActive ? (isWorkspace ? "bg-white text-blue-600 shadow-inner" : `${item.bgColor} ${item.colorClass} shadow-inner`) : (isWorkspace ? "bg-slate-900\/80 text-blue-400\/70 group-hover:bg-white group-hover:text-blue-600 group-hover:scale-110" : `bg-slate-900\/80 text-slate-400 group-hover:${item.bgColor} group-hover:${item.colorClass} group-hover:scale-110`)/g' src/App.tsx

sed -i 's/text-\[#10B981\]/${isWorkspace ? '"'"'text-blue-400'"'"' : '"'"'text-[#10B981]'"'"'}/g' src/App.tsx

