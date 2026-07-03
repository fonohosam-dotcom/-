const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/if \(\!admin\.apps\.length\) \{/g, '// @ts-ignore\n  if (!admin.apps.length) {');
code = code.replace(/db = admin\.firestore\(\);/g, '// @ts-ignore\n      db = admin.firestore();');

fs.writeFileSync('server.ts', code, 'utf-8');
