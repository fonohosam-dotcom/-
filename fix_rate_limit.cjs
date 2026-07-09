const fs = require('fs');

let code = fs.readFileSync('src/server/lib/legacyState.ts', 'utf8');
const start = code.indexOf('// Simple, non-blocking IP rate limiter');
const end = code.indexOf('next();', start) + 9;

if (start !== -1 && end !== -1) {
  code = code.substring(0, start) + code.substring(end + 2); // removing the block
  fs.writeFileSync('src/server/lib/legacyState.ts', code);
}
