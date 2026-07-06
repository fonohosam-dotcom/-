const fs = require('fs');
let code = fs.readFileSync('src/components/IntakePortal.tsx', 'utf8');

code = code.replace(/caseDetails\.\(family as any\)\.members\?\.length \|\| 1/g, '(caseDetails.family as any)?.members?.length');
code = code.replace(/caseDetails\.family \?\?\s*\(caseDetails\.family as any\)\?\.members\?\.length \> 0/g, 'caseDetails.family && (caseDetails.family as any)?.members?.length > 0');

fs.writeFileSync('src/components/IntakePortal.tsx', code);
