const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The file might contain multiple duplicate imports, let's just clean it up with regex
code = code.replace(/import helmet from "helmet";\n/g, '');
code = code.replace(/import rateLimit from "express-rate-limit";\n/g, '');

const fixedImports = `import helmet from "helmet";\nimport rateLimit from "express-rate-limit";\n`;

code = code.replace(/import express from "express";/, fixedImports + 'import express from "express";');

fs.writeFileSync('server.ts', code);
