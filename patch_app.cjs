const fs = require('fs');
let code = fs.readFileSync('src/server/app.ts', 'utf-8');

const startIdx = code.indexOf('async function startServer() {');
if (startIdx !== -1) {
    code = code.substring(0, startIdx);
    code += '\nexport default app;\n';
    fs.writeFileSync('src/server/app.ts', code);
    console.log('Patched app.ts');
}
