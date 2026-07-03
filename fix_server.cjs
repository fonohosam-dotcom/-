const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Move db declaration to top
code = code.replace(/let db = null;\n/, '');
code = code.replace(/let state: AppState;/, 'let state: AppState;\nlet db: any = null;\n');

// Fix admin import
code = code.replace(/import admin from "firebase-admin";/, 'import * as admin from "firebase-admin";');

// Fix export function error, "export" modifier cannot be used in a module unless it's properly typed or something. Wait, "export function" is valid in TS.
// Wait, why did it say "Modifiers cannot appear here"? Because I accidentally deleted `// -----------------------------------------` or something?
// Let's remove 'export ' from functions in server.ts since it's the main file anyway.
code = code.replace(/export function/g, 'function');

fs.writeFileSync('server.ts', code, 'utf-8');
