const fs = require('fs');

const code = fs.readFileSync('server.ts', 'utf-8');

// The API logic starts after "const app = express();" and ends before "async function startServer() {"

const lines = code.split('\n');

let serverSetupEnd = -1;
let apiEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const app = express();')) {
    serverSetupEnd = i;
  }
  if (lines[i].includes('async function startServer() {')) {
    apiEnd = i;
    break;
  }
}

if (serverSetupEnd !== -1 && apiEnd !== -1) {
    const header = lines.slice(0, serverSetupEnd + 1).join('\n');
    const apiCode = lines.slice(serverSetupEnd + 1, apiEnd).join('\n');
    const footer = lines.slice(apiEnd).join('\n');

    fs.writeFileSync('src/server/api.ts', `import { Router } from 'express';\nimport { logger } from '../lib/logger.ts';\nimport { db } from '../db/index.js';\n\nconst apiRouter = Router();\n\n// We will refactor this to proper controllers later\n${apiCode.replace(/app\./g, 'apiRouter.')}\n\nexport default apiRouter;\n`);
    
    const newServerTs = `${header}\nimport apiRouter from "./src/server/api.ts";\napp.use("/api", apiRouter);\n\n${footer}`;
    fs.writeFileSync('server.ts', newServerTs);
    console.log('Successfully split server.ts');
} else {
    console.log('Could not find markers');
}
