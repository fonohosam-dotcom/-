const fs = require('fs');
let code = fs.readFileSync('src/server/lib/legacyState.ts', 'utf8');
code = code.replace(/export \{ state, draftState, saveState \};/g, 'export { state, saveState };');
fs.writeFileSync('src/server/lib/legacyState.ts', code);

let routesCode = fs.readFileSync('src/server/routes/legacy.routes.ts', 'utf8');
routesCode = routesCode.replace(/import \{.*draftState.*\} from "\.\.\/lib\/legacyState\.js";/g, (match) => {
  return match.replace(/draftState, /, '');
});
fs.writeFileSync('src/server/routes/legacy.routes.ts', routesCode);
