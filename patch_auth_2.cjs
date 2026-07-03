const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Fix hashPassword
code = code.replace(/function hashPassword\(password: string\): string \{\n  return bcrypt\.hashSync\(password, 10\);\n\}:.*\n\}/g, `function hashPassword(password: string): string {\n  return bcrypt.hashSync(password, 10);\n}`);

fs.writeFileSync('server.ts', code, 'utf-8');
