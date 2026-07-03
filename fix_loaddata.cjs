const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const [resCases, resProjects, resFunds, resLedger, resReports, resUsers, resFlags] = await Promise.all([',
  'const [resFlags, resCases, resProjects, resFunds, resLedger, resReports, resUsers] = await Promise.all(['
);

fs.writeFileSync('src/App.tsx', code);
