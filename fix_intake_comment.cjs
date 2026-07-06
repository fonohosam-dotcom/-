const fs = require('fs');
let code = fs.readFileSync('src/components/IntakePortal.tsx', 'utf8');

const regex = /<span>إدراج مستفيد جديد بالسجل الوطني<\/span>\s*<\/button>\s*<\/div>\*\/\}/;
code = code.replace(regex, '<span>إدراج مستفيد جديد بالسجل الوطني</span>\n        </button>\n      </div> */}');

fs.writeFileSync('src/components/IntakePortal.tsx', code);
