const fs = require('fs');
let code = fs.readFileSync('src/components/IntakePortal.tsx', 'utf8');

code = code.replace(/caseDetails\.status === "approved"/g, 'caseDetails.status === "committee_approved"');
code = code.replace(/caseDetails\.status === "active"/g, 'caseDetails.status === "committee_approved"');
code = code.replace(/caseDetails\.status === "pending"/g, 'caseDetails.status === "under_review"');

fs.writeFileSync('src/components/IntakePortal.tsx', code);
