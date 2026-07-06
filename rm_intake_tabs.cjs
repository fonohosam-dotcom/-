const fs = require('fs');
let code = fs.readFileSync('src/components/IntakePortal.tsx', 'utf8');

const regex = /\{\/\* Sub tabs switcher for high usability \*\/\}\s*<div className="flex justify-start border-b border-\[#E5E3DA\] gap-2 p-1 bg-slate-100 rounded-2xl w-fit">[\s\S]*?<span>إدراج مستفيد جديد بالسجل الوطني<\/span>\s*<\/button>\s*<\/div>/;

code = code.replace(regex, '');
fs.writeFileSync('src/components/IntakePortal.tsx', code);
