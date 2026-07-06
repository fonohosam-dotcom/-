const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('scheduledVisitDate?: string;')) {
    code = code.replace(/assignedResearcherId\?: string;/, 'assignedResearcherId?: string;\n  scheduledVisitDate?: string;');
    fs.writeFileSync('src/types.ts', code);
}
