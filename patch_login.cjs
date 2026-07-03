const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  '  if (!password) {',
  '  if (user.isBanned) {\n    return res.status(403).json({ status: "error", message: "هذا الحساب محظور من استخدام المنظومة." });\n  }\n\n  if (!password) {'
);

fs.writeFileSync('server.ts', code);
