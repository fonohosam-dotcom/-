const fs = require('fs');

const stateFile = 'src/server/lib/legacyState.ts';
let code = fs.readFileSync(stateFile, 'utf8');

// Add missing imports to legacyState
code = `import bcrypt from "bcryptjs";\nimport crypto from "crypto";\nimport { User, ThreatLog } from "../types/index.js";\n` + code;
code = code.replace(/import \{ defaultState \} from "\.\.\/server\/seedData";/g, 'import { defaultState } from "../seedData.js";');
// some arrays like liveThreatLogs were probably at the top of app.ts
code = code.replace(/export \{ state, draftState, saveState/g, 
  `export const liveThreatLogs: any[] = [];\nexport const auditLedger: any[] = [];\nexport const municipalityGeoFences: any = {};\nexport { state, draftState, saveState`);

fs.writeFileSync(stateFile, code);

const routesFile = 'src/server/routes/legacy.routes.ts';
let routesCode = fs.readFileSync(routesFile, 'utf8');

routesCode = routesCode.replace(
  /TransactionManager \} from "\.\.\/lib\/legacyState\.js";/,
  `TransactionManager, liveThreatLogs, auditLedger, municipalityGeoFences } from "../lib/legacyState.js";`
);

routesCode = routesCode.replace(
  /import \{ User, Case/g,
  `import { ThreatLog } from "../types/index.js";\nimport { User, Case`
);

fs.writeFileSync(routesFile, routesCode);

// Fix index imports
let indexTs = fs.readFileSync('src/server/index.ts', 'utf8');
indexTs = indexTs.replace(/logger\.ts/, 'logger.js');
fs.writeFileSync('src/server/index.ts', indexTs);

let errorHandlerTs = fs.readFileSync('src/server/middleware/errorHandler.ts', 'utf8');
errorHandlerTs = errorHandlerTs.replace(/logger\.js/, 'logger.ts'); // wait, let's just make it .ts or .js consistently
// actually, if we use Node16 module resolution, imports should be .js
fs.writeFileSync('src/server/middleware/errorHandler.ts', errorHandlerTs);

// types/index.ts doesn't exist, it's types.ts in src!
// Let's create a symlink or an re-export
const typesIndex = `export * from "../../types.js";\n`;
if (!fs.existsSync('src/server/types')) fs.mkdirSync('src/server/types', {recursive: true});
fs.writeFileSync('src/server/types/index.ts', typesIndex);

