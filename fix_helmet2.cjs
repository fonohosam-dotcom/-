const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.use\(helmet\(\{\n\s*contentSecurityPolicy: true, \/\/ Disabling for dev\/sandbox\n\}\)\);/g, `// Removed duplicate helmet`);

fs.writeFileSync('server.ts', code);
