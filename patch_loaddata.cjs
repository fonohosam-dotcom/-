const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const [resCases, resProjects, resFunds, resLedger, resReports, resUsers] = await Promise.all([',
  'const [resCases, resProjects, resFunds, resLedger, resReports, resUsers, resFlags] = await Promise.all([\n        fetchWithRetry("/api/feature-flags"),'
);

code = code.replace(
  'setUsers(resUsers);',
  'setUsers(resUsers);\n      if (resFlags && resFlags.flags) setFeatureFlags(resFlags.flags);'
);

fs.writeFileSync('src/App.tsx', code);
